"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

function normalize(pathname: string): string {
  return pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

const navLinkClasses = (active: boolean) =>
  active
    ? "font-medium text-brand-blue"
    : "text-zinc-600 hover:text-brand-blue dark:text-zinc-400 dark:hover:text-brand-blue";

export function Header() {
  const pathname = normalize(usePathname());
  const { status, user, signOut } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-navy dark:text-white">
            <span className="text-accent-yellow">●</span> Prelegal
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className={navLinkClasses(pathname === "/")}>
              Create
            </Link>
            <Link href="/documents" className={navLinkClasses(pathname === "/documents")}>
              My Documents
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {status === "authenticated" && user && (
            <>
              <span className="text-muted">{user.email}</span>
              <button type="button" onClick={() => signOut()} className="underline">
                Sign out
              </button>
            </>
          )}
          {status === "anonymous" && (
            <>
              <Link href="/signin" className="text-zinc-600 hover:text-brand-blue dark:text-zinc-400">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-brand-purple px-4 py-1.5 font-medium text-white transition-colors hover:bg-brand-purple/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
