import { mergeFields } from "./chat";
import { documentRegistry } from "./documentRegistry";
import { defaultGenericFields, mergeGenericFields, type GenericFields } from "./genericFields";
import { defaultFormData, type MndaFormData } from "./types";

export type DocumentFields = MndaFormData | GenericFields;

export function defaultFieldsForType(documentType: string): DocumentFields {
  if (documentType === "mutual_nda") return defaultFormData();
  return defaultGenericFields(documentRegistry[documentType]);
}

export function mergeFieldsForType(documentType: string, previous: DocumentFields, raw: unknown): DocumentFields {
  if (documentType === "mutual_nda") return mergeFields(previous as MndaFormData, raw);
  return mergeGenericFields(previous as GenericFields, raw, documentRegistry[documentType]);
}
