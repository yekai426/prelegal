import { clampDuration, type MndaFormData } from "./types";

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

export async function fetchGreeting(documentType = "mutual_nda"): Promise<string> {
  const res = await fetch(`/api/chat/greeting?document_type=${documentType}`);
  if (!res.ok) throw new ChatApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.reply;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  fields: MndaFormData,
  documentType = "mutual_nda",
): Promise<{ reply: string; fields: MndaFormData }> {
  const res = await fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_type: documentType, messages, fields }),
  });
  if (!res.ok) throw new ChatApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return { reply: body.reply, fields: mergeFields(fields, body.fields) };
}

type DurationTerm = MndaFormData["mndaTermDuration"];
type PartyInfo = MndaFormData["partyOne"];

function safeDuration(raw: unknown, fallback: DurationTerm): DurationTerm {
  const candidate = raw as { duration?: unknown; unit?: unknown } | undefined;
  const unit =
    candidate?.unit === "day" || candidate?.unit === "month" || candidate?.unit === "year"
      ? candidate.unit
      : fallback.unit;
  const duration =
    typeof candidate?.duration === "number" ? clampDuration(candidate.duration) : fallback.duration;
  return { duration, unit };
}

function safeParty(raw: unknown, fallback: PartyInfo): PartyInfo {
  const candidate = raw as Record<string, unknown> | undefined;
  return {
    printName: typeof candidate?.printName === "string" ? candidate.printName : fallback.printName,
    title: typeof candidate?.title === "string" ? candidate.title : fallback.title,
    company: typeof candidate?.company === "string" ? candidate.company : fallback.company,
    noticeAddress:
      typeof candidate?.noticeAddress === "string" ? candidate.noticeAddress : fallback.noticeAddress,
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
