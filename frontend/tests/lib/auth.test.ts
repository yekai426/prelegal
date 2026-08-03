import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, fetchCurrentUser, signIn, signOut, signUp } from "@/lib/auth";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchCurrentUser", () => {
  it("returns the mapped user on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 1, email: "a@example.com", created_at: "2026-08-02T00:00:00" }),
      }),
    );
    await expect(fetchCurrentUser()).resolves.toEqual({
      id: 1,
      email: "a@example.com",
      createdAt: "2026-08-02T00:00:00",
    });
  });

  it("returns null (not an error) on 401 — anonymous is an expected state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("throws AuthApiError on any other failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ detail: "down" }),
      }),
    );
    await expect(fetchCurrentUser()).rejects.toBeInstanceOf(AuthApiError);
  });
});

describe("signUp", () => {
  it("posts email/password and returns the mapped user", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 2, email: "b@example.com", created_at: "2026-08-02T00:00:00" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await signUp("b@example.com", "password123");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/signup",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "b@example.com", password: "password123" }),
      }),
    );
    expect(result).toEqual({ id: 2, email: "b@example.com", createdAt: "2026-08-02T00:00:00" });
  });

  it("throws AuthApiError with the parsed detail on a conflict", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({ detail: "Email already registered" }),
      }),
    );
    await expect(signUp("dup@example.com", "password123")).rejects.toMatchObject({
      status: 409,
      message: "Email already registered",
    });
  });
});

describe("signIn", () => {
  it("posts email/password and returns the mapped user", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 3, email: "c@example.com", created_at: "2026-08-02T00:00:00" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await signIn("c@example.com", "password123");
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signin", expect.objectContaining({ method: "POST" }));
  });

  it("throws AuthApiError on incorrect credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ detail: "Incorrect email or password" }),
      }),
    );
    await expect(signIn("c@example.com", "wrong")).rejects.toBeInstanceOf(AuthApiError);
  });
});

describe("signOut", () => {
  it("posts to the signout endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await signOut();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/signout", { method: "POST" });
  });
});
