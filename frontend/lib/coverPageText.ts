import { formatDuration, type MndaFormData } from "./types";

export function formatEffectiveDate(effectiveDate: string): string {
  if (!effectiveDate) return "[Effective Date not yet specified]";
  const date = new Date(`${effectiveDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return effectiveDate;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function mndaTermText(formData: MndaFormData): string {
  if (formData.mndaTermChoice === "continues") {
    return "This MNDA continues until terminated in accordance with the terms of the MNDA.";
  }
  return `This MNDA expires ${formatDuration(formData.mndaTermDuration)} from the Effective Date.`;
}

export function confidentialityTermText(formData: MndaFormData): string {
  if (formData.confidentialityTermChoice === "perpetuity") {
    return "The Receiving Party's confidentiality obligations continue in perpetuity.";
  }
  return `The Receiving Party's confidentiality obligations continue for ${formatDuration(
    formData.confidentialityTermDuration,
  )} from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable laws.`;
}

export function governingLawText(formData: MndaFormData): string {
  const law = formData.governingLaw.trim() || "[Governing Law not yet specified]";
  return `Governing Law: ${law}`;
}

export function jurisdictionText(formData: MndaFormData): string {
  const jurisdiction =
    formData.jurisdiction.trim() || "[Jurisdiction not yet specified]";
  return `Jurisdiction: ${jurisdiction}`;
}

export function governingLawAndJurisdictionText(formData: MndaFormData): string {
  return `${governingLawText(formData)}; ${jurisdictionText(formData)}.`;
}

export function purposeText(formData: MndaFormData): string {
  return formData.purpose.trim() || "[Purpose not yet specified]";
}

export function modificationsText(formData: MndaFormData): string {
  return formData.modifications.trim() || "None.";
}
