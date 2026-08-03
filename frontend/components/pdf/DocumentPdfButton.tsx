"use client";

import dynamic from "next/dynamic";
import { documentRegistry } from "@/lib/documentRegistry";
import type { DocumentFields } from "@/lib/documentState";
import type { GenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import type { MndaFormData } from "@/lib/types";

const LOADING_LABEL = <span className="text-sm text-zinc-500 dark:text-zinc-400">Loading PDF engine…</span>;

const PdfDownloadButton = dynamic(() => import("./PdfDownloadButton").then((mod) => mod.PdfDownloadButton), {
  ssr: false,
  loading: () => LOADING_LABEL,
});

const GenericPdfDownloadButton = dynamic(
  () => import("./GenericPdfDownloadButton").then((mod) => mod.GenericPdfDownloadButton),
  { ssr: false, loading: () => LOADING_LABEL },
);

export function DocumentPdfButton({
  documentType,
  fields,
  standardTermsByType,
  documentTypeLabels,
}: {
  documentType: string;
  fields: DocumentFields;
  standardTermsByType: Record<string, ParsedStandardTerms>;
  documentTypeLabels: Record<string, string>;
}) {
  if (documentType === "mutual_nda") {
    return <PdfDownloadButton formData={fields as MndaFormData} standardTerms={standardTermsByType.mutual_nda} />;
  }
  return (
    <GenericPdfDownloadButton
      documentTypeLabel={documentTypeLabels[documentType] ?? documentType}
      fields={fields as GenericFields}
      meta={documentRegistry[documentType]}
      standardTerms={standardTermsByType[documentType]}
    />
  );
}
