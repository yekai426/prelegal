import { emptyParty, formatDuration, safeDuration, safeParty, type DurationTerm, type PartyInfo } from "./types";
import type { DocumentTypeMeta, FieldDescriptor } from "./documentRegistry";

export type GenericFields = Record<string, unknown>;

const DEFAULT_DURATION: DurationTerm = { duration: 1, unit: "year" };

export function defaultGenericFields(meta: DocumentTypeMeta): GenericFields {
  const fields: GenericFields = {};
  for (const descriptor of meta.fields) {
    if (descriptor.kind === "duration") fields[descriptor.key] = { ...DEFAULT_DURATION };
    else if (descriptor.kind === "party") fields[descriptor.key] = emptyParty();
    else fields[descriptor.key] = "";
  }
  return fields;
}

/**
 * Defensively merges a server-provided (LLM-derived) fields object onto the
 * previous known state, driven by the document type's field descriptors: any
 * field with an unexpected shape falls back to its previous value instead of
 * corrupting the whole form.
 */
export function mergeGenericFields(
  previous: GenericFields,
  raw: unknown,
  meta: DocumentTypeMeta,
): GenericFields {
  const r = (raw ?? {}) as Record<string, unknown>;
  const merged: GenericFields = {};
  for (const descriptor of meta.fields) {
    const rawValue = r[descriptor.key];
    if (descriptor.kind === "duration") {
      const fallback = (previous[descriptor.key] as DurationTerm) ?? DEFAULT_DURATION;
      merged[descriptor.key] = safeDuration(rawValue, fallback);
    } else if (descriptor.kind === "party") {
      const fallback = (previous[descriptor.key] as PartyInfo) ?? emptyParty();
      merged[descriptor.key] = safeParty(rawValue, fallback);
    } else {
      const fallback = typeof previous[descriptor.key] === "string" ? (previous[descriptor.key] as string) : "";
      merged[descriptor.key] = typeof rawValue === "string" ? rawValue : fallback;
    }
  }
  return merged;
}

export function formatGenericDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Plain-text display value for a single field — never markdown-parsed. */
export function formatFieldValue(descriptor: FieldDescriptor, fields: GenericFields): string {
  const raw = fields[descriptor.key];
  if (descriptor.kind === "date") {
    const formatted = formatGenericDate(typeof raw === "string" ? raw : "");
    return formatted || `[${descriptor.label} not yet specified]`;
  }
  if (descriptor.kind === "duration") {
    return formatDuration((raw as DurationTerm) ?? DEFAULT_DURATION);
  }
  const text = typeof raw === "string" ? raw.trim() : "";
  return text || `[${descriptor.label} not yet specified]`;
}
