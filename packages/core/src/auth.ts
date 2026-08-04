// Password hashing and session signing, built on the Web Crypto API only —
// no external auth dependency, so it runs the same in a Worker as it does
// under Vitest/Node (both expose globalThis.crypto). See story 10.2.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_LENGTH_BITS = 256;

export interface SessionPayload {
  userId: number;
  exp: number; // unix seconds
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = new Uint8Array(await deriveBits(password, salt));
  return `${toBase64(salt)}:${toBase64(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;

  const salt = fromBase64(saltB64);
  const expected = fromBase64(hashB64);
  const actual = new Uint8Array(await deriveBits(password, salt));
  return constantTimeEqual(actual, expected);
}

export async function createSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  const payloadB64 = toBase64(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = await sign(payloadB64, secret);
  if (!constantTimeEqual(fromBase64(signature), fromBase64(expectedSignature))) {
    return null;
  }

  const payload = JSON.parse(new TextDecoder().decode(fromBase64(payloadB64))) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function deriveBits(password: string, salt: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    KEY_LENGTH_BITS,
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64(new Uint8Array(signature));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
