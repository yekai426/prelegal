import { safeDuration, safeParty, type MndaFormData } from "./types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export class ChatApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : res.statusText;
  } catch {
    return res.statusText;
  }
}

export interface GreetingResponse {
  reply: string;
  documentType: string | null;
}

export interface ChatTurnResponse {
  reply: string;
  fields: unknown;
  documentType: string | null;
  documentTypeLabel: string | null;
  suggestedDocumentType: string | null;
  suggestedDocumentTypeLabel: string | null;
}

/**
 * documentType is null until the assistant has determined (or the caller
 * already knows) which catalog document type is being drafted.
 */
export async function fetchGreeting(documentType: string | null = null): Promise<GreetingResponse> {
  const query = documentType ? `?document_type=${encodeURIComponent(documentType)}` : "";
  const res = await fetch(`/api/chat/greeting${query}`);
  if (!res.ok) throw new ChatApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return { reply: body.reply, documentType: body.document_type ?? null };
}

/**
 * Returns the RAW server response — merging the returned fields onto
 * previous state is the caller's job, since the correct merge strategy
 * (mergeFields for Mutual NDA, mergeGenericFields for everything else)
 * depends on which document type the response settles on.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  fields: unknown,
  documentType: string | null,
): Promise<ChatTurnResponse> {
  const res = await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_type: documentType, messages, fields }),
  });
  if (!res.ok) throw new ChatApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return {
    reply: body.reply,
    fields: body.fields,
    documentType: body.document_type ?? null,
    documentTypeLabel: body.document_type_label ?? null,
    suggestedDocumentType: body.suggested_document_type ?? null,
    suggestedDocumentTypeLabel: body.suggested_document_type_label ?? null,
  };
}

/**
 * Defensively merges a server-provided (LLM-derived) fields object onto the
 * previous known state: any field with an unexpected shape falls back to its
 * previous value instead of corrupting the whole form.
 */
export function mergeFields(previous: MndaFormData, raw: unknown): MndaFormData {
  const r = (raw ?? {}) as Partial<MndaFormData>;
  return {
    purpose: typeof r.purpose === "string" ? r.purpose : previous.purpose,
    effectiveDate: typeof r.effectiveDate === "string" ? r.effectiveDate : previous.effectiveDate,
    mndaTermChoice:
      r.mndaTermChoice === "expires" || r.mndaTermChoice === "continues"
        ? r.mndaTermChoice
        : previous.mndaTermChoice,
    mndaTermDuration: safeDuration(r.mndaTermDuration, previous.mndaTermDuration),
    confidentialityTermChoice:
      r.confidentialityTermChoice === "duration" || r.confidentialityTermChoice === "perpetuity"
        ? r.confidentialityTermChoice
        : previous.confidentialityTermChoice,
    confidentialityTermDuration: safeDuration(
      r.confidentialityTermDuration,
      previous.confidentialityTermDuration,
    ),
    governingLaw: typeof r.governingLaw === "string" ? r.governingLaw : previous.governingLaw,
    jurisdiction: typeof r.jurisdiction === "string" ? r.jurisdiction : previous.jurisdiction,
    modifications: typeof r.modifications === "string" ? r.modifications : previous.modifications,
    partyOne: safeParty(r.partyOne, previous.partyOne),
    partyTwo: safeParty(r.partyTwo, previous.partyTwo),
  };
}
