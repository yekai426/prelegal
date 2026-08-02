import { describe, expect, it } from "vitest";
import {
  confidentialityTermText,
  formatEffectiveDate,
  governingLawAndJurisdictionText,
  governingLawText,
  jurisdictionText,
  mndaTermText,
  modificationsText,
  purposeText,
} from "@/lib/coverPageText";
import { defaultFormData, type MndaFormData } from "@/lib/types";

function formData(overrides: Partial<MndaFormData> = {}): MndaFormData {
  return { ...defaultFormData(), ...overrides };
}

describe("formatEffectiveDate", () => {
  it("returns a placeholder when empty", () => {
    expect(formatEffectiveDate("")).toBe("[Effective Date not yet specified]");
  });

  it("formats a valid ISO date as a readable date", () => {
    expect(formatEffectiveDate("2026-03-05")).toBe("March 5, 2026");
  });

  it("falls back to the raw string for an unparseable date", () => {
    expect(formatEffectiveDate("not-a-date")).toBe("not-a-date");
  });
});

describe("mndaTermText", () => {
  it("describes an expiring term with its duration", () => {
    const data = formData({
      mndaTermChoice: "expires",
      mndaTermDuration: { duration: 2, unit: "year" },
    });
    expect(mndaTermText(data)).toBe(
      "This MNDA expires 2 years from the Effective Date.",
    );
  });

  it("describes a continuing term without a duration", () => {
    const data = formData({ mndaTermChoice: "continues" });
    expect(mndaTermText(data)).toBe(
      "This MNDA continues until terminated in accordance with the terms of the MNDA.",
    );
  });

  it("clamps an invalid duration", () => {
    const data = formData({
      mndaTermChoice: "expires",
      mndaTermDuration: { duration: -5, unit: "year" },
    });
    expect(mndaTermText(data)).toBe(
      "This MNDA expires 1 year from the Effective Date.",
    );
  });
});

describe("confidentialityTermText", () => {
  it("describes a fixed duration with the trade-secret carveout", () => {
    const data = formData({
      confidentialityTermChoice: "duration",
      confidentialityTermDuration: { duration: 3, unit: "year" },
    });
    expect(confidentialityTermText(data)).toContain("3 years");
    expect(confidentialityTermText(data)).toContain("trade secret");
  });

  it("describes perpetuity without a duration", () => {
    const data = formData({ confidentialityTermChoice: "perpetuity" });
    expect(confidentialityTermText(data)).toBe(
      "The Receiving Party's confidentiality obligations continue in perpetuity.",
    );
  });
});

describe("governingLawText / jurisdictionText / governingLawAndJurisdictionText", () => {
  it("shows placeholders when unset", () => {
    const data = formData({ governingLaw: "", jurisdiction: "" });
    expect(governingLawText(data)).toBe(
      "Governing Law: [Governing Law not yet specified]",
    );
    expect(jurisdictionText(data)).toBe(
      "Jurisdiction: [Jurisdiction not yet specified]",
    );
  });

  it("joins both into a single sentence when set", () => {
    const data = formData({
      governingLaw: "Delaware",
      jurisdiction: "courts located in New Castle, DE",
    });
    expect(governingLawAndJurisdictionText(data)).toBe(
      "Governing Law: Delaware; Jurisdiction: courts located in New Castle, DE.",
    );
  });

  it("trims whitespace-only input as unset", () => {
    const data = formData({ governingLaw: "   " });
    expect(governingLawText(data)).toBe(
      "Governing Law: [Governing Law not yet specified]",
    );
  });
});

describe("purposeText / modificationsText", () => {
  it("falls back to a placeholder for an empty purpose", () => {
    expect(purposeText(formData({ purpose: "" }))).toBe(
      "[Purpose not yet specified]",
    );
  });

  it("returns the trimmed purpose when set", () => {
    expect(purposeText(formData({ purpose: "  Evaluate a deal.  " }))).toBe(
      "Evaluate a deal.",
    );
  });

  it("does not treat markdown-like syntax in the purpose specially", () => {
    const raw = "Evaluating a **strategic** deal for [our teams](https://example.com)";
    expect(purposeText(formData({ purpose: raw }))).toBe(raw);
  });

  it("defaults modifications to 'None.' when empty", () => {
    expect(modificationsText(formData({ modifications: "" }))).toBe("None.");
  });

  it("returns the trimmed modifications when set", () => {
    expect(
      modificationsText(formData({ modifications: "  Add a carveout.  " })),
    ).toBe("Add a carveout.");
  });
});
