# PROMPT: Build a WhatsApp-style P2P Chat **Website** (Node.js server + web client, one `npm start`)

You are a senior full-stack and security engineer. Build the **complete, working** website described below. No TODOs, no placeholders, no mock code. Every button, screen and feature must work. Before finishing, run it, test every feature with two browser profiles, and fix all bugs.

> Attached screenshot = the UI reference: dark mode, chat list on the left, conversation on the right, green outgoing bubbles, search bar on top, message input at the bottom.
> Use an **original app name, logo and icons**. Copy only the general layout and feel, never WhatsApp's name, logo or assets.

---

## 1. Tech Stack and How It Runs

- **Server:** Node.js (LTS) + Express + `ws` (WebSocket) in `/server`.
- **Client:** a website in `/client` using plain **HTML + CSS + vanilla JavaScript (ES modules), no build step**. The Express server serves `/client` as static files, so the client and server are linked and always on the same origin (no CORS problems).
- **Database:** `sqlite3` package (NOT `better-sqlite3`), parameterized queries only.
- **P2P:** WebRTC (RTCDataChannel for messages/files, MediaStream for voice and screen sharing). Free public STUN by default; optional TURN via environment variables (see section 11).
- **Security libs:** `bcrypt`, `jsonwebtoken`, `helmet`, `express-rate-limit`, `cookie-parser`, `zod` (validation).

### One command to run everything
The user is **not a programmer**. It must work like this:

```
npm install
npm start
```

- A **root `package.json`** with `"postinstall"` that installs `/server` dependencies, and `"start"` that runs the server which also serves the website.
- On start, print a clear message: `Open http://localhost:3000`.
- Zero setup needed locally: if `.env` is missing, auto-generate secure random secrets on first run and save them in `/server/data/` (development only). In production (`NODE_ENV=production`) require real environment variables and refuse to start without them.
- Auto-create the database and tables on first run.

### Project structure
```
/
  package.json            (root: npm install / npm start)
  README.md               (Arabic + English: run locally, deploy, TURN, troubleshooting)
  SECURITY.md
  render.yaml
  /server
    server.js
    /routes  /middleware  /db  /services  /ws
    .env.example
    package.json
  /client
    index.html
    /css  /js  /assets (original icons, local fonts)
    /lang
      ar.json
      en.json
```

## 2. Authentication (username + password only)

- **Sign up:** username (3–20 chars, letters/numbers/underscore, unique, case-insensitive) + password (min 8 chars). No email, no phone.
- **Login:** username + password. Same generic error for wrong username or wrong password.
- Hash passwords with **bcrypt** (cost >= 12). Never log or return passwords or hashes.
- Short-lived **access JWT** (15 min, kept in memory only) + **refresh token** (30 days) stored in a **`HttpOnly; Secure; SameSite=Strict` cookie**. Store only a hash of the refresh token in the DB, **rotate it on every use**, detect reuse (revoke the whole token family), revoke on logout.
- **Remember login — the ONLY thing saved in the browser:**
  - The refresh cookie (and the non-extractable identity key described in section 5) are the saved login.
  - Opening the site again goes straight to the chats if the session is valid; otherwise the login page.
  - Logout deletes the cookie, the saved key, and the server-side session.
  - The only other thing allowed in `localStorage` is the chosen **language** (needed before login). Nothing else.
  - **Do NOT store chats, messages, friends, media or caches in localStorage, sessionStorage, IndexedDB, Cache Storage, or a Service Worker cache.** Everything lives in memory for the current session.
- Brute-force protection: rate limit login/signup per IP and per username, temporary lockout after repeated failures.
- Profile (display name, avatar, status text) is stored on the server. Avatar upload: max 2 MB, validate by magic bytes (PNG/JPEG/WebP), never trust the extension or MIME header.

## 3. Friends System (complete)

- Search users by exact username.
- Send request, **accept / reject / cancel**, **remove friend**, **block / unblock**.
- Real-time updates over WebSocket (new request, accepted, removed, online/offline presence, last seen).
- Rules enforced on the **server** (never trust the client):
  - Cannot add yourself; no duplicate requests; blocked users cannot send requests or messages and cannot see presence.
  - Only **friends** can chat 1:1, call, or share screen with each other.
  - Every action checks the authenticated user's permission on that exact resource (prevent IDOR).

## 4. Groups System (complete)

- Create a group (name, optional avatar), add members **from friends only**, remove members, leave group.
- Roles: **owner** and **admins** (promote/demote, transfer ownership). Only admins can add/remove members and edit group info.
- Group chat with the same features as 1:1 (text, emoji, images, reply, typing indicator, unread counters, delivery states).
- Member join/leave/removal system messages inside the chat.
- A removed member immediately loses access (server checks membership on every action).
- Group **voice calls** and **screen sharing** (see sections 6 and 7).

## 5. Messaging (hybrid, temporary server storage)

- **Both online → P2P** through a WebRTC data channel (the server is only the signaling channel).
- **Recipient offline → the server stores only the encrypted message temporarily**, delivers it when the recipient connects, then **deletes it immediately after delivery**. Hard-delete anything undelivered after **7 days** (scheduled cleanup job).
- **End-to-end encryption** (server only ever sees ciphertext):
  - WebCrypto: ECDH P-256 key agreement + AES-GCM; fresh random IV per message.
  - Keys are created in the browser at sign-up. The private key is **wrapped with a key derived from the password** (PBKDF2, high iteration count, per-user salt) and the wrapped blob is stored on the server so the user can log in from any browser and unwrap it in memory.
  - For "remember login", keep the unwrapped identity key in IndexedDB **only as a non-extractable `CryptoKey`** as part of the saved login (deleted on logout).
  - Group messages: encrypt separately for each member (or use a per-group key distributed encrypted per member); rotate the group key when a member is removed.
  - Show a "safety number / key fingerprint" screen so friends can verify each other.
- Message features: text, emoji picker, states (sending / sent / delivered / read), typing indicator, reply, delete-for-me (current session), timestamps, day separators, unread counters, desktop notifications (with permission).
- **Images:** encrypted, stored temporarily on the server only until downloaded by the recipient(s), then deleted (same 7-day max), 25 MB limit per image.

## 6. Voice Calls (video calls = "Coming soon")

- **1:1 voice calls** between friends and **group voice calls up to 8 participants** (WebRTC mesh), signaling over the WebSocket.
- Call UI: ringing screen with accept / decline, in-call screen with participant list + speaking indicator, mute/unmute, hang up, audio device selection, connection quality indicator.
- Group calls: a "call in progress — Join" banner in the group chat; anyone in the group can join until the limit of 8 is reached (show a clear message when full).
- Audio: `echoCancellation`, `noiseSuppression`, `autoGainControl` enabled; handle microphone permission denial with a clear, translated message.
- Server must verify that every call participant is a friend (1:1) or a current group member (group).
- **Video calls:** show a **disabled "Video call" button** with the label/tooltip **"Coming soon" / "قريباً"** (translated). Do not implement video calls.

## 7. Screen Sharing

- Share a screen/window/tab in a 1:1 chat or with group members via WebRTC `getDisplayMedia`.
- **Video + system audio** (no microphone mixed in). Request audio in `getDisplayMedia`; on Chrome/Edge (Windows) entire-screen and tab audio are supported. If no audio track is returned (other OS/browsers), continue with video only and show a translated notice.
- UI: Start/Stop button in the chat header, viewer panel with full-screen, quality selector (720p/1080p, 15/30 fps, with automatic quality reduction when bandwidth is low), a clear "You are sharing your screen" indicator, and viewers must **accept** before receiving.
- Sharing stops automatically when the sharer disconnects or the browser's own "Stop sharing" button is used.

## 8. File Sharing (P2P only)

- Files up to **12 GB**, **P2P only, only when both users are online**. Never uploaded to the server.
- Receiver must **accept** first (name, size, type); either side can cancel.
- Chunked transfer (e.g. 64 KB) with backpressure (`bufferedAmountLowThreshold`), progress, speed, ETA, and a SHA-256 integrity check.
- **Chrome / Edge:** stream directly to disk with the File System Access API (`showSaveFilePicker` + writable stream) so a 12 GB file never fills RAM.
- **Firefox / Safari:** supported with a lower limit (2 GB) and a clear translated notice explaining that Chrome/Edge are needed for larger files.
- Sanitize file names; show a warning before opening executable file types.

## 9. UI / UX

- Close to the screenshot: dark theme, left sidebar (search, chats/friends/groups list with avatar, last-message preview, time, unread badge), right panel (header with name + online status + call and screen-share buttons, messages area, input bar with emoji, attach, send).
- Pages/views: Login, Sign up, Chats, Friends (list / requests / search / blocked), Groups, Profile & Settings, Connection-lost / "server is waking up" screen.
- **Fully responsive** (desktop, tablet, phone browsers): on small screens show the chat list and the conversation as separate views with a back button.
- Keyboard shortcuts (Enter to send, Shift+Enter new line, Ctrl+K search), title/favicon unread counter, accessible (labels, focus states, contrast).

## 10. Languages (full Arabic + English)

- Every UI string comes from `client/lang/ar.json` and `client/lang/en.json`. **No hard-coded text** in HTML/JS.
- Language switch on the login page and in Settings. Arabic = full **RTL** layout (mirrored sidebar, bubbles, icons, input), English = LTR. Use locally hosted fonts (Cairo or Noto Sans Arabic + a Latin font).
- Correct bidi handling for mixed Arabic/English messages; dates, times and numbers formatted per language.
- The server returns **error codes**, and the client translates them.

## 11. Network Notes (WebRTC)

- Browsers only allow microphone and screen capture on **HTTPS or localhost**. Render provides HTTPS.
- Free STUN works for most networks, but strict NATs/firewalls may need a TURN relay. Support optional environment variables `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` and send the ICE server list to authenticated clients. Explain in the README how to add a TURN service.
- Show a friendly message when a P2P connection cannot be established.

## 12. Security Requirements (no vulnerabilities)

Mandatory, verify each item before finishing:

**Website / browser**
- Strict **Content-Security-Policy** (no inline scripts/styles, no `eval`, `frame-ancestors 'none'`, restrict `connect-src` to same origin + the WebSocket), plus HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (allow only microphone, display-capture for this origin).
- Prevent XSS: render all user content with `textContent` / safe DOM APIs, never `innerHTML` with user data; validate URLs (only `https:`/`http:`) and add `rel="noopener noreferrer"`.
- **CSRF** protection for all cookie-authenticated endpoints (SameSite=Strict + custom header / Origin check).
- Check the `Origin` header on the WebSocket upgrade; authenticate the socket with the access token and re-check permissions on every message.

**Server**
- Validate and sanitize **all** input with schemas; parameterized SQL only.
- Rate limiting on HTTP routes **and** WebSocket messages; maximum payload sizes; protection against user enumeration.
- Authorization on every resource (friends, groups, messages, media, calls) to prevent IDOR and privilege escalation.
- Secrets only in environment variables; `.env.example` provided; no secrets in code.
- Central error handler, no stack traces to clients, safe logs (never passwords, tokens, or message content).
- Uploaded images/avatars: validate magic bytes, random file names, stored outside the static folder, no path traversal.
- Cleanup jobs for expired messages, images and refresh tokens.
- Run `npm audit`; fix or justify every high/critical finding; pin dependency versions.

## 13. Deployment (Render)

- One Render **Web Service** from the repo root: build `npm install`, start `npm start`; include `render.yaml` and README steps in simple language (Arabic + English).
- Environment variables: `NODE_ENV=production`, `JWT_SECRET`, `DB_PATH`, optional `TURN_*`.
- Document that Render's free disk is ephemeral and make `DB_PATH` configurable so a persistent disk can be attached. Add a `/health` endpoint.
- Free instances sleep: the client must auto-reconnect with exponential backoff and show a "server is waking up" message.

## 14. Testing & Acceptance Checklist

Test with two different browser profiles (and a third for groups):

1. Sign up, close the browser, reopen → auto-login works; after logout, no saved session and no key remain.
2. No chats, messages, media or friends are stored in any browser storage (check DevTools → Application).
3. Friend flow: send / accept / reject / cancel / remove / block / unblock.
4. Message when both online (P2P) and when offline (server temp store → delivered → deleted from the server).
5. Groups: create, add, remove, promote admin, leave, group messages, removed member loses access.
6. Voice call 1:1 and group call with 3+ people; mute, hang up, join in progress, limit of 8 enforced.
7. Video call button is visible, disabled, and says "Coming soon" in both languages.
8. Screen share with video + system audio in Chrome/Edge; notice shown when audio is unavailable.
9. File transfer: accept/decline, cancel, 1 GB+ file in Chrome/Edge streamed to disk, hash verified; Firefox/Safari limit message.
10. Arabic (RTL) and English (LTR) fully translated, no layout glitches, responsive on a phone-size window.
11. Security checklist (section 12) verified; try SQL injection, XSS in usernames/messages/group names, IDOR on friend/group/message IDs, refresh-token reuse, WebSocket from a foreign origin — all must fail.
12. `npm install && npm start` works on a clean machine with no manual setup.

## 15. Deliverables

- Full source code, root and server `package.json`, `README.md` (Arabic + English), `SECURITY.md`, `.env.example`, `render.yaml`.
- Work in this order: structure → server (auth, friends, groups, WebSocket) → client UI → messaging + E2E → voice calls → screen sharing → files → i18n → security hardening → testing. Report what you tested at the end.
