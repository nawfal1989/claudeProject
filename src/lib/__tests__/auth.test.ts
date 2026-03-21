// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({ set: mockSet, get: mockGet, delete: mockDelete })
  ),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

beforeEach(() => {
  vi.clearAllMocks();
});

// createSession

test("createSession sets the auth-token cookie", async () => {
  await createSession("user-1", "test@example.com");
  expect(mockSet).toHaveBeenCalledOnce();
  const [cookieName] = mockSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("createSession sets httpOnly on the cookie", async () => {
  await createSession("user-1", "test@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
});

test("createSession sets sameSite to lax", async () => {
  await createSession("user-1", "test@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.sameSite).toBe("lax");
});

test("createSession sets path to /", async () => {
  await createSession("user-1", "test@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.path).toBe("/");
});

test("createSession cookie expires in ~7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();
  const [, , options] = mockSet.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession secure is false outside production", async () => {
  await createSession("user-1", "test@example.com");
  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession token contains userId and email", async () => {
  await createSession("user-123", "user@example.com");
  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("user@example.com");
});

test("createSession token expires in 7 days", async () => {
  const before = Math.floor(Date.now() / 1000);
  await createSession("user-1", "test@example.com");
  const after = Math.floor(Date.now() / 1000);
  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  const sevenDays = 7 * 24 * 60 * 60;
  expect(payload.exp).toBeGreaterThanOrEqual(before + sevenDays - 5);
  expect(payload.exp).toBeLessThanOrEqual(after + sevenDays + 5);
});

// getSession

test("getSession returns null when no cookie present", async () => {
  mockGet.mockReturnValue(undefined);
  expect(await getSession()).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  mockGet.mockReturnValue({ value: "not-a-valid-jwt" });
  expect(await getSession()).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await new SignJWT({ userId: "user-1", email: "test@example.com", expiresAt: new Date() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("test@example.com");
});

// deleteSession

test("deleteSession deletes the auth-token cookie", async () => {
  await deleteSession();
  expect(mockDelete).toHaveBeenCalledWith("auth-token");
});

// verifySession

test("verifySession returns null when no cookie in request", async () => {
  const request = new NextRequest("http://localhost/api/test");
  expect(await verifySession(request)).toBeNull();
});

test("verifySession returns null for an invalid token in request", async () => {
  const request = new NextRequest("http://localhost/api/test", {
    headers: { cookie: "auth-token=bad-token" },
  });
  expect(await verifySession(request)).toBeNull();
});

test("verifySession returns session payload for a valid token in request", async () => {
  const token = await new SignJWT({ userId: "user-2", email: "other@example.com", expiresAt: new Date() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const request = new NextRequest("http://localhost/api/test", {
    headers: { cookie: `auth-token=${token}` },
  });

  const session = await verifySession(request);
  expect(session?.userId).toBe("user-2");
  expect(session?.email).toBe("other@example.com");
});
