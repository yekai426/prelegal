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
