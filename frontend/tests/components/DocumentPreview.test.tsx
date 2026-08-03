import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentPreview } from "@/components/DocumentPreview";
import { defaultFormData } from "@/lib/types";
import { defaultGenericFields } from "@/lib/genericFields";
import { documentRegistry } from "@/lib/documentRegistry";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

const EMPTY_TERMS = parseStandardTerms("# Title\n\n1. First clause.\n");
const standardTermsByType = { mutual_nda: EMPTY_TERMS, csa: EMPTY_TERMS };
const documentTypeLabels = { mutual_nda: "Mutual NDA", csa: "Cloud Service Agreement (CSA)" };

describe("DocumentPreview", () => {
  it("renders MndaPreview for mutual_nda", () => {
    render(
      <DocumentPreview
        documentType="mutual_nda"
        fields={defaultFormData()}
        standardTermsByType={standardTermsByType}
        documentTypeLabels={documentTypeLabels}
      />,
    );
    expect(screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })).toBeInTheDocument();
  });

  it("renders GenericPreview for any other document type", () => {
    render(
      <DocumentPreview
        documentType="csa"
        fields={defaultGenericFields(documentRegistry.csa)}
        standardTermsByType={standardTermsByType}
        documentTypeLabels={documentTypeLabels}
      />,
    );
    expect(screen.getByRole("heading", { name: "Cloud Service Agreement (CSA)" })).toBeInTheDocument();
  });
});
