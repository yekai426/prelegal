"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  fetchCurrentUser,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  type AuthUser,
} from "./auth";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  // Guards against the initial /me lookup resolving AFTER a manual sign-in/
  // sign-up/sign-out already settled the real state — without this, a slow
  // mount-time request can silently clobber a state change that happened
  // while it was still in flight.
  const manualActionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((current) => {
        if (cancelled || manualActionRef.current) return;
        setUser(current);
        setStatus(current ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (cancelled || manualActionRef.current) return;
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    manualActionRef.current = true;
    const current = await apiSignIn(email, password);
    setUser(current);
    setStatus("authenticated");
    return current;
  }

  async function signUp(email: string, password: string) {
    manualActionRef.current = true;
    const current = await apiSignUp(email, password);
    setUser(current);
    setStatus("authenticated");
    return current;
  }

  async function signOut() {
    manualActionRef.current = true;
    await apiSignOut();
    setUser(null);
    setStatus("anonymous");
  }

  return <AuthContext.Provider value={{ status, user, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
