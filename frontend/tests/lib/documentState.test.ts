import { describe, expect, it } from "vitest";
import { defaultFieldsForType, mergeFieldsForType } from "@/lib/documentState";
import { defaultFormData } from "@/lib/types";

describe("defaultFieldsForType", () => {
  it("returns MndaFormData defaults for mutual_nda", () => {
    expect(defaultFieldsForType("mutual_nda")).toEqual(defaultFormData());
  });

  it("returns generic field defaults for a non-mnda type", () => {
    const fields = defaultFieldsForType("csa") as Record<string, unknown>;
    expect(fields.governingLaw).toBe("");
    expect(fields.partyOne).toBeDefined();
  });
});

describe("mergeFieldsForType", () => {
  it("uses the strict per-field MNDA merge for mutual_nda", () => {
    const previous = defaultFormData();
    const merged = mergeFieldsForType("mutual_nda", previous, { purpose: "New purpose" }) as ReturnType<
      typeof defaultFormData
    >;
    expect(merged.purpose).toBe("New purpose");
  });

  it("uses the generic registry-driven merge for other types", () => {
    const previous = defaultFieldsForType("csa");
    const merged = mergeFieldsForType("csa", previous, { governingLaw: "Delaware" }) as Record<string, unknown>;
    expect(merged.governingLaw).toBe("Delaware");
  });
});
