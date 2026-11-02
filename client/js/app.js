const app = document.querySelector("#app");
const languageKey = "language";
const iconPaths = {
  chat: ["M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3V11.5A7.5 7.5 0 0 1 9.5 4h3A7.5 7.5 0 0 1 20 11.5Z", "M7 10h8", "M7 14h5"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  group: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M19 8v6", "M22 11h-6"],
  settings: ["M10 2h4l.7 2.3a8 8 0 0 1 1.6.9l2.3-.7 2 3.5-1.6 1.8a8 8 0 0 1 0 1.9l1.6 1.8-2 3.5-2.3-.7a8 8 0 0 1-1.6.9L14 20h-4l-.7-2.3a8 8 0 0 1-1.6-.9l-2.3.7-2-3.5L5 12.2a8 8 0 0 1 0-1.9L3.4 8.5l2-3.5 2.3.7a8 8 0 0 1 1.6-.9L10 2Z", "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"],
  search: ["m20 20-4.2-4.2", "M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  plus: ["M12 5v14", "M5 12h14"],
  back: ["m15 18-6-6 6-6", "M9 12h12"],
  phone: ["M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.2a2 2 0 0 1-.6 1.7L7.1 10.5a16 16 0 0 0 6.4 6.4l1.9-1.9a2 2 0 0 1 1.7-.6l3.2.5a2 2 0 0 1 1.7 2Z"],
  phoneOff: ["M10.6 13.4a16 16 0 0 0 2.9 2.9l1.9-1.9a2 2 0 0 1 1.7-.6l3.2.5a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3.2a2 2 0 0 1-.6 1.7l-1.9 1.9", "m2 2 20 20"],
  screen: ["M3 4h18v13H3z", "M8 21h8", "M12 17v4"],
  video: ["M23 7l-7 5 7 5V7Z", "M1 5h15v14H1z"],
  mic: ["M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z", "M19 10v1a7 7 0 0 1-14 0v-1", "M12 18v4", "M8 22h8"],
  micOff: ["M9 9v2a3 3 0 0 0 5.12 2.12", "M15 9V5a3 3 0 0 0-5.8-1", "M19 10v1a7 7 0 0 1-.7 3.06", "M5 10v1a7 7 0 0 0 11.95 5.05", "M12 18v4", "M8 22h8", "m2 2 20 20"],
  volume: ["M11 5 6 9H2v6h4l5 4V5Z", "M15.5 8.5a5 5 0 0 1 0 7", "M19 5a10 10 0 0 1 0 14"],
  paperclip: ["m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.49-8.48"],
  userPlus: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M19 8v6", "M22 11h-6"],
  trash: ["M3 6h18", "M8 6V4h8v2", "m19 6-1 14H6L5 6", "M10 11v5", "M14 11v5"],
  block: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "m4.93 4.93 14.14 14.14"],
  check: ["m5 12 4 4L19 6"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  message: ["M21 11.5a8.4 8.4 0 0 1-8.4 8.4H5l-3 3V11.5A8.4 8.4 0 0 1 10.4 3h2.2a8.4 8.4 0 0 1 8.4 8.5Z", "M8 11h8", "M8 15h5"],
  screenStop: ["M3 4h18v13H3z", "M8 21h8", "M12 17v4", "m9 8 6 5", "m15 8-6 5"],
  smile: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01"],
  reply: ["M9 17 4 12l5-5", "M4 12h10a6 6 0 0 1 6 6"],
  more: ["M12 5h.01", "M12 12h.01", "M12 19h.01"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  logo: ["M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-3 3V11.5A7.5 7.5 0 0 1 9.5 4h3A7.5 7.5 0 0 1 20 11.5Z", "M8 12h5", "M10.5 9.5v5"]
};

let language = localStorage.getItem(languageKey) === "ar" ? "ar" : "en";
let strings = {};
let accessToken = null;
let currentUser = null;
let chats = [];
let friends = [];
let chatSignature = "";
const messageSignatures = new Map();
const messageLoads = new Set();
let selectedChat = null;
let activeTab = "chats";
let socket = null;
let reconnectDelay = 1000;
let reconnectTimer = null;
let pollTimer = null;
let replyTo = null;
let isSignup = false;
let searchQuery = "";
let activeCall = null;
let incomingCall = null;
let rtcServersPromise = null;

async function loadLanguage() {
  const response = await fetch(`/lang/${language}.json`);
  if (!response.ok) throw new Error("Could not load translations.");
  strings = await response.json();
  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.title = t("brand");
}

function t(key) {
  return strings[key] || strings.errorGeneric || key;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name, className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("shape-rendering", "geometricPrecision");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  if (className) svg.setAttribute("class", className);
  for (const d of iconPaths[name] || []) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  return svg;
}

function button(label, action, className = "icon-button", iconName = null) {
  const result = el("button", className);
  result.type = "button";
  result.setAttribute("aria-label", label);
  result.title = label;
  if (iconName) result.append(icon(iconName));
  if (!iconName || className.includes("with-label")) result.append(el("span", "", label));
  result.addEventListener("click", action);
  return result;
}

async function request(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(url, { ...options, headers, credentials: "same-origin" });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "errorGeneric");
    error.code = data.error;
    throw error;
  }
  return data;
}

function errorText(error) {
  return t(error.code || error.message || "errorGeneric");
}

function setLanguage(next) {
  language = next;
  localStorage.setItem(languageKey, language);
  render();
}

function avatar(label, tone = 0) {
  const node = el("span", `avatar avatar-tone-${tone % 5}`, (label || "?").trim().slice(0, 1).toUpperCase());
  node.setAttribute("aria-hidden", "true");
  return node;
}

function renderAuth() {
  app.replaceChildren();
  const page = el("div", "auth-page");
  const card = el("section", "auth-card");
  const brand = el("div", "auth-brand");
  brand.append(icon("logo", "brand-mark"), el("span", "", t("brand")));
  const switchLanguage = el("button", "language-toggle", t("language"));
  switchLanguage.type = "button";
  switchLanguage.addEventListener("click", () => setLanguage(language === "ar" ? "en" : "ar"));
  const top = el("div", "auth-top");
  top.append(brand, switchLanguage);
  const overline = el("div", "overline", t("authOverline"));
  const title = el("h1", "auth-title", t(isSignup ? "signup" : "login"));
  const subtitle = el("p", "auth-subtitle", t("tagline"));
  const form = el("form", "auth-form");
  const usernameLabel = el("label", "field-label", t("username"));
  const username = el("input", "text-input");
  username.autocomplete = "username";
  username.minLength = 3;
  username.maxLength = 20;
  username.pattern = "[A-Za-z0-9_]{3,20}";
  username.required = true;
  usernameLabel.append(username);
  const passwordLabel = el("label", "field-label", t("password"));
  const password = el("input", "text-input");
  password.type = "password";
  password.autocomplete = isSignup ? "new-password" : "current-password";
  password.minLength = 8;
  password.maxLength = 128;
  password.required = true;
  passwordLabel.append(password);
  const error = el("p", "form-error");
  error.setAttribute("role", "alert");
  const submit = el("button", "pill-button primary-action", t(isSignup ? "signup" : "login"));
  submit.type = "submit";
  form.append(usernameLabel, passwordLabel, error, submit);
  const toggle = el("button", "text-link", t(isSignup ? "switchLogin" : "switchSignup"));
  toggle.type = "button";
  toggle.addEventListener("click", () => { isSignup = !isSignup; renderAuth(); });
  const art = el("div", "auth-art");
  art.append(
    el("div", "float-note note-one", t("noteOne")),
    el("div", "float-note note-two", t("noteTwo")),
    (() => {
      const orbit = el("div", "auth-orbit");
      orbit.append(icon("chat", "orbit-icon"));
      return orbit;
    })(),
    el("p", "art-caption", t("authCaption"))
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "";
    submit.disabled = true;
    try {
      const session = await request(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        body: JSON.stringify({ username: username.value, password: password.value })
      });
      accessToken = session.accessToken;
      currentUser = session.user;
      await bootApp();
    } catch (issue) {
      error.textContent = errorText(issue);
    } finally {
      submit.disabled = false;
    }
  });
  card.append(top, overline, title, subtitle, form, toggle);
  page.append(card, art);
  app.append(page);
}

async function bootApp() {
  const [profile, chatsResult, friendsResult] = await Promise.all([
    request("/api/me"),
    request("/api/chats"),
    request("/api/friends")
  ]);
  currentUser = profile.user;
  chats = chatsResult.chats;
  friends = friendsResult.friends;
  updateDocumentTitle();
  disconnectSocket();
  connectSocket();
  if (!pollTimer) pollTimer = window.setInterval(() => {
    if (!accessToken) return;
    refreshChats().catch((error) => console.error("Could not refresh chat list:", error.message));
    if (selectedChat) loadMessages(selectedChat, true);
  }, 5000);
  renderDashboard();
}

function connectSocket() {
  clearTimeout(reconnectTimer);
  if (!accessToken) return;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${location.host}/ws`);
  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "auth", token: accessToken }));
    reconnectDelay = 1000;
  });
  socket.addEventListener("message", async (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }
    if (payload.event === "message") {
      await refreshChats();
      if (selectedChat?.key === payload.data.chatKey) await loadMessages(selectedChat, true);
    }
    if (payload.event === "presence") {
      const chat = chats.find((item) => item.type === "direct" && item.id === payload.data.userId);
      if (chat) { chat.online = payload.data.online; updateConversationStatus(); }
    }
    if (payload.event === "call:incoming") handleIncomingCall(payload.data);
    if (payload.event === "call:started" && activeCall?.chatKey === payload.data.chatKey) {
      activeCall.callId = payload.data.callId;
      activeCall.status = "calling";
      updateCallDialog();
    }
    if (payload.event === "call:joined") handleCallJoined(payload.data);
    if (payload.event === "call:peer-joined" && isCurrentCall(payload.data)) {
      createPeerConnection(payload.data.userId, true).catch(reportCallError);
    }
    if (payload.event === "call:peer-left" && isCurrentCall(payload.data)) removeCallPeer(payload.data.userId);
    if (payload.event === "call:signal" && isCurrentCall(payload.data)) handlePeerSignal(payload.data).catch(reportCallError);
    if (payload.event === "call:declined" && activeCall?.callId === payload.data.callId) showToast(t("callDeclined"));
    if (payload.event === "call:ended") {
      if (activeCall?.callId === payload.data.callId) finishLocalCall(payload.data.reason);
      if (incomingCall?.callId === payload.data.callId) {
        incomingCall = null;
        closeCallDialog();
        if (payload.data.reason !== "answered-elsewhere") {
          showToast(t(payload.data.reason === "no-answer" ? "callNoAnswer" : "callEnded"));
        }
      }
    }
    if (payload.event === "call:room-state") updateCallRoomState(payload.data);
    if (payload.event === "call:error") {
      showToast(t(payload.data.code || "errorGeneric"));
      if (activeCall && activeCall.chatKey === payload.data.chatKey &&
        (!activeCall.callId || activeCall.callId === payload.data.callId)) finishLocalCall();
      if (incomingCall?.chatKey === payload.data.chatKey && incomingCall.callId === payload.data.callId) {
        incomingCall = null;
        closeCallDialog();
      }
    }
  });
  socket.addEventListener("close", () => {
    if (activeCall) {
      finishLocalCall();
      showToast(t("callConnectionLost"));
    }
    if (incomingCall) {
      incomingCall = null;
      closeCallDialog();
    }
    if (!accessToken) return;
    reconnectTimer = setTimeout(connectSocket, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  });
}

function sendCallEvent(message) {
  if (socket?.readyState !== WebSocket.OPEN) {
    showToast(t("callConnectionLost"));
    return false;
  }
  socket.send(JSON.stringify(message));
  return true;
}

function isCurrentCall(data) {
  return Boolean(activeCall?.callId && activeCall.callId === data.callId && activeCall.chatKey === data.chatKey);
}

async function requestCallMedia(kind, isJoin = false) {
  let microphone;
  let screen;
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast(t("mediaUnsupported"));
      return null;
    }
    if (kind === "share" && !isJoin && !navigator.mediaDevices.getDisplayMedia) {
      showToast(t("mediaUnsupported"));
      return null;
    }
    const microphoneRequest = navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => (microphone = stream));
    const screenRequest = kind === "share" && !isJoin
      ? navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true }).then((stream) => (screen = stream))
      : Promise.resolve(null);
    const results = await Promise.allSettled([microphoneRequest, screenRequest]);
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
    if (screen && !screen.getVideoTracks().length) throw new Error("SCREEN_CAPTURE_UNAVAILABLE");
    const stream = new MediaStream([...microphone.getAudioTracks(), ...(screen?.getTracks() || [])]);
    if (screen && !screen.getAudioTracks().length) showToast(t("screenAudioUnavailable"));
    return { stream, microphone, screen };
  } catch (error) {
    microphone?.getTracks().forEach((track) => track.stop());
    screen?.getTracks().forEach((track) => track.stop());
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") showToast(t("mediaPermissionDenied"));
    else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") showToast(t("microphoneUnavailable"));
    else if (error.message === "SCREEN_CAPTURE_UNAVAILABLE") showToast(t("screenCaptureUnavailable"));
    else {
      console.error("Could not access call media:", error.message);
      showToast(t("errorGeneric"));
    }
    return null;
  }
}

async function startCall(kind) {
  if (!selectedChat || activeCall || incomingCall) return;
  const targetChat = selectedChat;
  if (targetChat.type === "group" && targetChat.callInProgress) {
    await joinCall(targetChat.key, targetChat.callId, targetChat.callKind || kind, kind === "share");
    return;
  }
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    showToast(t("callConnectionLost"));
    return;
  }
  const media = await requestCallMedia(kind);
  if (!media) return;
  activeCall = {
    chatKey: targetChat.key, chatName: targetChat.name, callId: null, kind, stream: media.stream,
    microphone: media.microphone, screen: media.screen, peers: new Map(), peerPromises: new Map(),
    status: "calling", muted: false, startedAt: Date.now()
  };
  if (media.screen) {
    for (const track of media.screen.getVideoTracks()) track.addEventListener("ended", () => stopScreenShare());
  }
  openCallDialog("outgoing");
  if (!sendCallEvent({ type: "call:invite", chatKey: activeCall.chatKey, kind })) finishLocalCall();
}

function handleIncomingCall(data) {
  if (activeCall || incomingCall) {
    sendCallEvent({ type: "call:decline", chatKey: data.chatKey, callId: data.callId });
    return;
  }
  incomingCall = data;
  openCallDialog("incoming");
}

async function acceptIncomingCall() {
  if (!incomingCall || activeCall) return;
  const invitation = incomingCall;
  const media = await requestCallMedia("audio", true);
  if (!media) return;
  incomingCall = null;
  activeCall = {
    chatKey: invitation.chatKey, chatName: invitation.fromName, callId: invitation.callId, kind: invitation.kind,
    stream: media.stream, microphone: media.microphone, screen: null,
    peers: new Map(), peerPromises: new Map(), status: "connecting", muted: false, startedAt: Date.now()
  };
  openCallDialog("active");
  if (!sendCallEvent({ type: "call:join", chatKey: invitation.chatKey, callId: invitation.callId })) finishLocalCall();
}

async function joinCall(chatKey, callId, kind = "audio", shareScreen = false) {
  if (!callId || activeCall || incomingCall) return;
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    showToast(t("callConnectionLost"));
    return;
  }
  const media = await requestCallMedia(shareScreen ? "share" : "audio");
  if (!media) return;
  activeCall = {
    chatKey, chatName: selectedChat?.key === chatKey ? selectedChat.name : t("groupCall"),
    callId, kind, stream: media.stream, microphone: media.microphone,
    screen: null, peers: new Map(), peerPromises: new Map(), status: "connecting", muted: false, startedAt: Date.now()
  };
  openCallDialog("active");
  if (!sendCallEvent({ type: "call:join", chatKey, callId })) finishLocalCall();
}

function openCallDialog(mode) {
  closeCallDialog();
  const dialog = el("dialog", "call-dialog");
  const head = el("div", "call-dialog-head");
  const title = el("strong", "call-dialog-title", mode === "incoming"
    ? `${incomingCall?.fromName || t("incomingCall")} ${t("incomingCallSuffix")}`
    : activeCall?.chatName || selectedChat?.name || t("groupCall"));
  const close = button(t("close"), () => mode === "incoming" ? declineIncomingCall() : leaveCall(), "icon-button", "close");
  head.append(title, close);
  const center = el("div", "call-center");
  const pulse = el("div", "call-pulse");
  pulse.append(icon(mode === "incoming" ? "phone" : activeCall?.kind === "share" ? "screen" : "mic"));
  const status = el("p", "call-status", mode === "incoming" ? t("incomingCall") : t("callConnecting"));
  const peers = el("div", "call-peers");
  const controls = el("div", "call-controls");
  if (mode === "incoming") {
    controls.append(
      button(t("declineCall"), declineIncomingCall, "call-control danger with-label", "phoneOff"),
      button(t("acceptCall"), acceptIncomingCall, "call-control accept with-label", "phone")
    );
  } else {
    controls.append(
      button(t("muteMicrophone"), toggleCallMute, "call-control call-mute with-label", "mic"),
      button(t("shareScreen"), toggleScreenShare, "call-control call-share with-label", "screen"),
      button(t("endCall"), leaveCall, "call-control danger with-label", "phoneOff")
    );
  }
  center.append(pulse, status, peers);
  dialog.append(head, center, controls);
  document.body.append(dialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (mode === "incoming") declineIncomingCall();
    else leaveCall();
  });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
  if (mode !== "incoming") updateCallDialog();
}

function closeCallDialog() {
  const dialog = document.querySelector(".call-dialog");
  if (dialog?.open) dialog.close();
  else dialog?.remove();
}

function updateCallDialog() {
  const dialog = document.querySelector(".call-dialog");
  if (!dialog || !activeCall) return;
  const status = dialog.querySelector(".call-status");
  status.textContent = t(activeCall.status === "connected" ? "callConnected"
    : activeCall.status === "calling" ? "calling"
      : activeCall.peers.size ? "callConnecting" : "waitingForAnswer");
  const peers = dialog.querySelector(".call-peers");
  peers.replaceChildren(el("span", "", t("participantsCount").replace("{count}", String(activeCall.peers.size + 1))));
  for (const [userId, peer] of activeCall.peers) {
    const card = el("div", "call-peer");
    card.append(avatar(`U${userId}`, userId), el("span", "", `${t("participant")} ${userId}`));
    const audio = el("audio");
    audio.autoplay = true;
    audio.playsInline = true;
    const video = el("video", "remote-screen");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.hidden = true;
    if (peer.stream) {
      audio.srcObject = peer.stream;
      video.srcObject = peer.stream;
      video.hidden = !peer.stream.getVideoTracks().some((track) => track.readyState === "live");
    }
    card.append(audio, video);
    peers.append(card);
    if (peer.stream) {
      audio.play().catch((error) => {
        console.warn("Remote audio playback needs user interaction:", error.message);
        const enable = button(t("enableAudio"), () => audio.play().then(() => enable.remove())
          .catch(() => showToast(t("audioPlaybackBlocked"))), "small-action with-label", "volume");
        card.append(enable);
        showToast(t("audioPlaybackBlocked"));
      });
      if (!video.hidden) video.play().catch((error) => console.warn("Remote screen playback failed:", error.message));
    }
  }
  const mute = dialog.querySelector(".call-mute");
  if (mute) {
    const label = activeCall.muted ? "unmuteMicrophone" : "muteMicrophone";
    mute.setAttribute("aria-label", t(label));
    mute.title = t(label);
    mute.querySelector("svg")?.replaceWith(icon(activeCall.muted ? "micOff" : "mic"));
  }
  const share = dialog.querySelector(".call-share");
  if (share) {
    const label = activeCall.screen ? "stopSharing" : "shareScreen";
    share.setAttribute("aria-label", t(label));
    share.title = t(label);
    share.querySelector("svg")?.replaceWith(icon(activeCall.screen ? "screenStop" : "screen"));
  }
}

async function declineIncomingCall() {
  if (!incomingCall) return;
  const invitation = incomingCall;
  incomingCall = null;
  sendCallEvent({ type: "call:decline", chatKey: invitation.chatKey, callId: invitation.callId });
  closeCallDialog();
}

function toggleCallMute() {
  if (!activeCall) return;
  activeCall.muted = !activeCall.muted;
  for (const track of activeCall.microphone.getAudioTracks()) track.enabled = !activeCall.muted;
  updateCallDialog();
}

async function toggleScreenShare() {
  if (!activeCall) return;
  if (activeCall.screen) {
    stopScreenShare();
    return;
  }
  let screen;
  try {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      showToast(t("mediaUnsupported"));
      return;
    }
    screen = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
    if (!screen.getVideoTracks().length) throw new Error("SCREEN_CAPTURE_UNAVAILABLE");
    if (!screen.getAudioTracks().length) showToast(t("screenAudioUnavailable"));
    activeCall.screen = screen;
    for (const peer of activeCall.peers.values()) {
      for (const track of screen.getTracks()) peer.pc.addTrack(track, screen);
    }
    for (const track of screen.getVideoTracks()) track.addEventListener("ended", () => stopScreenShare());
    updateCallDialog();
  } catch (error) {
    screen?.getTracks().forEach((track) => track.stop());
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") showToast(t("mediaPermissionDenied"));
    else {
      console.error("Could not share screen:", error.message);
      showToast(t(error.message === "SCREEN_CAPTURE_UNAVAILABLE" ? "screenCaptureUnavailable" : "errorGeneric"));
    }
  }
}

function stopScreenShare() {
  if (!activeCall?.screen) return;
  const screen = activeCall.screen;
  for (const peer of activeCall.peers.values()) {
    for (const sender of peer.pc.getSenders()) {
      if (screen.getTracks().includes(sender.track)) peer.pc.removeTrack(sender);
    }
  }
  for (const track of screen.getTracks()) activeCall.stream.removeTrack(track);
  screen.getTracks().forEach((track) => track.stop());
  activeCall.screen = null;
  updateCallDialog();
}

function leaveCall() {
  if (!activeCall) return;
  sendCallEvent({ type: "call:leave", chatKey: activeCall.chatKey, callId: activeCall.callId, reason: "hangup" });
  finishLocalCall();
}

function finishLocalCall(reason) {
  if (!activeCall) return;
  for (const peer of activeCall.peers.values()) peer.pc.close();
  activeCall.stream.getTracks().forEach((track) => track.stop());
  activeCall.screen?.getTracks().forEach((track) => track.stop());
  activeCall = null;
  closeCallDialog();
  if (reason && reason !== "hangup") {
    const key = reason === "no-answer" ? "callNoAnswer" : reason === "declined" ? "callDeclined" : "callEnded";
    showToast(t(key));
  }
}

function reportCallError(error) {
  console.error("Call connection failed:", error.message);
  showToast(t("callConnectionFailed"));
}

function updateCallRoomState(data) {
  const chat = chats.find((item) => item.key === data.chatKey);
  if (chat) {
    chat.callInProgress = data.inProgress;
    chat.callId = data.callId || null;
    chat.callKind = data.kind || null;
  }
  if (selectedChat?.key === data.chatKey) {
    Object.assign(selectedChat, { callInProgress: data.inProgress, callId: data.callId || null, callKind: data.kind || null });
    const action = document.querySelector(".conversation-actions .call-action");
    if (action) {
      const label = selectedChat.callInProgress ? "joinCall" : "voiceCall";
      action.setAttribute("aria-label", t(label));
      action.title = t(label);
    }
  }
  renderChatList();
}

async function createPeerConnection(userId, shouldOffer) {
  const call = activeCall;
  if (!call) return null;
  if (call.peers.has(userId)) return call.peers.get(userId);
  if (call.peerPromises.has(userId)) return call.peerPromises.get(userId);
  const pending = createCallPeerConnection(call, userId, shouldOffer);
  call.peerPromises.set(userId, pending);
  try { return await pending; }
  finally {
    if (call.peerPromises.get(userId) === pending) call.peerPromises.delete(userId);
  }
}

async function createCallPeerConnection(call, userId, shouldOffer) {
  if (activeCall !== call) return null;
  if (call.status === "calling") call.status = "connecting";
  if (!rtcServersPromise) {
    rtcServersPromise = request("/api/rtc-config").then((result) => result.iceServers).catch((error) => {
      rtcServersPromise = null;
      throw error;
    });
  }
  const pc = new RTCPeerConnection({ iceServers: await rtcServersPromise });
  if (activeCall !== call) {
    pc.close();
    return null;
  }
  const peer = {
    pc, stream: new MediaStream(), makingOffer: false, ignoreOffer: false,
    settingRemoteAnswer: false, polite: currentUser.id > userId, candidates: [],
    canNegotiate: shouldOffer
  };
  call.peers.set(userId, peer);
  const localTracks = new Set(call.stream.getTracks());
  for (const track of localTracks) pc.addTrack(track, call.stream);
  for (const track of call.screen?.getTracks() || []) {
    if (!localTracks.has(track)) pc.addTrack(track, call.screen);
  }
  pc.onicecandidate = (event) => {
    if (event.candidate && activeCall === call) sendCallEvent({
      type: "call:signal", chatKey: call.chatKey, callId: call.callId,
      to: userId, signalType: "ice", payload: event.candidate.toJSON()
    });
  };
  pc.ontrack = (event) => {
    if (activeCall !== call) return;
    if (!event.streams[0]) peer.stream.addTrack(event.track);
    else peer.stream = event.streams[0];
    event.track.addEventListener("ended", updateCallDialog);
    updateCallDialog();
  };
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "connected" && activeCall === call) {
      call.status = "connected";
      updateCallDialog();
    } else if (pc.connectionState === "failed" && activeCall === call) showToast(t("callConnectionFailed"));
  };
  pc.onnegotiationneeded = async () => {
    if (!peer.canNegotiate || activeCall !== call) return;
    try {
      peer.makingOffer = true;
      await pc.setLocalDescription();
      if (activeCall !== call) return;
      sendCallEvent({
        type: "call:signal", chatKey: call.chatKey, callId: call.callId,
        to: userId, signalType: "offer", payload: { sdp: pc.localDescription.sdp }
      });
    } catch (error) {
      if (activeCall === call) reportCallError(error);
    } finally {
      peer.makingOffer = false;
    }
  };
  if (activeCall === call) updateCallDialog();
  return peer;
}

async function handleCallJoined(data) {
  if (!activeCall || activeCall.chatKey !== data.chatKey || activeCall.callId !== data.callId) return;
  const call = activeCall;
  call.kind = data.kind;
  call.status = "connecting";
  for (const userId of data.peers) {
    await createPeerConnection(userId, false);
    if (activeCall !== call) return;
  }
  updateCallDialog();
}

async function handlePeerSignal(data) {
  if (!isCurrentCall(data)) return;
  const call = activeCall;
  const peer = await createPeerConnection(data.from, false);
  if (!peer || activeCall !== call) return;
  const pc = peer.pc;
  if (data.signalType === "ice") {
    if (peer.ignoreOffer) return;
    if (pc.remoteDescription) await pc.addIceCandidate(data.payload);
    else peer.candidates.push(data.payload);
    return;
  }
  const description = new RTCSessionDescription({ type: data.signalType, sdp: data.payload.sdp });
  const collision = description.type === "offer" &&
    (peer.makingOffer || (pc.signalingState !== "stable" && !peer.settingRemoteAnswer));
  if (collision && !peer.polite) {
    peer.ignoreOffer = true;
    return;
  }
  peer.ignoreOffer = false;
  if (collision) await pc.setLocalDescription({ type: "rollback" });
  peer.settingRemoteAnswer = description.type === "answer";
  try { await pc.setRemoteDescription(description); }
  finally { peer.settingRemoteAnswer = false; }
  if (activeCall !== call) return;
  peer.canNegotiate = true;
  for (const candidate of peer.candidates.splice(0)) await pc.addIceCandidate(candidate);
  if (description.type === "offer") {
    await pc.setLocalDescription(await pc.createAnswer());
    if (activeCall !== call) return;
    sendCallEvent({
      type: "call:signal", chatKey: call.chatKey, callId: call.callId,
      to: data.from, signalType: "answer", payload: { sdp: pc.localDescription.sdp }
    });
  }
}

function removeCallPeer(userId) {
  const peer = activeCall?.peers.get(userId);
  if (!peer) return;
  peer.pc.close();
  activeCall.peers.delete(userId);
  updateCallDialog();
}

async function refreshChats() {
  const result = await request("/api/chats");
  const signature = JSON.stringify(result.chats);
  if (signature === chatSignature) return;
  chatSignature = signature;
  chats = result.chats;
  updateDocumentTitle();
  renderChatList();
}

function updateDocumentTitle() {
  const unread = chats.reduce((total, chat) => total + Number(chat.unread || 0), 0);
  document.title = unread ? `(${unread}) ${t("brand")}` : t("brand");
}

function renderDashboard() {
  if (selectedChat) messageSignatures.delete(selectedChat.key);
  app.replaceChildren();
  const shell = el("div", "workspace");
  const rail = el("aside", "nav-rail");
  const logo = el("div", "rail-logo");
  logo.append(icon("logo"));
  logo.setAttribute("aria-label", t("brand"));
  rail.append(logo);
  const nav = el("nav", "rail-nav");
  const tabs = [
    ["chats", "tabChats", "chat"],
    ["friends", "tabFriends", "users"],
    ["groups", "tabGroups", "group"],
    ["settings", "tabSettings", "settings"]
  ];
  for (const [tab, key, iconName] of tabs) {
    const item = button(t(key), () => { activeTab = tab; renderDashboard(); }, `rail-button${activeTab === tab ? " active" : ""}`, iconName);
    item.classList.add("with-label");
    nav.append(item);
  }
  const railBottom = el("div", "rail-bottom");
  railBottom.append(avatar(currentUser?.display_name || currentUser?.username || "W", 2));
  rail.append(nav, railBottom);

  const sidebar = el("aside", "chat-sidebar");
  const sideTop = el("div", "sidebar-top");
  const brandTitle = el("div", "sidebar-brand");
  brandTitle.append(icon("logo"), el("div", "sidebar-brand-copy", t(activeTab === "chats" ? "tabChats" : activeTab === "friends" ? "tabFriends" : activeTab === "groups" ? "tabGroups" : "tabSettings")));
  const subhead = el("p", "sidebar-subtitle", t(activeTab === "chats" ? "sidebarSubtitle" : "signedInAs", activeTab === "chats" ? "" : currentUser.username));
  if (activeTab !== "chats") subhead.textContent = `${t("signedInAs")} @${currentUser.username}`;
  sideTop.append(brandTitle);
  if (activeTab === "chats" || activeTab === "friends" || activeTab === "groups") {
    const search = el("label", "search-box");
    search.append(icon("search"));
    const searchInput = el("input");
    searchInput.placeholder = t("searchPlaceholder");
    searchInput.value = searchQuery;
    searchInput.setAttribute("aria-label", t("searchPlaceholder"));
    searchInput.addEventListener("input", () => { searchQuery = searchInput.value; renderChatList(); });
    search.append(searchInput);
    sideTop.append(search);
  }
  sidebar.append(sideTop);
  const listPane = el("div", "sidebar-scroll");
  const main = el("main", "main-panel");
  if (activeTab === "chats") {
    listPane.className = "sidebar-scroll chat-list";
    const quick = el("div", "list-label-row");
    quick.append(el("span", "list-label", t("recentChats")), el("span", "list-count", String(chats.length)));
    listPane.append(quick);
    sidebar.append(listPane);
    renderChatList(listPane);
    renderConversation(main);
  } else if (activeTab === "friends") {
    renderFriendsPage(listPane, main);
    sidebar.append(listPane);
  } else if (activeTab === "groups") {
    const heading = el("div", "list-label-row");
    heading.append(el("span", "list-label", t("yourGroups")), button(t("createGroup"), openCreateGroup, "tiny-action", "plus"));
    listPane.append(heading);
    for (const item of chats.filter((chat) => chat.type === "group")) listPane.append(chatListItem(item, () => {
      selectedChat = item; activeTab = "chats"; renderDashboard();
    }));
    if (!chats.some((chat) => chat.type === "group")) listPane.append(el("p", "empty-copy", t("noGroups")));
    sidebar.append(listPane);
    renderGroupsPage(main);
  } else {
    sidebar.append(el("div", "sidebar-scroll"));
    renderSettingsPage(main);
  }

  const footer = el("div", "sidebar-footer");
  const userBlock = el("div", "current-user");
  userBlock.append(avatar(currentUser.display_name || currentUser.username, 1));
  const identity = el("div", "identity");
  identity.append(el("strong", "", currentUser.display_name || currentUser.username), el("span", "", `@${currentUser.username}`));
  userBlock.append(identity);
  const logout = button(t("logout"), async () => {
    try { await request("/api/auth/logout", { method: "POST" }); }
    catch (error) { console.error("Could not end session:", error.message); }
    if (activeCall) finishLocalCall();
    if (incomingCall) { incomingCall = null; closeCallDialog(); }
    disconnectSocket();
    accessToken = null;
    currentUser = null;
    chats = [];
    friends = [];
    chatSignature = "";
    messageSignatures.clear();
    selectedChat = null;
    renderAuth();
  }, "logout-button", "logout");
  footer.append(userBlock, logout);
  sidebar.append(footer);

  shell.append(rail, sidebar, main);
  if (activeTab === "chats" && selectedChat) shell.classList.add("conversation-open");
  app.append(shell);
  if (activeTab === "chats" && selectedChat) loadMessages(selectedChat, false);
  window.onkeydown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      const search = document.querySelector(".search-box input");
      search?.focus();
    }
    if (event.key === "Escape" && window.matchMedia("(max-width: 760px)").matches) {
      selectedChat = null; renderDashboard();
    }
  };
}

function renderChatList(targetPane = document.querySelector(".chat-list")) {
  const pane = targetPane;
  if (!pane) return;
  const label = pane.querySelector(".list-label-row");
  pane.replaceChildren();
  if (label) pane.append(label);
  const filtered = chats.filter((chat) => {
    const haystack = `${chat.name} ${chat.username || ""} ${chat.lastMessage}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });
  if (!filtered.length) {
    const empty = el("div", "list-empty");
    empty.append(icon("chat"), el("p", "", t(searchQuery ? "noSearchResults" : "noChats")));
    pane.append(empty);
    return;
  }
  for (const chat of filtered) pane.append(chatListItem(chat, () => {
    selectedChat = chat;
    replyTo = null;
    activeTab = "chats";
    renderDashboard();
  }));
}

function chatListItem(chat, onClick) {
  const item = el("button", `chat-list-item${selectedChat?.key === chat.key ? " selected" : ""}`);
  item.type = "button";
  item.addEventListener("click", onClick);
  item.append(avatar(chat.name, chat.id));
  const summary = el("span", "chat-summary");
  const firstLine = el("span", "chat-first-line");
  firstLine.append(el("strong", "", chat.name), el("time", "chat-time", chat.lastAt ? formatTime(chat.lastAt) : ""));
  const secondLine = el("span", "chat-second-line");
  secondLine.append(el("span", "last-message", chat.lastMessage || (chat.type === "group" ? t("groupWelcome") : t("startConversation"))));
  if (chat.unread) secondLine.append(el("span", "unread-count", String(chat.unread)));
  summary.append(firstLine, secondLine);
  item.append(summary);
  return item;
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));
}

function renderConversation(main) {
  main.replaceChildren();
  if (!selectedChat) {
    main.classList.add("welcome-panel");
    const welcome = el("div", "welcome-content");
    const art = el("div", "welcome-art");
    art.append(icon("logo", "welcome-mark"));
    const caption = el("span", "art-label", t("privateByDesign"));
    art.append(caption);
    welcome.append(art, el("span", "overline", t("welcomeOverline")), el("h1", "", t("welcomeTitle")), el("p", "welcome-copy", t("welcomeCopy")));
    main.append(welcome);
    return;
  }
  main.classList.add("conversation-panel");
  const header = el("header", "conversation-header");
  const back = button(t("back"), () => { selectedChat = null; renderDashboard(); }, "mobile-back", "back");
  const person = el("div", "conversation-person");
  person.append(avatar(selectedChat.name, selectedChat.id));
  const details = el("div", "conversation-details");
  details.append(el("strong", "", selectedChat.name));
  details.append(el("span", selectedChat.online ? "presence online" : "presence", selectedChat.type === "group" ? t("groupMembersSubtitle") : selectedChat.online ? t("online") : t("privateChat")));
  person.append(details);
  const controls = el("div", "conversation-actions");
  const videoButton = button(t("videoComingSoon"), () => {}, "icon-button disabled", "video");
  videoButton.disabled = true;
  controls.append(
    button(t(selectedChat.type === "group" && selectedChat.callInProgress ? "joinCall" : "voiceCall"),
      () => startCall("audio"), "icon-button call-action", "phone"),
    videoButton,
    button(t("shareScreen"), () => {
      if (activeCall?.chatKey === selectedChat.key) toggleScreenShare();
      else if (activeCall) showToast(t("alreadyInCall"));
      else startCall("share");
    }, "icon-button", "screen")
  );
  if (selectedChat.type === "group") controls.append(button(t("groupInfo"), openGroupInfo, "icon-button", "users"));
  header.append(back, person, controls);
  const messages = el("section", "message-area");
  messages.setAttribute("aria-label", t("messageHistory"));
  messages.setAttribute("aria-live", "polite");
  messages.setAttribute("aria-relevant", "additions text");
  const typing = el("div", "typing-indicator");
  const composer = buildComposer(messages);
  main.append(header, messages, typing, composer);
}

async function loadMessages(chat, keepScroll) {
  if (!chat || !document.querySelector(".message-area") || messageLoads.has(chat.key)) return;
  messageLoads.add(chat.key);
  const pane = document.querySelector(".message-area");
  const atBottom = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
  try {
    const result = await request(`/api/chats/${encodeURIComponent(chat.key)}/messages`);
    if (selectedChat?.key !== chat.key || !document.querySelector(".message-area")) return;
    const signature = JSON.stringify(result.messages.map((message) => [
      message.id, message.sender_id, message.content, message.reply_content, message.created_at, message.delivered_at, message.read_at
    ]));
    if (signature === messageSignatures.get(chat.key)) {
      await refreshChats();
      return;
    }
    messageSignatures.set(chat.key, signature);
    pane.replaceChildren();
    if (!result.messages.length) {
      const empty = el("div", "messages-empty");
      empty.append(el("span", "empty-sparkle", "✦"), el("strong", "", t("firstMessageTitle")), el("span", "", t("firstMessageCopy")));
      pane.append(empty);
    } else {
      let previousDay = "";
      for (const message of result.messages) {
        const day = new Date(message.created_at).toLocaleDateString(language === "ar" ? "ar" : "en", { dateStyle: "long" });
        if (day !== previousDay) {
          const divider = el("div", "day-divider");
          divider.append(el("span", "", day));
          pane.append(divider);
          previousDay = day;
        }
        pane.append(renderMessage(message, chat));
      }
    }
    if (!keepScroll || atBottom) pane.scrollTop = pane.scrollHeight;
    await refreshChats();
  } catch (error) {
    if (error.code === "UNAUTHORIZED") return expireSession();
    console.error("Could not load messages:", error.message);
  } finally {
    messageLoads.delete(chat.key);
  }
}

function renderMessage(message, chat) {
  const mine = message.sender_id === currentUser.id;
  const bubble = el("article", `message-row ${mine ? "outgoing" : "incoming"}`);
  if (chat.type === "group" && !mine) bubble.append(el("strong", "message-sender", message.sender_name));
  if (message.reply_content) bubble.append(el("div", "reply-preview", message.reply_content));
  const content = el("p", "message-content", message.content);
  content.dir = "auto";
  bubble.append(content);
  const meta = el("div", "message-meta");
  meta.append(el("time", "", formatTime(message.created_at)));
  if (mine) meta.append(el("span", "message-status", message.read_at ? "✓✓" : message.delivered_at ? "✓✓" : "✓"));
  meta.append(button(t("messageActions"), (event) => {
    event.stopPropagation();
    showMessageMenu(message, chat, bubble);
  }, "message-actions", "more"));
  bubble.append(meta);
  bubble.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showMessageMenu(message, chat, bubble);
  });
  bubble.addEventListener("dblclick", () => {
    replyTo = { id: message.id, content: message.content };
    const quote = document.querySelector(".replying-to");
    quote?.remove();
    const composer = document.querySelector(".composer");
    composer?.prepend(replyBanner());
    document.querySelector(".composer textarea")?.focus();
  });
  return bubble;
}

function showMessageMenu(message, chat, bubble) {
  document.querySelector(".message-popover")?.remove();
  const menu = el("div", "message-popover");
  menu.append(
    button(t("reply"), () => {
      replyTo = { id: message.id, content: message.content };
      document.querySelector(".composer")?.prepend(replyBanner());
      document.querySelector(".composer textarea")?.focus();
      menu.remove();
    }, "menu-action", "reply"),
    button(t("deleteForMe"), async () => {
      try {
        await request(`/api/chats/${encodeURIComponent(chat.key)}/messages/${message.id}`, { method: "DELETE" });
        await loadMessages(chat, true);
      } catch (error) { showToast(errorText(error)); }
      menu.remove();
    }, "menu-action", "trash")
  );
  bubble.append(menu);
}

function replyBanner() {
  const banner = el("div", "replying-to");
  banner.append(el("span", "", `${t("replyingTo")} ${replyTo?.content || ""}`));
  banner.append(button(t("cancel"), () => { replyTo = null; banner.remove(); }, "tiny-action", "close"));
  return banner;
}

function buildComposer(messages) {
  const composer = el("form", "composer");
  const replyArea = el("div", "reply-area");
  const tools = el("div", "composer-tools");
  const emoji = button(t("emoji"), () => {
    const menu = document.querySelector(".emoji-tray");
    if (menu) { menu.remove(); return; }
    const tray = el("div", "emoji-tray");
    for (const value of ["😊", "😂", "❤️", "👍", "🎉", "✨", "🙏", "👋"]) {
      const pick = el("button", "emoji-option", value);
      pick.type = "button";
      pick.addEventListener("click", () => {
        textarea.value += value;
        textarea.focus();
        tray.remove();
      });
      tray.append(pick);
    }
    composer.append(tray);
  }, "icon-button", "smile");
  const attach = button(t("attachmentsComingSoon"), () => showFeatureNotice("attachmentsNotReady"), "icon-button", "paperclip");
  const textarea = el("textarea", "message-input");
  textarea.placeholder = t("messagePlaceholder");
  textarea.rows = 1;
  textarea.maxLength = 4000;
  textarea.setAttribute("aria-label", t("messagePlaceholder"));
  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      composer.requestSubmit();
    }
  });
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    if (socket?.readyState === WebSocket.OPEN && (!textarea.dataset.lastTyping || Date.now() - Number(textarea.dataset.lastTyping) > 900)) {
      socket.send(JSON.stringify({ type: "typing", chatKey: selectedChat?.key }));
      textarea.dataset.lastTyping = String(Date.now());
    }
  });
  const send = el("button", "send-button");
  send.type = "submit";
  send.setAttribute("aria-label", t("send"));
  send.append(icon("send"));
  tools.append(emoji, attach);
  const inputWrap = el("div", "composer-field");
  if (replyTo) replyArea.append(replyBanner());
  inputWrap.append(textarea);
  composer.append(replyArea, tools, inputWrap, send);
  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = textarea.value.trim();
    if (!content || !selectedChat) return;
    send.disabled = true;
    try {
      const chat = selectedChat;
      await request(`/api/chats/${encodeURIComponent(chat.key)}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, replyTo: replyTo?.id || null })
      });
      textarea.value = "";
      textarea.style.height = "auto";
      replyTo = null;
      replyArea.replaceChildren();
      await loadMessages(chat, false);
    } catch (error) {
      showToast(errorText(error));
    } finally {
      send.disabled = false;
      textarea.focus();
    }
  });
  return composer;
}

function renderFriendsPage(sidebarPane, main) {
  const searchArea = el("form", "friend-search-form");
  const field = el("input", "text-input");
  field.placeholder = t("searchPlaceholder");
  field.pattern = "[A-Za-z0-9_]{3,20}";
  field.maxLength = 20;
  field.setAttribute("aria-label", t("searchPlaceholder"));
  const submit = el("button", "pill-button primary-action", t("search"));
  submit.type = "submit";
  const result = el("div", "friend-search-result");
  searchArea.append(field, submit);
  searchArea.addEventListener("submit", async (event) => {
    event.preventDefault();
    result.replaceChildren();
    try {
      const found = await request(`/api/friends/search?username=${encodeURIComponent(field.value)}`);
      if (!found.user) { result.textContent = t("USER_NOT_FOUND"); return; }
      result.append(el("span", "", found.user.username), button(t("add"), async () => {
        try {
          await request("/api/friends/requests", { method: "POST", body: JSON.stringify({ username: found.user.username }) });
          showToast(t("requestSent"));
          await renderDashboard();
        } catch (error) { result.textContent = errorText(error); }
      }, "small-action with-label", "userPlus"));
    } catch (error) { result.textContent = errorText(error); }
  });
  sidebarPane.append(el("div", "list-label-row", t("findFriends")), searchArea, el("div", "list-label-row", t("friends")));
  for (const friend of friends) {
    const row = el("button", "friend-row");
    row.type = "button";
    row.append(avatar(friend.display_name || friend.username, friend.id), el("span", "", friend.display_name || friend.username));
    row.addEventListener("click", () => openDirectChat(friend));
    sidebarPane.append(row);
  }
  const content = el("section", "page-content");
  const header = el("div", "page-heading");
  header.append(el("span", "overline", t("peopleOverline")), el("h1", "", t("tabFriends")), el("p", "", t("friendsIntro")));
  const cards = el("div", "people-grid");
  for (const friend of friends) {
    const card = el("article", "person-card");
    const head = el("div", "person-card-head");
    head.append(avatar(friend.display_name || friend.username, friend.id), el("strong", "", friend.display_name || friend.username));
    const actions = el("div", "person-card-actions");
    actions.append(
      button(t("message"), () => openDirectChat(friend), "small-action with-label", "message"),
      button(t("remove"), async () => {
        try {
          await request(`/api/friends/${friend.id}`, { method: "DELETE" });
          await bootApp();
        } catch (error) { showToast(errorText(error)); }
      }, "ghost-small with-label", "x"),
      button(t("block"), async () => {
        try {
          await request(`/api/friends/${friend.id}/block`, { method: "POST" });
          await bootApp();
        } catch (error) { showToast(errorText(error)); }
      }, "ghost-small with-label", "block")
    );
    card.append(head, actions);
    cards.append(card);
  }
  if (!friends.length) cards.append(el("p", "empty-copy", t("noFriends")));
  content.append(header, result, cards);
  main.replaceChildren(content);
  loadFriendRequests(content);
}

async function loadFriendRequests(container) {
  try {
    const data = await request("/api/friends");
    const blockedData = await request("/api/friends/blocked");
    const sections = [
      [t("incoming"), data.incoming, true],
      [t("outgoing"), data.outgoing, false],
      [t("blocked"), blockedData.blocked, "blocked"]
    ];
    const area = el("div", "request-sections");
    for (const [label, rows, type] of sections) {
      const section = el("section", "request-section");
      section.append(el("h2", "", label));
      if (!rows.length) section.append(el("p", "empty-copy", t("noRequests")));
      for (const person of rows) {
        const username = person.username;
        const userId = person.user_id || person.id;
        const row = el("div", "request-row");
        row.append(avatar(username, userId), el("strong", "", username));
        if (type === true) {
          row.append(button(t("accept"), async () => {
            try { await request(`/api/friends/requests/${person.id}/accept`, { method: "POST", body: "{}" }); await bootApp(); }
            catch (error) { showToast(errorText(error)); }
          }, "small-action with-label", "check"));
          row.append(button(t("reject"), async () => {
            try { await request(`/api/friends/requests/${person.id}`, { method: "DELETE" }); await bootApp(); }
            catch (error) { showToast(errorText(error)); }
          }, "ghost-small with-label", member.role === "admin" ? "check" : "userPlus"));
        } else if (type === false) {
          row.append(button(t("cancel"), async () => {
            try { await request(`/api/friends/requests/${person.id}`, { method: "DELETE" }); await bootApp(); }
            catch (error) { showToast(errorText(error)); }
          }, "ghost-small with-label", "close"));
        } else {
          row.append(button(t("unblock"), async () => {
            try { await request(`/api/friends/${userId}/block`, { method: "DELETE" }); await bootApp(); }
            catch (error) { showToast(errorText(error)); }
          }, "ghost-small with-label", "check"));
        }
        section.append(row);
      }
      area.append(section);
    }
    container.append(area);
  } catch (error) { showToast(errorText(error)); }
}

async function openDirectChat(friend) {
  const result = await request("/api/chats");
  chats = result.chats;
  selectedChat = chats.find((chat) => chat.type === "direct" && chat.id === friend.id) || {
    key: `u:${friend.id}`, type: "direct", id: friend.id, name: friend.display_name || friend.username, online: false
  };
  activeTab = "chats";
  renderDashboard();
}

async function renderGroupsPage(main) {
  const content = el("section", "page-content");
  const header = el("div", "page-heading page-heading-row");
  const title = el("div");
  title.append(el("span", "overline", t("groupsOverline")), el("h1", "", t("tabGroups")), el("p", "", t("groupsIntro")));
  header.append(title, button(t("createGroup"), openCreateGroup, "pill-button primary-action", "plus"));
  const grid = el("div", "group-cards");
  for (const chat of chats.filter((item) => item.type === "group")) {
    const card = el("button", "group-card");
    card.type = "button";
    card.append(avatar(chat.name, chat.id), el("strong", "", chat.name), el("span", "", t(chat.role === "owner" ? "groupOwner" : chat.role === "admin" ? "groupAdmin" : "groupMember")));
    card.addEventListener("click", () => { selectedChat = chat; activeTab = "chats"; renderDashboard(); });
    grid.append(card);
  }
  if (!grid.children.length) {
    const empty = el("div", "empty-card");
    empty.append(el("p", "", t("noGroups")));
    grid.append(empty);
  }
  content.append(header, grid);
  main.replaceChildren(content);
}

async function openCreateGroup() {
  const dialog = createDialog(t("createGroup"), t("createGroupHelp"));
  const nameInput = el("input", "text-input");
  nameInput.placeholder = t("groupName");
  nameInput.setAttribute("aria-label", t("groupName"));
  nameInput.maxLength = 60;
  const list = el("div", "member-picker");
  for (const friend of friends) {
    const label = el("label", "check-row");
    const checkbox = el("input");
    checkbox.type = "checkbox";
    checkbox.value = String(friend.id);
    label.append(checkbox, el("span", "", friend.display_name || friend.username));
    list.append(label);
  }
  if (!friends.length) list.append(el("p", "empty-copy", t("addFriendsFirst")));
  dialog.body.append(nameInput, list);
  dialog.submit.addEventListener("click", async () => {
    const memberIds = [...list.querySelectorAll("input:checked")].map((input) => Number(input.value));
    try {
      await request("/api/groups", { method: "POST", body: JSON.stringify({ name: nameInput.value, memberIds }) });
      dialog.element.close();
      await bootApp();
      activeTab = "groups";
      renderDashboard();
    } catch (error) { dialog.error.textContent = errorText(error); }
  });
  dialog.element.showModal();
  nameInput.focus();
}

async function openGroupInfo() {
  if (!selectedChat || selectedChat.type !== "group") return;
  const dialog = createDialog(t("groupInfo"), selectedChat.name);
  dialog.submit.hidden = true;
  dialog.element.classList.add("wide-dialog");
  const memberList = el("div", "group-member-list");
  const tools = el("div", "group-add-row");
  const friendSelect = el("select", "text-input");
  friendSelect.append(new Option(t("selectFriendOption"), ""));
  for (const friend of friends) friendSelect.append(new Option(friend.display_name || friend.username, String(friend.id)));
  tools.append(friendSelect, button(t("add"), async () => {
    try {
      if (!friendSelect.value) return;
      await request(`/api/groups/${selectedChat.id}/members`, { method: "POST", body: JSON.stringify({ userId: Number(friendSelect.value) }) });
      await updateMembers();
    } catch (error) { dialog.error.textContent = errorText(error); }
  }, "small-action with-label", "userPlus"));
  dialog.body.append(memberList, tools);
  async function updateMembers() {
    const result = await request(`/api/groups/${selectedChat.id}/members`);
    memberList.replaceChildren();
    for (const member of result.members) {
      const row = el("div", "request-row");
      row.append(avatar(member.display_name, member.id), el("strong", "", member.display_name), el("span", "role-label", t(`role_${member.role}`)));
      const canManage = ["owner", "admin"].includes(selectedChat.role) && member.role !== "owner";
      if (canManage) {
        if (selectedChat.role === "owner") {
          row.append(button(t(member.role === "admin" ? "demote" : "promote"), async () => {
            try {
              await request(`/api/groups/${selectedChat.id}/members/${member.id}`, { method: "PATCH", body: JSON.stringify({ role: member.role === "admin" ? "member" : "admin" }) });
              await updateMembers();
            } catch (error) { dialog.error.textContent = errorText(error); }
          }, "ghost-small with-label", "x"));
          row.append(button(t("transferOwnership"), async () => {
            try {
              await request(`/api/groups/${selectedChat.id}/members/${member.id}`, { method: "PATCH", body: JSON.stringify({ role: "owner" }) });
              selectedChat.role = "admin";
              await refreshChats();
              await updateMembers();
            } catch (error) { dialog.error.textContent = errorText(error); }
          }, "ghost-small with-label", "users"));
        }
        row.append(button(t("remove"), async () => {
          try {
            await request(`/api/groups/${selectedChat.id}/members/${member.id}`, { method: "DELETE" });
            await updateMembers();
          } catch (error) { dialog.error.textContent = errorText(error); }
        }, "ghost-small with-label", "x"));
      }
      memberList.append(row);
    }
  }
  await updateMembers();
  const leave = button(t("leaveGroup"), async () => {
    try {
      await request(`/api/groups/${selectedChat.id}/members/${currentUser.id}`, { method: "DELETE" });
      dialog.element.close();
      selectedChat = null;
      await bootApp();
    } catch (error) { dialog.error.textContent = errorText(error); }
  }, "ghost-small");
  dialog.footer.append(leave);
  dialog.element.showModal();
}

function createDialog(title, subtitle) {
  const elementDialog = el("dialog", "app-dialog");
  const heading = el("div", "dialog-heading");
  const headingText = el("div", "dialog-title");
  const headingId = `dialog-${crypto.randomUUID()}`;
  const dialogTitle = el("h2", "", title);
  dialogTitle.id = headingId;
  headingText.append(dialogTitle);
  elementDialog.setAttribute("aria-labelledby", headingId);
  heading.append(headingText, button(t("close"), () => elementDialog.close(), "icon-button", "close"));
  const body = el("div", "dialog-body");
  if (subtitle) body.append(el("p", "dialog-subtitle", subtitle));
  const error = el("p", "form-error");
  const footer = el("div", "dialog-footer");
  const cancel = button(t("cancel"), () => elementDialog.close(), "ghost-small");
  const submit = el("button", "pill-button primary-action", t("create"));
  submit.type = "button";
  footer.append(error, cancel, submit);
  elementDialog.append(heading, body, footer);
  elementDialog.addEventListener("click", (event) => { if (event.target === elementDialog) elementDialog.close(); });
  document.body.append(elementDialog);
  elementDialog.addEventListener("close", () => elementDialog.remove());
  return { element: elementDialog, body, footer, error, submit };
}

function renderSettingsPage(main) {
  const content = el("section", "page-content");
  const header = el("div", "page-heading");
  header.append(el("span", "overline", t("settingsOverline")), el("h1", "", t("tabSettings")), el("p", "", t("settingsIntro")));
  const card = el("form", "settings-card");
  const section = el("div", "settings-profile");
  section.append(avatar(currentUser.display_name || currentUser.username, 1));
  const identity = el("div");
  identity.append(el("strong", "", currentUser.display_name || currentUser.username));
  section.append(identity);
  const nameLabel = el("label", "field-label", t("displayName"));
  const displayName = el("input", "text-input");
  displayName.value = currentUser.display_name || currentUser.username;
  displayName.maxLength = 40;
  nameLabel.append(displayName);
  const aboutLabel = el("label", "field-label", t("about"));
  const about = el("textarea", "text-input about-input");
  about.value = currentUser.about || "";
  about.maxLength = 140;
  aboutLabel.append(about);
  const languageLabel = el("label", "field-label", t("languageSetting"));
  const languageSelect = el("select", "text-input");
  languageSelect.append(new Option("English", "en"), new Option("العربية", "ar"));
  languageSelect.value = language;
  languageLabel.append(languageSelect);
  const error = el("p", "form-error");
  const save = el("button", "pill-button primary-action", t("saveChanges"));
  save.type = "submit";
  card.append(section, nameLabel, aboutLabel, languageLabel, error, save);
  card.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const result = await request("/api/profile", { method: "PATCH", body: JSON.stringify({ displayName: displayName.value, about: about.value }) });
      currentUser = { ...currentUser, ...result.user };
      if (languageSelect.value !== language) language = languageSelect.value;
      localStorage.setItem(languageKey, language);
      await loadLanguage();
      showToast(t("profileSaved"));
      renderDashboard();
    } catch (issue) { error.textContent = errorText(issue); }
  });
  content.append(header, card);
  main.replaceChildren(content);
}

function updateConversationStatus() {
  const label = document.querySelector(".conversation-details .presence");
  if (label && selectedChat?.type === "direct") {
    label.textContent = t(selectedChat.online ? "online" : "privateChat");
    label.classList.toggle("online", selectedChat.online);
  }
}

function showFeatureNotice(key) {
  showToast(t(key));
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = el("div", "toast", message);
  toast.setAttribute("role", "status");
  app.append(toast);
  setTimeout(() => toast.remove(), 3500);
}

function disconnectSocket() {
  clearTimeout(reconnectTimer);
  if (activeCall) {
    sendCallEvent({ type: "call:leave", chatKey: activeCall.chatKey, callId: activeCall.callId, reason: "connection-lost" });
    finishLocalCall();
  }
  if (incomingCall) {
    const invitation = incomingCall;
    incomingCall = null;
    sendCallEvent({ type: "call:decline", chatKey: invitation.chatKey, callId: invitation.callId });
    closeCallDialog();
  }
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

async function expireSession() {
  if (activeCall) finishLocalCall();
  if (incomingCall) { incomingCall = null; closeCallDialog(); }
  disconnectSocket();
  accessToken = null;
  currentUser = null;
  chats = [];
  friends = [];
  chatSignature = "";
  messageSignatures.clear();
  selectedChat = null;
  renderAuth();
}

async function restoreSession() {
  try {
    const session = await request("/api/auth/refresh", { method: "POST" });
    accessToken = session.accessToken;
    currentUser = session.user;
    await bootApp();
  } catch {
    accessToken = null;
    currentUser = null;
    renderAuth();
  }
}

async function render() {
  await loadLanguage();
  if (accessToken && currentUser) await bootApp();
  else renderAuth();
}

loadLanguage().then(restoreSession).catch((error) => {
  console.error("Application startup failed:", error.message);
  app.textContent = t("loadError");
});
