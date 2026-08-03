export type DurationUnit = "day" | "month" | "year";

export interface DurationTerm {
  duration: number;
  unit: DurationUnit;
}

export type MndaTermChoice = "expires" | "continues";
export type ConfidentialityTermChoice = "duration" | "perpetuity";

export interface PartyInfo {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
}

export interface MndaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermChoice: MndaTermChoice;
  mndaTermDuration: DurationTerm;
  confidentialityTermChoice: ConfidentialityTermChoice;
  confidentialityTermDuration: DurationTerm;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  partyOne: PartyInfo;
  partyTwo: PartyInfo;
}

export function clampDuration(duration: number): number {
  return Number.isFinite(duration) && duration >= 1 ? Math.floor(duration) : 1;
}

export function formatDuration({ duration, unit }: DurationTerm): string {
  const safeDuration = clampDuration(duration);
  return `${safeDuration} ${unit}${safeDuration === 1 ? "" : "s"}`;
}

export function emptyParty(): PartyInfo {
  return { printName: "", title: "", company: "", noticeAddress: "" };
}

export function safeDuration(raw: unknown, fallback: DurationTerm): DurationTerm {
  const candidate = raw as { duration?: unknown; unit?: unknown } | undefined;
  const unit =
    candidate?.unit === "day" || candidate?.unit === "month" || candidate?.unit === "year"
      ? candidate.unit
      : fallback.unit;
  const duration =
    typeof candidate?.duration === "number" ? clampDuration(candidate.duration) : fallback.duration;
  return { duration, unit };
}

export function safeParty(raw: unknown, fallback: PartyInfo): PartyInfo {
  const candidate = raw as Record<string, unknown> | undefined;
  return {
    printName: typeof candidate?.printName === "string" ? candidate.printName : fallback.printName,
    title: typeof candidate?.title === "string" ? candidate.title : fallback.title,
    company: typeof candidate?.company === "string" ? candidate.company : fallback.company,
    noticeAddress:
      typeof candidate?.noticeAddress === "string" ? candidate.noticeAddress : fallback.noticeAddress,
  };
}

// Mirrors the bracketed placeholder examples in templates/Mutual-NDA-coverpage.md.
export function defaultFormData(): MndaFormData {
  return {
    purpose:
      "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: "",
    mndaTermChoice: "expires",
    mndaTermDuration: { duration: 1, unit: "year" },
    confidentialityTermChoice: "duration",
    confidentialityTermDuration: { duration: 1, unit: "year" },
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    partyOne: emptyParty(),
    partyTwo: emptyParty(),
  };
}
