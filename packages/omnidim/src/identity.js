/**
 * Identity & authorisation for the digital persona — client-side only.
 *
 * - Passkeys (WebAuthn, userVerification "required"): the OS handles any
 *   biometrics; JavaScript never sees a biometric template.
 * - Non-extractable ECDSA P-256 device key signs persona actions.
 * - PIN fallback: PBKDF2-SHA-256, 210k iterations, random salt.
 *
 * Without a server, a passkey assertion proves local user verification on
 * this device only. Production systems must verify assertions server-side.
 * Gender is NEVER inferred — presentation is an explicit user choice.
 */
import { createStore } from "./storage.js";

export const PRESENTATION_PROFILES = ["neutral", "masculine", "feminine", "androgynous", "custom"];

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** Cryptographically random id (never HORN). */
export function randomId(bytes = 16) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256Hex(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const Passkey = {
  async supported() {
    try {
      return typeof PublicKeyCredential !== "undefined" && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    } catch {
      return false;
    }
  },
  /** Create a platform passkey; returns its id reference. */
  async register(userName, rpName = "OMNIDIM JS") {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: rpName },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: userName, displayName: userName },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 60000,
      },
    });
    if (!cred) throw new Error("Passkey registration cancelled");
    return b64url(cred.rawId);
  },
  /** OS-level user verification with the stored passkey. */
  async verify(passkeyId) {
    try {
      const a = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ type: "public-key", id: fromB64url(passkeyId) }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      return !!a;
    } catch {
      return false;
    }
  },
};

export const Pin = {
  async hash(pin, saltB64) {
    const salt = saltB64 ? fromB64url(saltB64) : crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210_000, hash: "SHA-256" }, key, 256);
    return { salt: b64url(salt), hash: b64url(bits) };
  },
  async verify(pin, stored) {
    const { hash } = await Pin.hash(pin, stored.salt);
    if (hash.length !== stored.hash.length) return false;
    let diff = 0;
    for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ stored.hash.charCodeAt(i);
    return diff === 0;
  },
};

/** Non-extractable ECDSA device key stored in IndexedDB; signs persona actions. */
export class DeviceSigner {
  constructor(store = createStore("omnidim-identity", "keys")) {
    this.store = store;
    this.keyPair = null;
  }
  async init() {
    const existing = await this.store.get("device-key");
    if (existing?.privateKey) this.keyPair = existing;
    else {
      this.keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
      await this.store.set("device-key", this.keyPair);
    }
    return crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
  }
  /** Sign {personaId, deviceId, timestamp, actionType, authorizationLevel} + payload hash. */
  async sign(action, payload) {
    if (!this.keyPair) await this.init();
    const payloadHash = await sha256Hex(JSON.stringify(payload ?? null));
    const msg = JSON.stringify({ ...action, payloadHash });
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, this.keyPair.privateKey, new TextEncoder().encode(msg));
    return { ...action, payloadHash, signature: b64url(sig) };
  }
  async verify(signed) {
    if (!this.keyPair) await this.init();
    const { signature, ...rest } = signed;
    return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, this.keyPair.publicKey, fromB64url(signature), new TextEncoder().encode(JSON.stringify(rest)));
  }
  async reset() {
    this.keyPair = null;
    await this.store.delete("device-key");
  }
}

/** Visual style for an explicitly chosen presentation (never inferred). */
export function presentationStyle(p) {
  switch (p) {
    case "masculine":
      return { accent: "#3b82f6", hair: "short", label: "Masculine" };
    case "feminine":
      return { accent: "#ec4899", hair: "long", label: "Feminine" };
    case "androgynous":
      return { accent: "#a855f7", hair: "medium", label: "Androgynous" };
    case "custom":
      return { accent: "#f59e0b", hair: "medium", label: "Custom" };
    default:
      return { accent: "#14b8a6", hair: "none", label: "Neutral" };
  }
}

/** PersonaCredential: only safe references and ids. */
export function newPersonaCredential(presentation = "neutral") {
  return { personaId: randomId(12), deviceId: randomId(12), presentation, createdAt: Date.now() };
}
