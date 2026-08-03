"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  DocumentsApiError,
  fetchDocument,
  listDocuments,
  type DocumentDetail,
  type DocumentSummary,
} from "@/lib/documents";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { AuthForm } from "./auth/AuthForm";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentPdfButton } from "./pdf/DocumentPdfButton";

export function DocumentHistory({
  standardTermsByType,
  documentTypeLabels,
}: {
  standardTermsByType: Record<string, ParsedStandardTerms>;
  documentTypeLabels: Record<string, string>;
}) {
  const { status } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [selected, setSelected] = useState<DocumentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against an older, slower fetch resolving after a newer click and
  // overwriting the selection the user actually clicked most recently.
  const latestRequestedIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listDocuments()
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof DocumentsApiError ? err.message : "Failed to load your documents.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  async function handleSelect(id: number) {
    setError(null);
    setIsLoadingDetail(true);
    latestRequestedIdRef.current = id;
    try {
      const detail = await fetchDocument(id);
      if (latestRequestedIdRef.current === id) setSelected(detail);
    } catch (err) {
      if (latestRequestedIdRef.current === id) {
        setError(err instanceof DocumentsApiError ? err.message : "Failed to load this document.");
      }
    } finally {
      if (latestRequestedIdRef.current === id) setIsLoadingDetail(false);
    }
  }

  if (status === "loading") {
    return <p className="px-6 py-10 text-sm text-muted">Loading…</p>;
  }

  if (status === "anonymous") {
    return (
      <div className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
        <h1 className="mb-4 text-center text-2xl font-bold text-navy dark:text-white">My Documents</h1>
        <p className="mb-4 text-center text-sm text-muted">Sign in to see documents you&apos;ve saved.</p>
        <AuthForm mode="signin" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
      <div>
        <h1 className="mb-4 text-2xl font-bold text-navy dark:text-white">My Documents</h1>
        {error && <p className="mb-4 text-sm text-red-700 dark:text-red-400">{error}</p>}
        {documents === null && <p className="text-sm text-muted">Loading your documents…</p>}
        {documents?.length === 0 && (
          <p className="text-sm text-muted">You haven&apos;t saved any documents yet.</p>
        )}
        <ul className="space-y-2">
          {documents?.map((doc) => (
            <li key={doc.id}>
              <button
                type="button"
                onClick={() => handleSelect(doc.id)}
                className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  selected?.id === doc.id
                    ? "border-brand-blue bg-brand-blue/10"
                    : "border-zinc-200 hover:border-brand-blue dark:border-zinc-800"
                }`}
              >
                <p className="font-medium text-navy dark:text-white">{doc.title}</p>
                <p className="text-xs text-muted">
                  {doc.documentTypeLabel} · {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 lg:sticky lg:top-10 lg:self-start">
        {isLoadingDetail && <p className="text-sm text-muted">Loading document…</p>}
        {!isLoadingDetail && selected === null && (
          <p className="text-sm text-muted">Select a document to preview it here.</p>
        )}
        {selected && (
          <>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-navy dark:text-white">Preview</h2>
              <DocumentPdfButton
                documentType={selected.documentType}
                fields={selected.fields}
                standardTermsByType={standardTermsByType}
                documentTypeLabels={documentTypeLabels}
              />
            </div>
            <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <DocumentPreview
                documentType={selected.documentType}
                fields={selected.fields}
                standardTermsByType={standardTermsByType}
                documentTypeLabels={documentTypeLabels}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
