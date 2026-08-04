import { describe, expect, it } from "vitest";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./auth";

describe("hashPassword / verifyPassword", () => {
  it("accepts the correct password", async () => {
    const stored = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("correct-horse-battery-staple", stored)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const stored = await hashPassword("correct-horse-battery-staple");
    expect(await verifyPassword("wrong-password", stored)).toBe(false);
  });

  it("salts each hash differently, even for the same password", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored value instead of throwing", async () => {
    expect(await verifyPassword("anything", "not-a-valid-hash")).toBe(false);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  const secret = "test-secret";

  it("round-trips a valid, unexpired token", async () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await createSessionToken({ userId: 42, exp }, secret);
    const payload = await verifySessionToken(token, secret);
    expect(payload).toEqual({ userId: 42, exp });
  });

  it("rejects a token signed with a different secret", async () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await createSessionToken({ userId: 42, exp }, secret);
    expect(await verifySessionToken(token, "wrong-secret")).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await createSessionToken({ userId: 42, exp }, secret);
    const [, signature] = token.split(".");
    const tampered = `${btoa(JSON.stringify({ userId: 999, exp }))}.${signature}`;
    expect(await verifySessionToken(tampered, secret)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const token = await createSessionToken({ userId: 42, exp }, secret);
    expect(await verifySessionToken(token, secret)).toBeNull();
  });
});
