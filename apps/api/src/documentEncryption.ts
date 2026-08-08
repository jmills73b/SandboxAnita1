// Client correspondence and case documents are legally privileged, so
// files are encrypted here before they ever reach R2 -- a second layer on
// top of R2's own at-rest encryption, using a key that only this Worker
// holds (DOCUMENT_ENCRYPTION_KEY). AES-GCM needs a fresh random nonce (iv)
// per encryption; the caller is responsible for storing it (see the
// documents.iv column) since it's required again to decrypt.

// btoa/atob operate on binary strings, not arbitrary byte arrays, so both
// directions go via a manual char-code loop rather than pulling in
// @types/node just for Buffer -- these are only ever called on a 12-byte
// nonce or a 32-byte key, never the document bytes themselves.
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", base64ToBytes(base64Key), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptDocument(
  plaintext: ArrayBuffer,
  base64Key: string,
): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
  const key = await importKey(base64Key);
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes }, key, plaintext);
  return { ciphertext, iv: bytesToBase64(ivBytes) };
}

export async function decryptDocument(
  ciphertext: ArrayBuffer,
  ivBase64: string,
  base64Key: string,
): Promise<ArrayBuffer> {
  const key = await importKey(base64Key);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(ivBase64) }, key, ciphertext);
}
