"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { defaultFormData } from "@/lib/types";
import { MndaForm } from "./MndaForm";
import { MndaPreview } from "./MndaPreview";

const PdfDownloadButton = dynamic(
  () =>
    import("@/components/pdf/PdfDownloadButton").then(
      (mod) => mod.PdfDownloadButton,
    ),
  {
    ssr: false,
    loading: () => (
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading PDF engine…
      </span>
    ),
  },
);

export function MndaCreator({
  standardTerms,
}: {
  standardTerms: ParsedStandardTerms;
}) {
  const [formData, setFormData] = useState(defaultFormData);

  return (
    <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">
            Mutual NDA Creator
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Fill in the details below. The document on the right updates live
            and can be downloaded as a PDF.
          </p>
        </div>
        <MndaForm value={formData} onChange={setFormData} />
      </div>

      <div className="space-y-4 lg:sticky lg:top-10 lg:self-start">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
            Preview
          </h2>
          <PdfDownloadButton formData={formData} standardTerms={standardTerms} />
        </div>
        <div className="max-h-[80vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <MndaPreview formData={formData} standardTerms={standardTerms} />
        </div>
      </div>
    </div>
  );
}
