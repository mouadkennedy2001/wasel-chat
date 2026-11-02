# Security notes

## Implemented protections

- Password hashing with bcrypt; case-insensitive unique usernames and generic login failure responses.
- Short-lived access JWTs and rotating refresh tokens stored hashed in SQLite and issued in HttpOnly, SameSite=Strict, Secure cookies.
- Custom-header and Origin checks on cookie-authenticated mutations, request-rate limits, input schemas, parameterized SQL, payload limits, CSP, and browser security headers.
- WebSocket origin checks, access-token authentication, message-rate limits, and authorization checks for private/group chats, typing events, and call signaling.
- Call signaling validates room membership, participant IDs, message types, and bounded SDP/ICE payloads; group rooms are capped at eight participants. The authenticated ICE configuration endpoint does not expose TURN credentials to unauthenticated users.
- Friend, block, group-membership, group-role, and message-resource authorization are enforced on the server.
- User text is rendered with text nodes and DOM APIs, not HTML injection.

## Important limitations

- Chat messages are currently **plaintext on the server** while stored in SQLite and are deleted after seven days. There is no message end-to-end encryption or cryptographic peer-identity verification; do not send sensitive information.
- WebRTC audio/screen media is encrypted by the browser transport, but the application does not independently verify peer identities.
- Calls and screen sharing need HTTPS (localhost is suitable for development); TURN is optional but often required behind restrictive NATs. Configure trusted TURN credentials through environment variables and never commit them.
- WebRTC peer-to-peer messaging, encrypted offline delivery, video calls, images/files, and avatar uploads have not been implemented.
- Refresh cookies use `Secure`; use HTTPS in production. The development cookie is intended for modern browsers' localhost secure-context behavior.
- SQLite persistence and multi-instance coordination need a persistent disk and an appropriate deployment architecture before production use.

Run `npm audit --prefix server` after dependency changes and review the deployment configuration before exposing a production service.
