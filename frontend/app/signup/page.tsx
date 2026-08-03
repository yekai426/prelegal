"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-navy dark:text-white">Sign up</h1>
      <AuthForm
        mode="signup"
        onSuccess={() => router.push("/")}
        footer={
          <>
            Already have an account?{" "}
            <Link href="/signin" className="underline">
              Sign in
            </Link>
          </>
        }
      />
    </div>
  );
}
