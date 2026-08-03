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
      className="inline-flex items-center justify-center rounded-full bg-brand-purple px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-purple/90"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
