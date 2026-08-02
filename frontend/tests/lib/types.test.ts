import { describe, expect, it } from "vitest";
import {
  clampDuration,
  defaultFormData,
  emptyParty,
  formatDuration,
} from "@/lib/types";

describe("clampDuration", () => {
  it("passes through a valid positive integer", () => {
    expect(clampDuration(5)).toBe(5);
  });

  it("floors a fractional value", () => {
    expect(clampDuration(2.9)).toBe(2);
  });

  it("clamps negative values to 1", () => {
    expect(clampDuration(-5)).toBe(1);
  });

  it("clamps zero to 1", () => {
    expect(clampDuration(0)).toBe(1);
  });

  it("clamps NaN to 1", () => {
    expect(clampDuration(NaN)).toBe(1);
  });

  it("clamps Infinity to 1", () => {
    expect(clampDuration(Infinity)).toBe(1);
  });
});

describe("formatDuration", () => {
  it("uses singular unit for a duration of 1", () => {
    expect(formatDuration({ duration: 1, unit: "year" })).toBe("1 year");
  });

  it("uses plural unit for a duration greater than 1", () => {
    expect(formatDuration({ duration: 3, unit: "month" })).toBe("3 months");
  });

  it("clamps an invalid duration before formatting", () => {
    expect(formatDuration({ duration: -5, unit: "year" })).toBe("1 year");
  });
});

describe("emptyParty", () => {
  it("returns all-blank fields", () => {
    expect(emptyParty()).toEqual({
      printName: "",
      title: "",
      company: "",
      noticeAddress: "",
    });
  });
});

describe("defaultFormData", () => {
  it("defaults MNDA Term to expiring in 1 year", () => {
    const data = defaultFormData();
    expect(data.mndaTermChoice).toBe("expires");
    expect(data.mndaTermDuration).toEqual({ duration: 1, unit: "year" });
  });

  it("defaults Confidentiality Term to 1 year with a duration choice", () => {
    const data = defaultFormData();
    expect(data.confidentialityTermChoice).toBe("duration");
    expect(data.confidentialityTermDuration).toEqual({
      duration: 1,
      unit: "year",
    });
  });

  it("returns fresh, independent party objects on each call", () => {
    const first = defaultFormData();
    const second = defaultFormData();
    first.partyOne.printName = "Jane";
    expect(second.partyOne.printName).toBe("");
  });
});
