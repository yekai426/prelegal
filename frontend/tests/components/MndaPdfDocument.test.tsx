import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";
import { MndaPdfDocument } from "@/components/pdf/MndaPdfDocument";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { defaultFormData } from "@/lib/types";

const STANDARD_TERMS: ParsedStandardTerms = {
  title: "Standard Terms",
  sections: [{ number: "1", body: "This references the Purpose defined above." }],
  attribution:
    "Common Paper Mutual Non-Disclosure Agreement [Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).",
};

// Component-level regression test for a prior bug (PR #4) where the PDF
// renderer parsed user-typed free text as markdown when the on-screen
// preview did not. Ported from the retired e2e/pdf-content.spec.ts so the
// guarantee holds regardless of how text enters formData.purpose (form,
// AI chat, or anything else) rather than depending on a specific UI input.
describe("MndaPdfDocument", () => {
  it("does not parse markdown-like syntax typed into Purpose", async () => {
    const raw = "Evaluating a **strategic** deal for [our teams](https://example.com)";
    const formData = { ...defaultFormData(), purpose: raw };

    const buffer = await renderToBuffer(
      <MndaPdfDocument formData={formData} standardTerms={STANDARD_TERMS} />,
    );
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    // The raw markdown-like syntax (including ** and [](...)) must survive
    // verbatim. If it had been run through the markdown parser instead, the
    // extracted text would read "strategic" and "our teams" with the
    // markdown syntax stripped out.
    expect(text).toContain(raw);
  });

  it("still renders Standard Terms markdown (bold, links) via the trusted RichText path", async () => {
    const buffer = await renderToBuffer(
      <MndaPdfDocument formData={defaultFormData()} standardTerms={STANDARD_TERMS} />,
    );
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    // Static template markdown is trusted and IS parsed — the raw "**"/link
    // syntax should NOT survive for this text, unlike user-supplied fields.
    expect(text).not.toContain("[CC BY 4.0]");
    expect(text).toContain("CC BY 4.0");
  });
});
