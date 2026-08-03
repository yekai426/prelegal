import { documentRegistry } from "@/lib/documentRegistry";
import type { DocumentFields } from "@/lib/documentState";
import type { GenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import type { MndaFormData } from "@/lib/types";
import { GenericPreview } from "./GenericPreview";
import { MndaPreview } from "./MndaPreview";

export function DocumentPreview({
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
    return <MndaPreview formData={fields as MndaFormData} standardTerms={standardTermsByType.mutual_nda} />;
  }
  return (
    <GenericPreview
      documentTypeLabel={documentTypeLabels[documentType] ?? documentType}
      fields={fields as GenericFields}
      meta={documentRegistry[documentType]}
      standardTerms={standardTermsByType[documentType]}
    />
  );
}
