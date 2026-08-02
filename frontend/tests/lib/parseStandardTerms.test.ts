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
