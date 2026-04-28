// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";

const mockCookieStore = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

import { createSession } from "../auth";

const COOKIE_NAME = "auth-token";

// Decodes the JWT payload without verifying the signature, avoiding
// the cross-realm Uint8Array issue jose has in the jsdom environment.
function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadB64 = token.split(".")[1];
  return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets the auth-token cookie", async () => {
  await createSession("user-1", "user@example.com");
  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  expect(mockCookieStore.set.mock.calls[0][0]).toBe(COOKIE_NAME);
});

test("createSession stores a JWT with userId in the payload", async () => {
  await createSession("user-1", "user@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];
  expect(decodeJwtPayload(token).userId).toBe("user-1");
});

test("createSession stores a JWT with email in the payload", async () => {
  await createSession("user-1", "user@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];
  expect(decodeJwtPayload(token).email).toBe("user@example.com");
});

test("createSession JWT expires approximately 7 days from now", async () => {
  await createSession("user-1", "user@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];
  const { exp } = decodeJwtPayload(token);
  const sevenDaysFromNow = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  expect(exp as number).toBeGreaterThan(sevenDaysFromNow - 60);
  expect(exp as number).toBeLessThan(sevenDaysFromNow + 60);
});

test("createSession JWT is signed with HS256", async () => {
  await createSession("user-1", "user@example.com");
  const token: string = mockCookieStore.set.mock.calls[0][1];
  const header = JSON.parse(
    Buffer.from(token.split(".")[0], "base64url").toString("utf8")
  );
  expect(header.alg).toBe("HS256");
});

test("createSession sets httpOnly on the cookie", async () => {
  await createSession("user-1", "user@example.com");
  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite to lax", async () => {
  await createSession("user-1", "user@example.com");
  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.sameSite).toBe("lax");
});

test("createSession sets path to /", async () => {
  await createSession("user-1", "user@example.com");
  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.path).toBe("/");
});

test("createSession sets secure to false outside production", async () => {
  await createSession("user-1", "user@example.com");
  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(false);
});

test("createSession sets cookie expiry to approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();
  const options = mockCookieStore.set.mock.calls[0][2];
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
});
