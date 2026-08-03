"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-navy dark:text-white">Sign in</h1>
      <AuthForm
        mode="signin"
        onSuccess={() => router.push("/")}
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </>
        }
      />
    </div>
  );
}
