"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import type { DocumentFields } from "@/lib/documentState";
import { DocumentsApiError, saveDocument, type DocumentSummary } from "@/lib/documents";
import { AuthForm } from "./auth/AuthForm";

export function SaveDocumentButton({
  documentType,
  fields,
}: {
  documentType: string;
  fields: DocumentFields;
}) {
  const { status } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<DocumentSummary | null>(null);

  async function performSave() {
    setError(null);
    setIsSaving(true);
    try {
      const result = await saveDocument(documentType, fields);
      setSaved(result);
      setShowAuthPrompt(false);
    } catch (err) {
      setError(err instanceof DocumentsApiError ? err.message : "Something went wrong saving this document.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClick() {
    setSaved(null);
    setError(null);
    if (status === "anonymous") {
      setShowAuthPrompt(true);
      return;
    }
    await performSave();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSaving || status === "loading"}
        className="inline-flex items-center justify-center rounded-full bg-brand-purple px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-purple/90 disabled:opacity-50"
      >
        {isSaving ? "Saving…" : "Save to my documents"}
      </button>

      {saved && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Saved as &ldquo;{saved.title}&rdquo;.{" "}
          <Link href="/documents" className="underline">
            View your documents
          </Link>
          .
        </p>
      )}

      {error && <p className="text-sm text-red-700 dark:text-red-400">{error}</p>}

      {showAuthPrompt && status === "anonymous" && (
        <div className="max-w-sm rounded-md border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
            Sign in to save this document to your account.
          </p>
          {authMode === "signin" ? (
            <AuthForm
              mode="signin"
              onSuccess={performSave}
              footer={
                <button type="button" className="underline" onClick={() => setAuthMode("signup")}>
                  Need an account? Sign up
                </button>
              }
            />
          ) : (
            <AuthForm
              mode="signup"
              onSuccess={performSave}
              footer={
                <button type="button" className="underline" onClick={() => setAuthMode("signin")}>
                  Already have an account? Sign in
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
