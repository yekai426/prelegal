"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import type { DocumentTypeMeta } from "@/lib/documentRegistry";
import type { GenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { GenericPdfDocument } from "./GenericPdfDocument";

export function GenericPdfDownloadButton({
  documentTypeLabel,
  fields,
  meta,
  standardTerms,
}: {
  documentTypeLabel: string;
  fields: GenericFields;
  meta: DocumentTypeMeta;
  standardTerms: ParsedStandardTerms;
}) {
  return (
    <PDFDownloadLink
      document={
        <GenericPdfDocument
          documentTypeLabel={documentTypeLabel}
          fields={fields}
          meta={meta}
          standardTerms={standardTerms}
        />
      }
      fileName={meta.pdfFileName}
      className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
