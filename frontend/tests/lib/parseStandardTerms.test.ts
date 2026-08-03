import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

const FIXTURE = `# Standard Terms

1. **Introduction**. This uses the <span class="coverpage_link">Purpose</span> defined on the Cover Page.

2. **Term**. This runs for the <span class="coverpage_link">MNDA Term</span>.

Common Paper Mutual Non-Disclosure Agreement [Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
`;

describe("parseStandardTerms (fixture)", () => {
  it("extracts the title from the leading H1", () => {
    expect(parseStandardTerms(FIXTURE).title).toBe("Standard Terms");
  });

  it("splits top-level numbered clauses into sections", () => {
    const { sections } = parseStandardTerms(FIXTURE);
    expect(sections).toHaveLength(2);
    expect(sections[0].number).toBe("1");
    expect(sections[1].number).toBe("2");
  });

  it("folds coverpage_link spans into bold markdown references", () => {
    const { sections } = parseStandardTerms(FIXTURE);
    expect(sections[0].body).toContain("**Purpose**");
    expect(sections[0].body).not.toContain("<span");
  });

  it("extracts the trailing attribution line separately from the sections", () => {
    const { attribution, sections } = parseStandardTerms(FIXTURE);
    expect(attribution).toContain("Common Paper Mutual Non-Disclosure Agreement");
    expect(sections.some((s) => s.body.includes("Common Paper"))).toBe(false);
  });

  it("returns an empty section list for a document with no numbered clauses", () => {
    const { sections } = parseStandardTerms("# Title\n\nJust a line.\n");
    expect(sections).toHaveLength(0);
  });
});

describe("parseStandardTerms (real templates/Mutual-NDA.md)", () => {
  // Guards against silent parser breakage if the canonical template's
  // structure ever changes (it's the actual source rendered in the app).
  const raw = fs.readFileSync(
    path.join(process.cwd(), "..", "templates", "Mutual-NDA.md"),
    "utf-8",
  );
  const parsed = parseStandardTerms(raw);

  it("parses all 11 top-level clauses", () => {
    expect(parsed.sections).toHaveLength(11);
    expect(parsed.sections.map((s) => s.number)).toEqual(
      Array.from({ length: 11 }, (_, i) => String(i + 1)),
    );
  });

  it("strips all coverpage_link spans from section bodies", () => {
    for (const section of parsed.sections) {
      expect(section.body).not.toContain("<span");
    }
  });

  it("extracts the CC BY attribution line with its links intact", () => {
    expect(parsed.attribution).toContain("[CC BY 4.0]");
    expect(parsed.attribution).toContain("[Version 1.0]");
  });
});

describe("parseStandardTerms (real templates/CSA.md — nested numbering)", () => {
  // CSA.md uses hierarchical numbering (nested header_3 sub-clauses inside
  // each top-level header_2 section) — regression guard for a bug where
  // trimming indentation before matching caused nested items to be
  // misparsed as false top-level sections.
  const raw = fs.readFileSync(path.join(process.cwd(), "..", "templates", "CSA.md"), "utf-8");
  const parsed = parseStandardTerms(raw);

  it("parses exactly the 13 real top-level sections, not the nested sub-clauses", () => {
    expect(parsed.sections).toHaveLength(13);
    expect(parsed.sections.map((s) => s.number)).toEqual(
      Array.from({ length: 13 }, (_, i) => String(i + 1)),
    );
  });

  it("folds nested sub-clauses into their parent section's body", () => {
    const service = parsed.sections[0];
    expect(service.body).toContain("Access and Use");
    expect(service.body).toContain("Support");
    expect(service.body).toContain("Machine Learning");
  });

  it("has no template with a CC-BY footer, so nothing is swallowed as attribution", () => {
    expect(parsed.attribution).toBe("");
  });

  it("does not lose the last Definitions entry to a false attribution match", () => {
    const definitions = parsed.sections[parsed.sections.length - 1];
    expect(definitions.body).toContain("Variable");
  });

  it("strips all span tags, including the malformed doubled closing tag", () => {
    for (const section of parsed.sections) {
      expect(section.body).not.toContain("<span");
      expect(section.body).not.toContain("</span");
    }
  });
});

describe("parseStandardTerms (real templates/DPA.md — no cover-page-style parties)", () => {
  const raw = fs.readFileSync(path.join(process.cwd(), "..", "templates", "DPA.md"), "utf-8");
  const parsed = parseStandardTerms(raw);

  it("parses exactly the 11 real top-level sections", () => {
    expect(parsed.sections).toHaveLength(11);
  });

  it("has no CC-BY footer, so nothing is swallowed as attribution", () => {
    expect(parsed.attribution).toBe("");
  });

  it("strips all keyterms_link spans into bold text with no leaked HTML", () => {
    for (const section of parsed.sections) {
      expect(section.body).not.toContain("<span");
    }
    expect(parsed.sections[1].body).toContain("**Customer**");
  });
});
