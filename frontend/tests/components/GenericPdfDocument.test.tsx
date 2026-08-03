import { renderToBuffer } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";
import { GenericPdfDocument } from "@/components/pdf/GenericPdfDocument";
import { documentRegistry } from "@/lib/documentRegistry";
import { DRAFT_DISCLAIMER } from "@/lib/disclaimer";
import { defaultGenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";

const STANDARD_TERMS: ParsedStandardTerms = {
  title: "Standard Terms",
  sections: [{ number: "1", body: "This references the Purpose defined above." }],
  attribution: "",
};

const csaMeta = documentRegistry.csa;

describe("GenericPdfDocument", () => {
  it("includes the draft disclaimer in the generated PDF", async () => {
    const buffer = await renderToBuffer(
      <GenericPdfDocument
        documentTypeLabel="Cloud Service Agreement (CSA)"
        fields={defaultGenericFields(csaMeta)}
        meta={csaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    const parser = new PDFParse({ data: buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    // Normalize whitespace: the PDF renderer may wrap the disclaimer across
    // a line break, turning an inter-word space into a newline in the
    // extracted text.
    expect(text.replace(/\s+/g, " ")).toContain(DRAFT_DISCLAIMER);
  });
});
