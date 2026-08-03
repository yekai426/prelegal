import { describe, expect, it } from "vitest";
import { documentRegistry } from "@/lib/documentRegistry";
import { defaultGenericFields, formatFieldValue, mergeGenericFields } from "@/lib/genericFields";

const csaMeta = documentRegistry.csa;

describe("defaultGenericFields", () => {
  it("seeds text fields as empty strings, durations as 1 year, and parties as blank", () => {
    const fields = defaultGenericFields(csaMeta);
    expect(fields.governingLaw).toBe("");
    expect(fields.subscriptionPeriod).toEqual({ duration: 1, unit: "year" });
    expect(fields.partyOne).toEqual({ printName: "", title: "", company: "", noticeAddress: "" });
  });
});

describe("mergeGenericFields", () => {
  it("uses server values when present and well-shaped", () => {
    const previous = defaultGenericFields(csaMeta);
    const merged = mergeGenericFields(previous, { governingLaw: "Delaware" }, csaMeta);
    expect(merged.governingLaw).toBe("Delaware");
  });

  it("falls back to the previous value for a missing key", () => {
    const previous = { ...defaultGenericFields(csaMeta), governingLaw: "Delaware" };
    const merged = mergeGenericFields(previous, {}, csaMeta);
    expect(merged.governingLaw).toBe("Delaware");
  });

  it("clamps an invalid duration from the server", () => {
    const previous = defaultGenericFields(csaMeta);
    const merged = mergeGenericFields(previous, { subscriptionPeriod: { duration: -3, unit: "month" } }, csaMeta);
    expect(merged.subscriptionPeriod).toEqual({ duration: 1, unit: "month" });
  });

  it("falls back to previous party fields when the server sends garbage", () => {
    const previous = { ...defaultGenericFields(csaMeta), partyOne: { printName: "Alice", title: "", company: "", noticeAddress: "" } };
    const merged = mergeGenericFields(previous, { partyOne: "not-an-object" }, csaMeta);
    expect((merged.partyOne as { printName: string }).printName).toBe("Alice");
  });

  it("only produces keys declared in the document type's field descriptors", () => {
    const previous = defaultGenericFields(csaMeta);
    const merged = mergeGenericFields(previous, { unexpectedKey: "garbage" }, csaMeta);
    expect(Object.keys(merged).sort()).toEqual(csaMeta.fields.map((f) => f.key).sort());
  });

  it("handles null/undefined raw input gracefully", () => {
    const previous = defaultGenericFields(csaMeta);
    expect(mergeGenericFields(previous, null, csaMeta)).toEqual(previous);
    expect(mergeGenericFields(previous, undefined, csaMeta)).toEqual(previous);
  });
});

describe("formatFieldValue", () => {
  it("shows a bracketed placeholder for an unset text field", () => {
    const fields = defaultGenericFields(csaMeta);
    const descriptor = csaMeta.fields.find((f) => f.key === "governingLaw")!;
    expect(formatFieldValue(descriptor, fields)).toBe("[Governing Law not yet specified]");
  });

  it("formats a set date field as a long-form date", () => {
    const fields = { ...defaultGenericFields(csaMeta), effectiveDate: "2026-01-15" };
    const descriptor = csaMeta.fields.find((f) => f.key === "effectiveDate")!;
    expect(formatFieldValue(descriptor, fields)).toBe("January 15, 2026");
  });

  it("formats a duration field even when never explicitly set", () => {
    const fields = defaultGenericFields(csaMeta);
    const descriptor = csaMeta.fields.find((f) => f.key === "subscriptionPeriod")!;
    expect(formatFieldValue(descriptor, fields)).toBe("1 year");
  });

  it("does not treat markdown-like raw text specially — returns it verbatim", () => {
    const raw = "Evaluating a **strategic** deal for [our teams](https://example.com)";
    const fields = { ...defaultGenericFields(csaMeta), technicalSupport: raw };
    const descriptor = csaMeta.fields.find((f) => f.key === "technicalSupport")!;
    expect(formatFieldValue(descriptor, fields)).toBe(raw);
  });
});
