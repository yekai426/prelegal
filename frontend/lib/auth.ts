import { ApiError, parseErrorDetail } from "./apiError";

export class AuthApiError extends ApiError {}

export interface AuthUser {
  id: number;
  email: string;
  createdAt: string;
}

interface UserWire {
  id: number;
  email: string;
  created_at: string;
}

function mapUser(body: UserWire): AuthUser {
  return { id: body.id, email: body.email, createdAt: body.created_at };
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new AuthApiError(res.status, await parseErrorDetail(res));
  return mapUser(await res.json());
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new AuthApiError(res.status, await parseErrorDetail(res));
  return mapUser(await res.json());
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new AuthApiError(res.status, await parseErrorDetail(res));
  return mapUser(await res.json());
}

export async function signOut(): Promise<void> {
  const res = await fetch("/api/auth/signout", { method: "POST" });
  if (!res.ok) throw new AuthApiError(res.status, await parseErrorDetail(res));
}
