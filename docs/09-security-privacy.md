# 09 — Security and Privacy

## 1. Principles (privacy by design)

| principle | implementation |
|---|---|
| Camera **off by default** | started only by an explicit button; one shared stream; the status-bar indicator always shows the real state |
| Microphone **off by default** | used only for a single "Ask by voice" utterance |
| No secret recording | nothing is recorded; frames go only to on-device models |
| No secret identification | no face recognition or matching; presence is "a face is visible", nothing more |
| No transmission | no server, no analytics, no upload; the app is static |
| Prefer on-device | MediaPipe WASM is self-hosted; OMNIBAL/HORN run locally or in a Web Worker |
| No gender inference | presentation is an explicit choice; neutral by default |

**User controls** (Security page):
- allow / disallow camera and mic
- disable camera now
- disable agent actions
- **Emergency stop**
- clear local memory
- **delete persona data**: deletes every IndexedDB database, keys and local settings

## 2. Authentication and authorisation

- **Passkeys (WebAuthn).** `userVerification: "required"`, platform authenticator. The OS handles fingerprint, face or PIN, and **JavaScript never sees biometric data**.
- **PIN fallback.** PBKDF2-SHA-256, 210,000 iterations, 16-byte random salt, constant-time comparison.
- **Client-only caveat.** Without a server, a passkey assertion proves local user verification on this device. A production deployment must verify assertions server-side against a stored public key and a server-issued challenge.
- **PersonaCredential** holds only safe references: `personaId`, `deviceId` (crypto-random), the passkey id, the public key, the presentation choice and a timestamp.

## 3. Signed, auditable persona actions

Each audit entry contains `personaId, deviceId, timestamp, actionType, authorizationLevel, payloadHash` and is signed with an **ECDSA P-256 key generated as non-extractable** and stored in IndexedDB as a `CryptoKey`. Sensitive actions pass, in order:

```
authentication → authorisation (level gate) → intent check (instruction record)
→ risk classification (level 0–5, external flag) → confirmation (approval) → audit log
```

## 4. Randomness

- All security randomness uses `crypto.getRandomValues`: ids, salts, challenges, IVs.
- **HORN is never used for security.** It is labelled "NOT A CRYPTOGRAPHIC RANDOM NUMBER GENERATOR" in code, docs and UI.

## 5. Storage hygiene

- Notes and documents are AES-GCM encrypted at rest (`EncryptedStore`).
- Cookies hold only tiny session hints (`SameSite=Strict`, `Secure` on https, ≤ 256 bytes). Names or values suggesting biometric, persona or identity data are **rejected by the library**.
- No biometric templates or AR identity data exist anywhere in the app.

## 6. HTTP headers (Netlify `_headers` / `netlify.toml`)

- `Permissions-Policy` limits camera, microphone, XR, wake-lock, sensors and WebAuthn to the same origin.
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- a strict `Referrer-Policy`
