const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const initSqlJs = require("sql.js");
const { WebSocketServer, WebSocket } = require("ws");
const { rateLimit } = require("express-rate-limit");
const { z } = require("zod");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const ENV_FILE = path.join(ROOT, ".env");
const ACCESS_COOKIE = "p2p_refresh";
const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

function loadConfiguration() {
  if (fs.existsSync(ENV_FILE)) {
    for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !Object.hasOwn(process.env, match[1])) {
        process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
      }
    }
  }

  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production.");
    }
    return process.env.JWT_SECRET;
  }

  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretsPath = path.join(DATA_DIR, "secrets.json");
  let secret;
  try {
    secret = JSON.parse(fs.readFileSync(secretsPath, "utf8")).jwtSecret;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!secret) {
    secret = crypto.randomBytes(48).toString("base64url");
    fs.writeFileSync(secretsPath, `${JSON.stringify({ jwtSecret: secret }, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  }
  return secret;
}

const JWT_SECRET = loadConfiguration();
const PORT = Number(process.env.PORT || 3000);
const JSON_DB_PATH = path.resolve(process.env.JSON_DB_PATH || path.join(DATA_DIR, "chat.json"));
const LEGACY_DB_PATH = path.resolve(process.env.DB_PATH || path.join(DATA_DIR, "chat.sqlite"));
fs.mkdirSync(path.dirname(JSON_DB_PATH), { recursive: true, mode: 0o700 });
let db;

function queryAll(sql, params = []) {
  const statement = db.prepare(sql);
  try {
    statement.bind(params);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

function persistJsonDatabase() {
  const schemaObjects = queryAll(
    "SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name"
  );
  const tables = {};
  for (const { name } of schemaObjects.filter((object) => object.type === "table")) {
    const quotedName = `"${name.replaceAll('"', '""')}"`;
    tables[name] = {
      schema: schemaObjects.find((object) => object.type === "table" && object.name === name).sql,
      columns: queryAll(`PRAGMA table_info(${quotedName})`),
      rows: queryAll(`SELECT * FROM ${quotedName}`).map((row) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [
          key,
          value instanceof Uint8Array
            ? { $type: "blob", base64: Buffer.from(value).toString("base64") }
            : value
        ]))
      )
    };
  }
  const contents = `${JSON.stringify({
    format: "wasel-json-db-v1",
    schema_objects: schemaObjects,
    tables
  }, null, 2)}\n`;
  const temporaryPath = `${JSON_DB_PATH}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, contents, { encoding: "utf8", mode: 0o600, flag: "wx" });
    const file = fs.openSync(temporaryPath, "r");
    try {
      fs.fsyncSync(file);
    } finally {
      fs.closeSync(file);
    }
    fs.renameSync(temporaryPath, JSON_DB_PATH);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

function importJsonDatabase(state) {
  if (!state || typeof state !== "object" || !state.tables || typeof state.tables !== "object") {
    throw new Error("JSON database has an invalid structure.");
  }
  const schemaObjects = Array.isArray(state.schema_objects)
    ? state.schema_objects
    : Object.entries(state.tables).map(([name, table]) => ({
      type: "table",
      name,
      tbl_name: name,
      sql: table.schema
    }));
  const tableObjects = schemaObjects.filter((object) => object.type === "table" && object.name !== "sqlite_sequence");

  db.run("PRAGMA foreign_keys = OFF");
  for (const object of tableObjects) {
    if (typeof object.sql === "string") db.run(object.sql);
  }

  for (const [name, table] of Object.entries(state.tables)) {
    if (name === "sqlite_sequence") continue;
    if (!Array.isArray(table.rows) || !tableObjects.some((object) => object.name === name)) continue;
    const quotedName = `"${name.replaceAll('"', '""')}"`;
    for (const row of table.rows) {
      const columns = Object.keys(row);
      if (!columns.length) continue;
      const quotedColumns = columns.map((column) => `"${column.replaceAll('"', '""')}"`).join(",");
      const placeholders = columns.map(() => "?").join(",");
      const values = columns.map((column) => {
        const value = row[column];
        if (value && value.$type === "blob" && typeof value.base64 === "string") {
          return Uint8Array.from(Buffer.from(value.base64, "base64"));
        }
        return value;
      });
      db.run(`INSERT INTO ${quotedName} (${quotedColumns}) VALUES (${placeholders})`, values);
    }
  }

  for (const object of schemaObjects.filter((item) =>
    ["index", "view", "trigger"].includes(item.type) && typeof item.sql === "string"
  )) {
    db.run(object.sql);
  }

  const sequences = state.tables.sqlite_sequence?.rows;
  if (Array.isArray(sequences) && sequences.length) {
    db.run("DELETE FROM sqlite_sequence");
    for (const sequence of sequences) {
      db.run("INSERT INTO sqlite_sequence(name,seq) VALUES(?,?)", [sequence.name, sequence.seq]);
    }
  }
  db.run("PRAGMA foreign_keys = ON");
}

async function initializeJsonDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  if (!fs.existsSync(JSON_DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
    throw new Error(`Legacy SQLite database found at ${LEGACY_DB_PATH}; export it to JSON and set JSON_DB_PATH before starting.`);
  }
  if (fs.existsSync(JSON_DB_PATH)) {
    let state;
    try {
      state = JSON.parse(fs.readFileSync(JSON_DB_PATH, "utf8"));
    } catch (error) {
      throw new Error(`Could not read JSON database at ${JSON_DB_PATH}: ${error.message}`);
    }
    importJsonDatabase(state);
  }
  persistJsonDatabase();
}

const run = async (sql, params = []) => {
  try {
    db.run(sql, params);
    const changes = db.getRowsModified();
    const lastID = queryAll("SELECT last_insert_rowid() AS id")[0]?.id || 0;
    persistJsonDatabase();
    return { lastID, changes };
  } catch (error) {
    if (/constraint failed/i.test(error.message)) error.code = "SQLITE_CONSTRAINT";
    throw error;
  }
};
const get = async (sql, params = []) => queryAll(sql, params)[0];
const all = async (sql, params = []) => queryAll(sql, params);

async function initializeDatabase() {
  await run("PRAGMA foreign_keys = ON");
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    about TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  )`);
  const userColumns = await all("PRAGMA table_info(users)");
  if (!userColumns.some((column) => column.name === "display_name")) await run("ALTER TABLE users ADD COLUMN display_name TEXT");
  if (!userColumns.some((column) => column.name === "about")) await run("ALTER TABLE users ADD COLUMN about TEXT NOT NULL DEFAULT ''");
  await run(`CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    revoked_at INTEGER
  )`);
  await run(`CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    UNIQUE(sender_id, recipient_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS friendships (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY(user_id, friend_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS blocks (
    blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY(blocker_id, blocked_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS login_attempts (
    username_key TEXT PRIMARY KEY,
    failures INTEGER NOT NULL,
    locked_until INTEGER NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS chat_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS group_members (
    group_id INTEGER NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('owner','admin','member')),
    joined_at INTEGER NOT NULL,
    PRIMARY KEY(group_id,user_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES chat_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    reply_to INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL,
    delivered_at INTEGER,
    read_at INTEGER,
    CHECK((recipient_id IS NOT NULL AND group_id IS NULL) OR (recipient_id IS NULL AND group_id IS NOT NULL))
  )`);
  await run(`CREATE TABLE IF NOT EXISTS deleted_messages (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id,message_id)
  )`);
  await run("CREATE INDEX IF NOT EXISTS refresh_tokens_expiry ON refresh_tokens(expires_at)");
  await run("CREATE INDEX IF NOT EXISTS messages_direct_order ON messages(sender_id,recipient_id,created_at)");
  await run("CREATE INDEX IF NOT EXISTS messages_group_order ON messages(group_id,created_at)");
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 128 * 1024 });
const online = new Map();
const callRooms = new Map();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use((req, res, next) => helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", `${req.protocol === "https" ? "wss" : "ws"}://${req.get("host")}`],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: process.env.NODE_ENV === "production" ? { maxAge: 31536000, includeSubDomains: true } : false
})(req, res, () => {
  res.setHeader("Permissions-Policy", "microphone=(self), display-capture=(self), camera=()");
  next();
}));
app.use(express.json({ limit: "16kb", strict: true }));
app.use(cookieParser());
app.use(express.static(path.join(ROOT, "..", "client"), { index: "index.html", maxAge: 0 }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "RATE_LIMITED" }
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "RATE_LIMITED" }
});
app.use("/api", apiLimiter);

function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  const expected = `${req.protocol}://${req.get("host")}`;
  if (!origin || origin !== expected || req.get("x-requested-with") !== "XMLHttpRequest") {
    return res.status(403).json({ error: "ORIGIN_FORBIDDEN" });
  }
  next();
}

const accessTokenFor = (user) => jwt.sign({ sub: String(user.id), username: user.username }, JWT_SECRET, { expiresIn: ACCESS_TTL });
const tokenDigest = (token) => crypto.createHash("sha256").update(token).digest("hex");
function setRefreshCookie(res, token) {
  res.cookie(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_TTL_MS
  });
}
function clearRefreshCookie(res) {
  res.clearCookie(ACCESS_COOKIE, { httpOnly: true, secure: true, sameSite: "strict", path: "/api/auth" });
}
async function createSession(user, familyId = crypto.randomUUID()) {
  const refresh = crypto.randomBytes(48).toString("base64url");
  await run("INSERT INTO refresh_tokens(token_hash,user_id,family_id,expires_at) VALUES(?,?,?,?)", [
    tokenDigest(refresh), user.id, familyId, Date.now() + REFRESH_TTL_MS
  ]);
  return { refresh, access: accessTokenFor(user) };
}
function authenticate(req, res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
function validate(schema, input) {
  const parsed = schema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

const credentialsSchema = z.object({
  username: z.string().regex(USERNAME),
  password: z.string().min(8).max(128)
}).strict();
const requestSchema = z.object({ username: z.string().regex(USERNAME) }).strict();
const idSchema = z.object({ id: z.number().int().positive() }).strict();

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/rtc-config", authenticate, (_req, res) => {
  const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
  const { TURN_URL, TURN_USERNAME, TURN_CREDENTIAL } = process.env;
  if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
    iceServers.push({ urls: TURN_URL.split(",").map((url) => url.trim()).filter(Boolean), username: TURN_USERNAME, credential: TURN_CREDENTIAL });
  }
  res.setHeader("Cache-Control", "no-store");
  res.json({ iceServers });
});

app.post("/api/auth/signup", sameOrigin, authLimiter, async (req, res, next) => {
  const body = validate(credentialsSchema, req.body);
  if (!body) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const key = body.username.toLowerCase();
    const hash = await bcrypt.hash(body.password, 12);
    const result = await run("INSERT INTO users(username,username_key,password_hash,created_at) VALUES(?,?,?,?)", [
      body.username, key, hash, Date.now()
    ]);
    const user = { id: result.lastID, username: body.username };
    const session = await createSession(user);
    setRefreshCookie(res, session.refresh);
    res.status(201).json({ accessToken: session.access, user });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT") return res.status(409).json({ error: "USERNAME_UNAVAILABLE" });
    next(error);
  }
});

app.post("/api/auth/login", sameOrigin, authLimiter, async (req, res, next) => {
  const body = validate(credentialsSchema, req.body);
  if (!body) return res.status(400).json({ error: "INVALID_INPUT" });
  const key = body.username.toLowerCase();
  try {
    const attempt = await get("SELECT failures,locked_until FROM login_attempts WHERE username_key=?", [key]);
    if (attempt && attempt.locked_until > Date.now()) return res.status(429).json({ error: "LOGIN_LOCKED" });
    const user = await get("SELECT id,username,password_hash FROM users WHERE username_key=?", [key]);
    const valid = await bcrypt.compare(body.password, user?.password_hash || "$2b$12$C6UzMDM.H6dfI/f/IKcEe.8k0I3M8V5YdZ0sD5JwM5pYmWv7Q/f3K");
    if (!user || !valid) {
      const failures = (attempt?.failures || 0) + 1;
      const lockedUntil = failures >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
      await run(`INSERT INTO login_attempts(username_key,failures,locked_until) VALUES(?,?,?)
        ON CONFLICT(username_key) DO UPDATE SET failures=excluded.failures,locked_until=excluded.locked_until`, [key, failures, lockedUntil]);
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }
    await run("DELETE FROM login_attempts WHERE username_key=?", [key]);
    const session = await createSession(user);
    setRefreshCookie(res, session.refresh);
    res.json({ accessToken: session.access, user: { id: user.id, username: user.username } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/refresh", sameOrigin, async (req, res, next) => {
  const token = req.cookies[ACCESS_COOKIE];
  if (!token) return res.status(401).json({ error: "SESSION_EXPIRED" });
  try {
    const digest = tokenDigest(token);
    const current = await get("SELECT user_id,family_id,expires_at,revoked_at FROM refresh_tokens WHERE token_hash=?", [digest]);
    if (!current) {
      clearRefreshCookie(res);
      return res.status(401).json({ error: "SESSION_EXPIRED" });
    }
    if (current.revoked_at) {
      await run("UPDATE refresh_tokens SET revoked_at=? WHERE family_id=? AND revoked_at IS NULL", [Date.now(), current.family_id]);
      clearRefreshCookie(res);
      return res.status(401).json({ error: "SESSION_REUSE_DETECTED" });
    }
    if (current.expires_at <= Date.now()) {
      await run("UPDATE refresh_tokens SET revoked_at=? WHERE token_hash=?", [Date.now(), digest]);
      clearRefreshCookie(res);
      return res.status(401).json({ error: "SESSION_EXPIRED" });
    }
    const user = await get("SELECT id,username FROM users WHERE id=?", [current.user_id]);
    const revoke = await run("UPDATE refresh_tokens SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL", [Date.now(), digest]);
    if (!revoke.changes) {
      await run("UPDATE refresh_tokens SET revoked_at=? WHERE family_id=? AND revoked_at IS NULL", [Date.now(), current.family_id]);
      clearRefreshCookie(res);
      return res.status(401).json({ error: "SESSION_REUSE_DETECTED" });
    }
    const session = await createSession(user, current.family_id);
    setRefreshCookie(res, session.refresh);
    res.json({ accessToken: session.access, user });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", sameOrigin, async (req, res, next) => {
  try {
    const token = req.cookies[ACCESS_COOKIE];
    if (token) await run("UPDATE refresh_tokens SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL", [Date.now(), tokenDigest(token)]);
    clearRefreshCookie(res);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", authenticate, async (req, res, next) => {
  try {
    const user = await get("SELECT id,username,COALESCE(display_name,username) AS display_name,about,created_at FROM users WHERE id=?", [Number(req.user.sub)]);
    if (!user) return res.status(401).json({ error: "UNAUTHORIZED" });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/profile", sameOrigin, authenticate, async (req, res, next) => {
  const schema = z.object({
    displayName: z.string().trim().min(1).max(40),
    about: z.string().trim().max(140)
  }).strict();
  const body = validate(schema, req.body);
  if (!body) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    await run("UPDATE users SET display_name=?,about=? WHERE id=?", [body.displayName, body.about, Number(req.user.sub)]);
    res.json({ user: { id: Number(req.user.sub), username: req.user.username, display_name: body.displayName, about: body.about } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/chats", authenticate, async (req, res, next) => {
  const uid = Number(req.user.sub);
  try {
    const friends = await all(`SELECT u.id,u.username,COALESCE(u.display_name,u.username) AS display_name,u.about
      FROM friendships f JOIN users u ON u.id=f.friend_id WHERE f.user_id=? ORDER BY display_name COLLATE NOCASE`, [uid]);
    const groups = await all(`SELECT g.id,g.name,gm.role FROM group_members gm JOIN chat_groups g ON g.id=gm.group_id
      WHERE gm.user_id=? ORDER BY g.name COLLATE NOCASE`, [uid]);
    const chats = [];
    for (const friend of friends) {
      const last = await get(`SELECT id,content,created_at,sender_id FROM messages
        WHERE group_id IS NULL AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?))
        ORDER BY id DESC LIMIT 1`, [uid, friend.id, friend.id, uid]);
      const unread = await get(`SELECT COUNT(*) AS count FROM messages m WHERE m.sender_id=? AND m.recipient_id=?
        AND m.read_at IS NULL AND NOT EXISTS (SELECT 1 FROM deleted_messages d WHERE d.message_id=m.id AND d.user_id=?)`,
      [friend.id, uid, uid]);
      chats.push({ key: `u:${friend.id}`, type: "direct", id: friend.id, name: friend.display_name, username: friend.username,
        about: friend.about, online: Boolean(online.get(friend.id)?.size), lastMessage: last?.content || "", lastAt: last?.created_at || 0,
        unread: unread.count, lastSenderId: last?.sender_id || null });
    }
    for (const group of groups) {
      const last = await get("SELECT id,content,created_at,sender_id FROM messages WHERE group_id=? ORDER BY id DESC LIMIT 1", [group.id]);
      const unread = await get(`SELECT COUNT(*) AS count FROM messages m WHERE m.group_id=? AND m.sender_id<>? AND m.read_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM deleted_messages d WHERE d.message_id=m.id AND d.user_id=?)`, [group.id, uid, uid]);
      const activeCall = callRooms.get(`g:${group.id}`);
      chats.push({ key: `g:${group.id}`, type: "group", id: group.id, name: group.name, role: group.role,
        lastMessage: last?.content || "", lastAt: last?.created_at || 0, unread: unread.count, lastSenderId: last?.sender_id || null,
        callInProgress: Boolean(activeCall), callId: activeCall?.callId || null, callKind: activeCall?.kind || null });
    }
    chats.sort((a, b) => b.lastAt - a.lastAt || a.name.localeCompare(b.name));
    res.json({ chats });
  } catch (error) {
    next(error);
  }
});

const groupSchema = z.object({ name: z.string().trim().min(2).max(60), memberIds: z.array(z.number().int().positive()).max(20).default([]) }).strict();
app.post("/api/groups", sameOrigin, authenticate, async (req, res, next) => {
  const body = validate(groupSchema, req.body);
  if (!body) return res.status(400).json({ error: "INVALID_INPUT" });
  const uid = Number(req.user.sub);
  try {
    const memberIds = [...new Set(body.memberIds)].filter((id) => id !== uid);
    for (const memberId of memberIds) {
      const friendship = await get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [uid, memberId]);
      if (!friendship) return res.status(403).json({ error: "GROUP_MEMBERS_MUST_BE_FRIENDS" });
    }
    const result = await run("INSERT INTO chat_groups(name,owner_id,created_at) VALUES(?,?,?)", [body.name, uid, Date.now()]);
    await run("INSERT INTO group_members(group_id,user_id,role,joined_at) VALUES(?,?,?,?)", [result.lastID, uid, "owner", Date.now()]);
    for (const memberId of memberIds) await run("INSERT INTO group_members(group_id,user_id,role,joined_at) VALUES(?,?,?,?)", [result.lastID, memberId, "member", Date.now()]);
    res.status(201).json({ group: { id: result.lastID, name: body.name } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/groups/:id/members", authenticate, async (req, res, next) => {
  const groupId = Number(req.params.id), uid = Number(req.user.sub);
  if (!Number.isSafeInteger(groupId) || groupId < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const membership = await get("SELECT 1 FROM group_members WHERE group_id=? AND user_id=?", [groupId, uid]);
    if (!membership) return res.status(404).json({ error: "GROUP_NOT_FOUND" });
    const members = await all(`SELECT u.id,u.username,COALESCE(u.display_name,u.username) AS display_name,gm.role
      FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=? ORDER BY gm.role,display_name COLLATE NOCASE`, [groupId]);
    res.json({ members });
  } catch (error) {
    next(error);
  }
});

app.post("/api/groups/:id/members", sameOrigin, authenticate, async (req, res, next) => {
  const groupId = Number(req.params.id), uid = Number(req.user.sub);
  const body = validate(z.object({ userId: z.number().int().positive() }).strict(), req.body);
  if (!body || !Number.isSafeInteger(groupId) || groupId < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const actor = await get("SELECT role FROM group_members WHERE group_id=? AND user_id=?", [groupId, uid]);
    if (!actor || !["owner", "admin"].includes(actor.role)) return res.status(403).json({ error: "ACTION_NOT_ALLOWED" });
    const friendship = await get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [uid, body.userId]);
    if (!friendship) return res.status(403).json({ error: "GROUP_MEMBERS_MUST_BE_FRIENDS" });
    await run("INSERT OR IGNORE INTO group_members(group_id,user_id,role,joined_at) VALUES(?,?,?,?)", [groupId, body.userId, "member", Date.now()]);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/groups/:id/members/:userId", sameOrigin, authenticate, async (req, res, next) => {
  const groupId = Number(req.params.id), targetId = Number(req.params.userId), uid = Number(req.user.sub);
  const body = validate(z.object({ role: z.enum(["admin", "member", "owner"]) }).strict(), req.body);
  if (!body || !Number.isSafeInteger(groupId) || groupId < 1 || !Number.isSafeInteger(targetId) || targetId < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const actor = await get("SELECT role FROM group_members WHERE group_id=? AND user_id=?", [groupId, uid]);
    const target = await get("SELECT role FROM group_members WHERE group_id=? AND user_id=?", [groupId, targetId]);
    if (!actor || actor.role !== "owner" || !target) return res.status(403).json({ error: "ACTION_NOT_ALLOWED" });
    if (body.role === "owner") {
      await run("UPDATE group_members SET role='admin' WHERE group_id=? AND user_id=?", [groupId, uid]);
      await run("UPDATE group_members SET role='owner' WHERE group_id=? AND user_id=?", [groupId, targetId]);
      await run("UPDATE chat_groups SET owner_id=? WHERE id=?", [targetId, groupId]);
    } else {
      if (target.role === "owner") return res.status(400).json({ error: "TRANSFER_OWNERSHIP_FIRST" });
      await run("UPDATE group_members SET role=? WHERE group_id=? AND user_id=?", [body.role, groupId, targetId]);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/groups/:id/members/:userId", sameOrigin, authenticate, async (req, res, next) => {
  const groupId = Number(req.params.id), targetId = Number(req.params.userId), uid = Number(req.user.sub);
  if (!Number.isSafeInteger(groupId) || groupId < 1 || !Number.isSafeInteger(targetId) || targetId < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const actor = await get("SELECT role FROM group_members WHERE group_id=? AND user_id=?", [groupId, uid]);
    const target = await get("SELECT role FROM group_members WHERE group_id=? AND user_id=?", [groupId, targetId]);
    if (!actor || !target || (targetId !== uid && !["owner", "admin"].includes(actor.role)) || (target.role === "owner" && targetId !== uid)) {
      return res.status(403).json({ error: "ACTION_NOT_ALLOWED" });
    }
    await run("DELETE FROM group_members WHERE group_id=? AND user_id=?", [groupId, targetId]);
    const activeCall = callRooms.get(`g:${groupId}`);
    if (activeCall?.participants.has(targetId)) removeCallParticipant(activeCall, targetId, targetId === uid ? "left" : "removed");
    else if (activeCall?.invited.delete(targetId)) {
      emitUser(targetId, "call:ended", { chatKey: activeCall.chatKey, callId: activeCall.callId, reason: "removed" });
    }
    if (targetId === uid) {
      const owner = await get("SELECT user_id FROM group_members WHERE group_id=? AND role='owner'", [groupId]);
      if (!owner) {
        const nextAdmin = await get("SELECT user_id FROM group_members WHERE group_id=? ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END,joined_at LIMIT 1", [groupId]);
        if (nextAdmin) {
          await run("UPDATE group_members SET role='owner' WHERE group_id=? AND user_id=?", [groupId, nextAdmin.user_id]);
          await run("UPDATE chat_groups SET owner_id=? WHERE id=?", [nextAdmin.user_id, groupId]);
        } else {
          await run("DELETE FROM chat_groups WHERE id=?", [groupId]);
        }
      }
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

function parseChatKey(value) {
  const match = /^(u|g):([1-9]\d*)$/.exec(value);
  if (!match) return null;
  const id = Number(match[2]);
  return Number.isSafeInteger(id) ? { type: match[1] === "u" ? "direct" : "group", id } : null;
}

async function authorizeChat(uid, chat) {
  if (chat.type === "direct") {
    if (uid === chat.id) return false;
    const [friendship, blocked] = await Promise.all([
      get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [uid, chat.id]),
      get("SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", [uid, chat.id, chat.id, uid])
    ]);
    return Boolean(friendship && !blocked);
  }
  const membership = await get("SELECT 1 FROM group_members WHERE group_id=? AND user_id=?", [chat.id, uid]);
  return Boolean(membership);
}

app.get("/api/chats/:chatKey/messages", authenticate, async (req, res, next) => {
  const chat = parseChatKey(req.params.chatKey), uid = Number(req.user.sub);
  if (!chat) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    if (!await authorizeChat(uid, chat)) return res.status(404).json({ error: "CHAT_NOT_FOUND" });
    const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);
    const before = req.query.before ? Number(req.query.before) : Number.MAX_SAFE_INTEGER;
    if (!Number.isSafeInteger(before) || before < 1) return res.status(400).json({ error: "INVALID_INPUT" });
    const where = chat.type === "direct"
      ? "m.group_id IS NULL AND ((m.sender_id=? AND m.recipient_id=?) OR (m.sender_id=? AND m.recipient_id=?))"
      : "m.group_id=?";
    const params = chat.type === "direct" ? [uid, chat.id, chat.id, uid, before, uid, limit] : [chat.id, before, uid, limit];
    const rows = await all(`SELECT m.id,m.sender_id,m.recipient_id,m.group_id,m.content,m.reply_to,m.created_at,m.delivered_at,m.read_at,
      COALESCE(u.display_name,u.username) AS sender_name,r.content AS reply_content
      FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN messages r ON r.id=m.reply_to
      WHERE ${where} AND m.id<? AND NOT EXISTS(SELECT 1 FROM deleted_messages d WHERE d.message_id=m.id AND d.user_id=?)
      ORDER BY m.id DESC LIMIT ?`, params);
    await run(chat.type === "direct"
      ? "UPDATE messages SET delivered_at=COALESCE(delivered_at,?),read_at=? WHERE sender_id=? AND recipient_id=? AND read_at IS NULL"
      : "UPDATE messages SET delivered_at=COALESCE(delivered_at,?),read_at=? WHERE group_id=? AND sender_id<>? AND read_at IS NULL",
    chat.type === "direct" ? [Date.now(), Date.now(), chat.id, uid] : [Date.now(), Date.now(), chat.id, uid]);
    res.json({ messages: rows.reverse() });
  } catch (error) {
    next(error);
  }
});

app.post("/api/chats/:chatKey/messages", sameOrigin, authenticate, async (req, res, next) => {
  const chat = parseChatKey(req.params.chatKey), uid = Number(req.user.sub);
  const body = validate(z.object({ content: z.string().trim().min(1).max(4000), replyTo: z.number().int().positive().nullable().optional() }).strict(), req.body);
  if (!chat || !body) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    if (!await authorizeChat(uid, chat)) return res.status(404).json({ error: "CHAT_NOT_FOUND" });
    if (body.replyTo) {
      const parent = await get("SELECT id FROM messages WHERE id=? AND (group_id=? OR (group_id IS NULL AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?))))",
        chat.type === "group" ? [body.replyTo, chat.id] : [body.replyTo, -1, uid, chat.id, chat.id, uid]);
      if (!parent) return res.status(404).json({ error: "MESSAGE_NOT_FOUND" });
    }
    const result = chat.type === "direct"
      ? await run("INSERT INTO messages(sender_id,recipient_id,content,reply_to,created_at) VALUES(?,?,?,?,?)", [uid, chat.id, body.content, body.replyTo || null, Date.now()])
      : await run("INSERT INTO messages(sender_id,group_id,content,reply_to,created_at) VALUES(?,?,?,?,?)", [uid, chat.id, body.content, body.replyTo || null, Date.now()]);
    const saved = await get(`SELECT m.id,m.sender_id,m.recipient_id,m.group_id,m.content,m.reply_to,m.created_at,
      COALESCE(u.display_name,u.username) AS sender_name,r.content AS reply_content FROM messages m
      JOIN users u ON u.id=m.sender_id LEFT JOIN messages r ON r.id=m.reply_to WHERE m.id=?`, [result.lastID]);
    const recipients = chat.type === "direct" ? [chat.id] : (await all("SELECT user_id FROM group_members WHERE group_id=? AND user_id<>?", [chat.id, uid])).map((row) => row.user_id);
    for (const recipientId of recipients) {
      for (const socket of online.get(recipientId) || []) sendSocket(socket, "message", { chatKey: req.params.chatKey, message: saved });
    }
    res.status(201).json({ message: saved });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/chats/:chatKey/messages/:messageId", sameOrigin, authenticate, async (req, res, next) => {
  const chat = parseChatKey(req.params.chatKey), uid = Number(req.user.sub), messageId = Number(req.params.messageId);
  if (!chat || !Number.isSafeInteger(messageId) || messageId < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    if (!await authorizeChat(uid, chat)) return res.status(404).json({ error: "CHAT_NOT_FOUND" });
    const condition = chat.type === "group" ? "group_id=?" : "group_id IS NULL AND ((sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?))";
    const params = chat.type === "group" ? [messageId, chat.id] : [messageId, uid, chat.id, chat.id, uid];
    const found = await get(`SELECT id FROM messages WHERE id=? AND ${condition}`, params);
    if (!found) return res.status(404).json({ error: "MESSAGE_NOT_FOUND" });
    await run("INSERT OR IGNORE INTO deleted_messages(user_id,message_id) VALUES(?,?)", [uid, messageId]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/friends/search", authenticate, async (req, res, next) => {
  const parsed = requestSchema.safeParse({ username: req.query.username });
  if (!parsed.success) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const user = await get(`SELECT id,username FROM users WHERE username_key=? AND id<>?
      AND NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=users.id) OR (blocker_id=users.id AND blocked_id=?))`,
    [parsed.data.username.toLowerCase(), Number(req.user.sub), Number(req.user.sub), Number(req.user.sub)]);
    res.json({ user: user || null });
  } catch (error) {
    next(error);
  }
});

app.get("/api/friends", authenticate, async (req, res, next) => {
  try {
    const uid = Number(req.user.sub);
    const [friends, incoming, outgoing] = await Promise.all([
      all("SELECT u.id,u.username FROM friendships f JOIN users u ON u.id=f.friend_id WHERE f.user_id=? ORDER BY u.username COLLATE NOCASE", [uid]),
      all("SELECT r.id,u.id AS user_id,u.username FROM friend_requests r JOIN users u ON u.id=r.sender_id WHERE r.recipient_id=? ORDER BY r.created_at", [uid]),
      all("SELECT r.id,u.id AS user_id,u.username FROM friend_requests r JOIN users u ON u.id=r.recipient_id WHERE r.sender_id=? ORDER BY r.created_at", [uid])
    ]);
    res.json({ friends, incoming, outgoing });
  } catch (error) {
    next(error);
  }
});

app.get("/api/friends/blocked", authenticate, async (req, res, next) => {
  try {
    const blocked = await all("SELECT u.id,u.username FROM blocks b JOIN users u ON u.id=b.blocked_id WHERE b.blocker_id=? ORDER BY u.username COLLATE NOCASE", [Number(req.user.sub)]);
    res.json({ blocked });
  } catch (error) {
    next(error);
  }
});

app.post("/api/friends/requests", sameOrigin, authenticate, async (req, res, next) => {
  const body = validate(requestSchema, req.body);
  if (!body) return res.status(400).json({ error: "INVALID_INPUT" });
  const uid = Number(req.user.sub);
  try {
    const target = await get("SELECT id FROM users WHERE username_key=?", [body.username.toLowerCase()]);
    if (!target || target.id === uid) return res.status(404).json({ error: "USER_NOT_FOUND" });
    const blocked = await get("SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", [uid, target.id, target.id, uid]);
    if (blocked) return res.status(403).json({ error: "ACTION_NOT_ALLOWED" });
    const exists = await get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [uid, target.id]);
    if (exists) return res.status(409).json({ error: "ALREADY_FRIENDS" });
    const pending = await get("SELECT id FROM friend_requests WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)", [uid, target.id, target.id, uid]);
    if (pending) return res.status(409).json({ error: "REQUEST_EXISTS" });
    await run("INSERT INTO friend_requests(sender_id,recipient_id,created_at) VALUES(?,?,?)", [uid, target.id, Date.now()]);
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/friends/requests/:id/accept", sameOrigin, authenticate, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  const uid = Number(req.user.sub);
  try {
    const request = await get("SELECT sender_id FROM friend_requests WHERE id=? AND recipient_id=?", [id, uid]);
    if (!request) return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
    const blocked = await get("SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", [uid, request.sender_id, request.sender_id, uid]);
    await run("DELETE FROM friend_requests WHERE id=?", [id]);
    if (blocked) return res.status(403).json({ error: "ACTION_NOT_ALLOWED" });
    await run("INSERT OR IGNORE INTO friendships(user_id,friend_id,created_at) VALUES(?,?,?)", [uid, request.sender_id, Date.now()]);
    await run("INSERT OR IGNORE INTO friendships(user_id,friend_id,created_at) VALUES(?,?,?)", [request.sender_id, uid, Date.now()]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/friends/requests/:id", sameOrigin, authenticate, async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const result = await run("DELETE FROM friend_requests WHERE id=? AND (sender_id=? OR recipient_id=?)", [id, Number(req.user.sub), Number(req.user.sub)]);
    if (!result.changes) return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.delete("/api/friends/:id", sameOrigin, authenticate, async (req, res, next) => {
  const friendId = Number(req.params.id);
  const uid = Number(req.user.sub);
  if (!Number.isSafeInteger(friendId) || friendId < 1 || friendId === uid) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const result = await run("DELETE FROM friendships WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)", [uid, friendId, friendId, uid]);
    if (!result.changes) return res.status(404).json({ error: "USER_NOT_FOUND" });
    endDirectCallsBetween(uid, friendId, "friendship-ended");
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post("/api/friends/:id/block", sameOrigin, authenticate, async (req, res, next) => {
  const blockedId = Number(req.params.id);
  const uid = Number(req.user.sub);
  if (!Number.isSafeInteger(blockedId) || blockedId < 1 || blockedId === uid) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    const user = await get("SELECT 1 FROM users WHERE id=?", [blockedId]);
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
    await run("INSERT OR IGNORE INTO blocks(blocker_id,blocked_id,created_at) VALUES(?,?,?)", [uid, blockedId, Date.now()]);
    await run("DELETE FROM friend_requests WHERE (sender_id=? AND recipient_id=?) OR (sender_id=? AND recipient_id=?)", [uid, blockedId, blockedId, uid]);
    await run("DELETE FROM friendships WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)", [uid, blockedId, blockedId, uid]);
    endDirectCallsBetween(uid, blockedId, "blocked");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/friends/:id/block", sameOrigin, authenticate, async (req, res, next) => {
  const blockedId = Number(req.params.id);
  if (!Number.isSafeInteger(blockedId) || blockedId < 1 || blockedId === Number(req.user.sub)) return res.status(400).json({ error: "INVALID_INPUT" });
  try {
    await run("DELETE FROM blocks WHERE blocker_id=? AND blocked_id=?", [Number(req.user.sub), blockedId]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

function sendSocket(socket, event, data) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ event, data }));
}

function sendCallError(socket, code, chatKey = null, callId = null) {
  sendSocket(socket, "call:error", {
    code,
    chatKey: typeof chatKey === "string" ? chatKey.slice(0, 64) : null,
    callId: typeof callId === "string" ? callId.slice(0, 64) : null
  });
}

function socketsFor(userId) {
  return online.get(userId) || [];
}

function emitUser(userId, event, data) {
  for (const socket of socketsFor(userId)) sendSocket(socket, event, data);
}

function emitRoom(room, event, data, exceptUserId = null) {
  for (const userId of room.participants) {
    if (userId === exceptUserId) continue;
    const callSocket = room.callSockets.get(userId);
    if (callSocket) sendSocket(callSocket, event, data);
    else emitUser(userId, event, data);
  }
}

function endCallRoom(room, reason) {
  if (callRooms.get(room.chatKey) !== room) return;
  clearTimeout(room.ringTimer);
  callRooms.delete(room.chatKey);
  emitRoom(room, "call:ended", { chatKey: room.chatKey, callId: room.callId, reason });
  for (const userId of room.invited) {
    if (!room.participants.has(userId)) emitUser(userId, "call:ended", { chatKey: room.chatKey, callId: room.callId, reason });
  }
  if (room.chat.type === "group") {
    all("SELECT user_id FROM group_members WHERE group_id=?", [room.chat.id]).then((members) => {
      for (const member of members) emitUser(member.user_id, "call:room-state", {
        chatKey: room.chatKey, inProgress: false, callId: null, kind: null
      });
    }).catch((error) => console.error("Could not clear group call status:", error.message));
  }
}

function endDirectCallsBetween(firstUserId, secondUserId, reason) {
  for (const room of callRooms.values()) {
    if (room.chat.type === "direct" &&
      [room.creatorId, room.chat.id].includes(firstUserId) &&
      [room.creatorId, room.chat.id].includes(secondUserId)) {
      endCallRoom(room, reason);
    }
  }
}

function isCallBusy(userId, excludingChatKey = null) {
  for (const room of callRooms.values()) {
    if (room.chatKey === excludingChatKey) continue;
    if (room.participants.has(userId) || (room.chat.type === "direct" && room.invited.has(userId))) return true;
  }
  return false;
}

function removeCallParticipant(room, userId, reason) {
  if (!room || !room.participants.has(userId)) return;
  if (userId === room.creatorId || room.chat.type === "direct") {
    endCallRoom(room, reason);
    return;
  }
  room.participants.delete(userId);
  const participantSocket = room.callSockets.get(userId);
  if (participantSocket) sendSocket(participantSocket, "call:ended", { chatKey: room.chatKey, callId: room.callId, reason });
  room.callSockets.delete(userId);
  emitRoom(room, "call:peer-left", { chatKey: room.chatKey, callId: room.callId, userId, reason });
  if (room.participants.size === 0) endCallRoom(room, reason);
}

async function handleCallSignal(ws, userId, message) {
  const baseSchema = z.object({
    chatKey: z.string().regex(/^(u|g):[1-9]\d*$/),
    callId: z.string().uuid()
  }).passthrough();
  const base = baseSchema.safeParse(message);
  if (!base.success) return sendCallError(ws, "INVALID_INPUT", message.chatKey, message.callId);
  const chat = parseChatKey(base.data.chatKey);
  const room = callRooms.get(base.data.chatKey);
  if (!chat || !room || room.callId !== base.data.callId) return sendCallError(ws, "CALL_NOT_FOUND", base.data.chatKey, base.data.callId);
  const authorized = chat.type === "direct"
    ? (userId === room.creatorId || room.invited.has(userId)) && await authorizeChat(room.creatorId, chat)
    : await authorizeChat(userId, chat);
  if (!authorized) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
  if (message.type === "call:join") {
    if (room.participants.has(userId)) {
      if (room.callSockets.get(userId) !== ws) return sendCallError(ws, "USER_BUSY", room.chatKey, room.callId);
      const peers = [...room.participants].filter((peerId) => peerId !== userId);
      return sendSocket(ws, "call:joined", { chatKey: room.chatKey, callId: room.callId, kind: room.kind, peers });
    }
    if (chat.type === "direct" && (userId !== chat.id || !room.invited.has(userId))) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
    if (chat.type === "group") {
      const member = await get("SELECT 1 FROM group_members WHERE group_id=? AND user_id=?", [chat.id, userId]);
      if (!member) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
    }
    if (isCallBusy(userId, room.chatKey)) return sendCallError(ws, "USER_BUSY", room.chatKey, room.callId);
    if (room.participants.size >= 8) return sendCallError(ws, "CALL_FULL", room.chatKey, room.callId);
    const peers = [...room.participants];
    room.participants.add(userId);
    room.callSockets.set(userId, ws);
    clearTimeout(room.ringTimer);
    sendSocket(ws, "call:joined", { chatKey: room.chatKey, callId: room.callId, kind: room.kind, peers });
    for (const otherSocket of socketsFor(userId)) {
      if (otherSocket !== ws) sendSocket(otherSocket, "call:ended", {
        chatKey: room.chatKey, callId: room.callId, reason: "answered-elsewhere"
      });
    }
    emitRoom(room, "call:peer-joined", { chatKey: room.chatKey, callId: room.callId, userId }, userId);
    if (room.chat.type === "group") {
      const members = await all("SELECT user_id FROM group_members WHERE group_id=?", [room.chat.id]);
      for (const member of members) emitUser(member.user_id, "call:room-state", {
        chatKey: room.chatKey, inProgress: true, callId: room.callId, kind: room.kind
      });
    }
    return;
  }
  if (message.type === "call:decline") {
    if (userId === room.creatorId || room.participants.has(userId) ||
      (chat.type === "direct" && (userId !== chat.id || !room.invited.has(userId)))) {
      return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
    }
    if (chat.type === "group" && !room.invited.has(userId)) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
    if (chat.type === "group") {
      const member = await get("SELECT 1 FROM group_members WHERE group_id=? AND user_id=?", [chat.id, userId]);
      if (!member) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
    }
    if (chat.type === "direct") endCallRoom(room, "declined");
    else emitUser(room.creatorId, "call:declined", { chatKey: room.chatKey, callId: room.callId, userId });
    return;
  }
  if (!room.participants.has(userId)) return sendCallError(ws, "ACTION_NOT_ALLOWED", room.chatKey, room.callId);
  if (room.callSockets.get(userId) !== ws) return sendCallError(ws, "USER_BUSY", room.chatKey, room.callId);
  if (message.type === "call:invite") return sendCallError(ws, "CALL_ALREADY_STARTED", room.chatKey, room.callId);
  if (message.type === "call:leave") {
    if (message.reason !== undefined && !["hangup", "screen-ended", "connection-lost"].includes(message.reason)) {
      return sendCallError(ws, "INVALID_INPUT", room.chatKey, room.callId);
    }
    return removeCallParticipant(room, userId, message.reason || "hangup");
  }
  if (message.type === "call:signal") {
    const signalSchema = z.discriminatedUnion("signalType", [
      z.object({ signalType: z.literal("offer"), payload: z.object({ sdp: z.string().min(1).max(64_000) }).strict() }).strict(),
      z.object({ signalType: z.literal("answer"), payload: z.object({ sdp: z.string().min(1).max(64_000) }).strict() }).strict(),
      z.object({ signalType: z.literal("ice"), payload: z.object({
        candidate: z.string().max(4096),
        sdpMid: z.string().max(256).nullable(),
        sdpMLineIndex: z.number().int().min(0).max(255).nullable(),
        usernameFragment: z.string().max(256).nullable().optional()
      }).strict() }).strict()
    ]).safeParse({ signalType: message.signalType, payload: message.payload });
    const recipientId = Number(message.to);
    if (!signalSchema.success || !Number.isSafeInteger(recipientId) || !room.participants.has(recipientId) || recipientId === userId) {
      return sendCallError(ws, "INVALID_INPUT", room.chatKey, room.callId);
    }
    const targetSocket = room.callSockets.get(recipientId);
    if (!targetSocket) return sendCallError(ws, "CALL_NOT_FOUND", room.chatKey, room.callId);
    sendSocket(targetSocket, "call:signal", {
      chatKey: room.chatKey,
      callId: room.callId,
      from: userId,
      signalType: signalSchema.data.signalType,
      payload: signalSchema.data.payload
    });
    return;
  }
  sendCallError(ws, "UNSUPPORTED_EVENT", room.chatKey, room.callId);
}

async function inviteCall(ws, userId, message) {
  const schema = z.object({
    type: z.literal("call:invite"),
    chatKey: z.string().regex(/^(u|g):[1-9]\d*$/),
    kind: z.enum(["audio", "share"])
  }).strict();
  const parsed = schema.safeParse(message);
  if (!parsed.success) return sendCallError(ws, "INVALID_INPUT", message.chatKey);
  const { chatKey, kind } = parsed.data;
  const chat = parseChatKey(chatKey);
  if (!chat || !await authorizeChat(userId, chat)) return sendCallError(ws, "CHAT_NOT_FOUND", chatKey);
  if (callRooms.has(chatKey)) return sendCallError(ws, "CALL_ALREADY_STARTED", chatKey, callRooms.get(chatKey).callId);
  if (isCallBusy(userId)) return sendCallError(ws, "USER_BUSY", chatKey);

  const recipientIds = chat.type === "direct"
    ? [chat.id]
    : (await all("SELECT user_id FROM group_members WHERE group_id=? AND user_id<>?", [chat.id, userId])).map((member) => member.user_id);
  const onlineIds = recipientIds.filter((id) => online.get(id)?.size > 0);
  const availableIds = onlineIds.filter((id) => !isCallBusy(id));
  if (chat.type === "direct" && availableIds.length === 0) {
    return sendCallError(ws, onlineIds.length ? "USER_BUSY" : "USER_OFFLINE", chatKey);
  }

  const caller = await get("SELECT COALESCE(display_name,username) AS name FROM users WHERE id=?", [userId]);
  const room = {
    chatKey,
    chat,
    callId: crypto.randomUUID(),
    kind,
    creatorId: userId,
    participants: new Set([userId]),
    callSockets: new Map([[userId, ws]]),
    invited: new Set(availableIds),
    ringTimer: null
  };
  callRooms.set(chatKey, room);
  for (const recipientId of availableIds) {
    emitUser(recipientId, "call:incoming", {
      chatKey, callId: room.callId, kind, from: userId, fromName: caller?.name || "User", group: chat.type === "group"
    });
  }
  sendSocket(ws, "call:started", { chatKey, callId: room.callId, kind });
  if (chat.type === "group") {
    const members = await all("SELECT user_id FROM group_members WHERE group_id=?", [chat.id]);
    for (const member of members) emitUser(member.user_id, "call:room-state", {
      chatKey, inProgress: true, callId: room.callId, kind: room.kind
    });
  } else {
    room.ringTimer = setTimeout(() => endCallRoom(room, "no-answer"), 45_000);
  }
}

server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  const host = req.headers.host;
  const forwardedProtocol = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProtocol === "string" ? forwardedProtocol.split(",")[0].trim() : (req.socket.encrypted ? "https" : "http");
  const expectedOrigin = `${protocol}://${host}`;
  if (origin !== expectedOrigin || req.url !== "/ws") {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  let userId = null;
  let messageCount = 0;
  let accessExpiryTimer = null;
  const rateTimer = setInterval(() => { messageCount = 0; }, 10_000);
  const authTimer = setTimeout(() => {
    if (!userId) ws.close(4401, "Authentication required");
  }, 5000);
  ws.on("message", async (raw) => {
    if (++messageCount > 100) return ws.close(4429, "Rate limit exceeded");
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return ws.close(4400, "Invalid message"); }
    if (!userId) {
      if (message?.type !== "auth" || typeof message.token !== "string") return ws.close(4401, "Authentication required");
      try {
        const claims = jwt.verify(message.token, JWT_SECRET);
        userId = Number(claims.sub);
        const remainingMs = claims.exp * 1000 - Date.now();
        if (remainingMs <= 0) return ws.close(4401, "Authentication required");
        accessExpiryTimer = setTimeout(() => ws.close(4401, "Authentication expired"), remainingMs);
        const user = await get("SELECT id FROM users WHERE id=?", [userId]);
        if (!user) return ws.close(4401, "Authentication required");
        clearTimeout(authTimer);
        if (!online.has(userId)) online.set(userId, new Set());
        online.get(userId).add(ws);
        sendSocket(ws, "ready", {});
        const peerIds = await all("SELECT friend_id AS id FROM friendships WHERE user_id=?", [userId]);
        for (const { id } of peerIds) {
          for (const peer of online.get(id) || []) sendSocket(peer, "presence", { userId, online: true });
        }
      } catch {
        ws.close(4401, "Authentication required");
      }
      return;
    }
    if (message?.type === "call:invite") {
      try { await inviteCall(ws, userId, message); }
      catch (error) {
        console.error("Could not start call:", error.message);
        sendCallError(ws, "INTERNAL_ERROR", message.chatKey, message.callId);
      }
      return;
    }
    if (typeof message?.type === "string" && message.type.startsWith("call:")) {
      try { await handleCallSignal(ws, userId, message); }
      catch (error) {
        console.error("Could not process call event:", error.message);
        sendCallError(ws, "INTERNAL_ERROR", message.chatKey, message.callId);
      }
      return;
    }
    if (message?.type === "typing" && typeof message.chatKey === "string") {
      const chat = parseChatKey(message.chatKey);
      if (!chat || !await authorizeChat(userId, chat)) return;
      const recipients = chat.type === "direct"
        ? [chat.id]
        : (await all("SELECT user_id FROM group_members WHERE group_id=? AND user_id<>?", [chat.id, userId])).map((row) => row.user_id);
      for (const recipientId of recipients) {
        for (const peer of online.get(recipientId) || []) sendSocket(peer, "typing", { chatKey: message.chatKey });
      }
      return;
    }
    if (message?.type === "presence" && message?.to && Number.isSafeInteger(message.to)) {
      const friendship = await get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [userId, message.to]);
      const blocked = await get("SELECT 1 FROM blocks WHERE (blocker_id=? AND blocked_id=?) OR (blocker_id=? AND blocked_id=?)", [userId, message.to, message.to, userId]);
      if (!friendship || blocked || !online.has(message.to)) return;
      for (const peer of online.get(message.to)) sendSocket(peer, "presence", { userId, online: true });
    } else {
      sendSocket(ws, "error", { code: "UNSUPPORTED_EVENT" });
    }
  });
  ws.on("close", () => {
    clearTimeout(authTimer);
    clearTimeout(accessExpiryTimer);
    clearInterval(rateTimer);
    if (!userId || !online.has(userId)) return;
    online.get(userId).delete(ws);
    for (const room of callRooms.values()) {
      if (room.callSockets.get(userId) === ws) removeCallParticipant(room, userId, "connection-lost");
    }
    if (!online.get(userId).size) {
      online.delete(userId);
      for (const room of callRooms.values()) {
        room.invited.delete(userId);
        removeCallParticipant(room, userId, "connection-lost");
      }
      for (const [peerId, sockets] of online) {
        get("SELECT 1 FROM friendships WHERE user_id=? AND friend_id=?", [peerId, userId]).then((friendship) => {
          if (friendship) for (const peer of sockets) sendSocket(peer, "presence", { userId, online: false });
        }).catch((error) => console.error("Presence lookup failed:", error.message));
      }
    }
  });
});

app.use((error, _req, res, _next) => {
  console.error("Request failed:", error.message);
  if (res.headersSent) return;
  res.status(500).json({ error: "INTERNAL_ERROR" });
});

initializeJsonDatabase().then(() => initializeDatabase()).then(() => {
  server.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));
  const cleanup = setInterval(() => {
    run("DELETE FROM refresh_tokens WHERE expires_at < ? OR revoked_at < ?", [Date.now() - 24 * 60 * 60 * 1000, Date.now() - 30 * 24 * 60 * 60 * 1000])
      .catch((error) => console.error("Token cleanup failed:", error.message));
    run("DELETE FROM messages WHERE created_at < ?", [Date.now() - 7 * 24 * 60 * 60 * 1000])
      .catch((error) => console.error("Message cleanup failed:", error.message));
  }, 60 * 60 * 1000);
  cleanup.unref();
}).catch((error) => {
  console.error("Database initialization failed:", error.message);
  process.exitCode = 1;
});
