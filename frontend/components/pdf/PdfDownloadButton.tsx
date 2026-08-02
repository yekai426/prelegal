"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import type { MndaFormData } from "@/lib/types";
import { MndaPdfDocument } from "./MndaPdfDocument";

export function PdfDownloadButton({
  formData,
  standardTerms,
}: {
  formData: MndaFormData;
  standardTerms: ParsedStandardTerms;
}) {
  return (
    <PDFDownloadLink
      document={
        <MndaPdfDocument formData={formData} standardTerms={standardTerms} />
      }
      fileName="mutual-nda.pdf"
      className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
