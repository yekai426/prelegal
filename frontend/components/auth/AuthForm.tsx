"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AuthApiError } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";

const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50";

export function AuthForm({
  mode,
  onSuccess,
  footer,
}: {
  mode: "signin" | "signup";
  onSuccess?: () => void;
  footer?: ReactNode;
}) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy dark:text-white" htmlFor={`${mode}-email`}>
          Email
        </label>
        <input
          id={`${mode}-email`}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy dark:text-white" htmlFor={`${mode}-password`}>
          Password
        </label>
        <input
          id={`${mode}-password`}
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          className={inputClasses}
        />
      </div>

      {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-purple/90 disabled:opacity-50"
      >
        {isSubmitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
      </button>

      {footer && <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">{footer}</p>}
    </form>
  );
}
