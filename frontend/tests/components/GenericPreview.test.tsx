import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenericPreview } from "@/components/GenericPreview";
import { documentRegistry } from "@/lib/documentRegistry";
import { defaultGenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";

const STANDARD_TERMS: ParsedStandardTerms = {
  title: "Standard Terms",
  sections: [{ number: "1", body: "**Introduction**. This references the **Purpose** defined above." }],
  attribution: "",
};

const csaMeta = documentRegistry.csa;

describe("GenericPreview", () => {
  it("shows placeholder text for unfilled fields", () => {
    render(
      <GenericPreview
        documentTypeLabel="Cloud Service Agreement (CSA)"
        fields={defaultGenericFields(csaMeta)}
        meta={csaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    expect(screen.getByText(/\[governing law not yet specified\]/i)).toBeInTheDocument();
  });

  it("renders Standard Terms markdown (bold) via the trusted RichText path", () => {
    render(
      <GenericPreview
        documentTypeLabel="Cloud Service Agreement (CSA)"
        fields={defaultGenericFields(csaMeta)}
        meta={csaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    const bold = screen.getByText("Introduction");
    expect(bold.tagName).toBe("STRONG");
  });

  it("does NOT parse markdown-like syntax in free-text field values", () => {
    const raw = "Evaluating a **strategic** deal for [our teams](https://example.com)";
    const fields = { ...defaultGenericFields(csaMeta), technicalSupport: raw };
    render(
      <GenericPreview
        documentTypeLabel="Cloud Service Agreement (CSA)"
        fields={fields}
        meta={csaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    expect(screen.getByText(raw)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "our teams" })).not.toBeInTheDocument();
  });

  it("renders party fields with their document-specific role labels", () => {
    const fields = {
      ...defaultGenericFields(csaMeta),
      partyOne: { printName: "Alice", title: "", company: "", noticeAddress: "" },
    };
    render(
      <GenericPreview
        documentTypeLabel="Cloud Service Agreement (CSA)"
        fields={fields}
        meta={csaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Print Name: Alice")).toBeInTheDocument();
  });

  it("omits the parties grid entirely for a document type with no party fields", () => {
    const slaMeta = documentRegistry.sla;
    render(
      <GenericPreview
        documentTypeLabel="Service Level Agreement (SLA)"
        fields={defaultGenericFields(slaMeta)}
        meta={slaMeta}
        standardTerms={STANDARD_TERMS}
      />,
    );
    expect(screen.queryByText("Signature:", { exact: false })).not.toBeInTheDocument();
  });
});
