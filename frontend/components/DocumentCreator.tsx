"use client";

import { useState } from "react";
import type { ChatTurnResponse } from "@/lib/chat";
import { defaultFieldsForType, mergeFieldsForType, type DocumentFields } from "@/lib/documentState";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { ChatPanel } from "./ChatPanel";
import { DocumentPreview } from "./DocumentPreview";
import { DocumentPdfButton } from "./pdf/DocumentPdfButton";
import { SaveDocumentButton } from "./SaveDocumentButton";

export function DocumentCreator({
  standardTermsByType,
  documentTypeLabels,
}: {
  standardTermsByType: Record<string, ParsedStandardTerms>;
  documentTypeLabels: Record<string, string>;
}) {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [fields, setFields] = useState<DocumentFields>({});

  function handleTurnResult(result: ChatTurnResponse) {
    if (result.documentType === null) {
      // Unsupported request — leave whatever's currently in progress alone.
      return;
    }
    if (result.documentType !== documentType) {
      // First classification, or a mid-conversation flip to a different type.
      setDocumentType(result.documentType);
      setFields(mergeFieldsForType(result.documentType, defaultFieldsForType(result.documentType), result.fields));
      return;
    }
    setFields(mergeFieldsForType(documentType, fields, result.fields));
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
      <div className="flex h-[85vh] flex-col lg:sticky lg:top-10">
        <ChatPanel documentType={documentType} fields={fields} onTurnResult={handleTurnResult} />
      </div>

      <div className="space-y-4 lg:sticky lg:top-10 lg:self-start">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-navy dark:text-white">Preview</h2>
          {documentType && (
            <DocumentPdfButton
              documentType={documentType}
              fields={fields}
              standardTermsByType={standardTermsByType}
              documentTypeLabels={documentTypeLabels}
            />
          )}
        </div>
        <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          {documentType === null && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Once we know what document you need, a preview will appear here.
            </p>
          )}
          {documentType && (
            <DocumentPreview
              documentType={documentType}
              fields={fields}
              standardTermsByType={standardTermsByType}
              documentTypeLabels={documentTypeLabels}
            />
          )}
        </div>
        {documentType && <SaveDocumentButton documentType={documentType} fields={fields} />}
      </div>
    </div>
  );
}
