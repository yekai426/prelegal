import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentCreator } from "@/components/DocumentCreator";
import type { ChatTurnResponse } from "@/lib/chat";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

let latestOnTurnResult: ((result: ChatTurnResponse) => void) | null = null;

vi.mock("@/components/ChatPanel", () => ({
  ChatPanel: ({ onTurnResult }: { onTurnResult: (result: ChatTurnResponse) => void }) => {
    latestOnTurnResult = onTurnResult;
    return <div data-testid="chat-panel-stub" />;
  },
}));

vi.mock("@/components/SaveDocumentButton", () => ({
  SaveDocumentButton: () => <div data-testid="save-document-button-stub" />,
}));

function makeTurn(overrides: Partial<ChatTurnResponse> = {}): ChatTurnResponse {
  return {
    reply: "ok",
    fields: {},
    documentType: null,
    documentTypeLabel: null,
    suggestedDocumentType: null,
    suggestedDocumentTypeLabel: null,
    ...overrides,
  };
}

const EMPTY_TERMS = parseStandardTerms("# Title\n\n1. First clause.\n");

const standardTermsByType = {
  mutual_nda: EMPTY_TERMS,
  csa: EMPTY_TERMS,
  pilot_agreement: EMPTY_TERMS,
};

const documentTypeLabels = {
  mutual_nda: "Mutual NDA",
  csa: "Cloud Service Agreement (CSA)",
  pilot_agreement: "Pilot Agreement",
};

function renderCreator() {
  render(<DocumentCreator standardTermsByType={standardTermsByType} documentTypeLabels={documentTypeLabels} />);
}

describe("DocumentCreator", () => {
  it("shows a placeholder preview before the document type is known", () => {
    renderCreator();
    expect(screen.getByText(/once we know what document you need/i)).toBeInTheDocument();
  });

  it("switches to the MndaPreview once the assistant classifies as mutual_nda", () => {
    renderCreator();
    act(() => {
      latestOnTurnResult!(makeTurn({ documentType: "mutual_nda", fields: { purpose: "Evaluating a deal" } }));
    });
    expect(screen.getByText("Evaluating a deal")).toBeInTheDocument();
  });

  it("switches to GenericPreview for a non-MNDA classified type", () => {
    renderCreator();
    act(() => {
      latestOnTurnResult!(
        makeTurn({
          documentType: "csa",
          documentTypeLabel: "Cloud Service Agreement (CSA)",
          fields: { governingLaw: "Delaware" },
        }),
      );
    });
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cloud Service Agreement (CSA)" })).toBeInTheDocument();
  });

  it("ignores an unsupported-request result and leaves the current state untouched", () => {
    renderCreator();
    act(() => {
      latestOnTurnResult!(makeTurn({ documentType: "mutual_nda", fields: { purpose: "Evaluating a deal" } }));
    });
    act(() => {
      latestOnTurnResult!(makeTurn({ documentType: null, suggestedDocumentType: "csa" }));
    });
    // Still showing the MNDA preview with its prior fields, unaffected.
    expect(screen.getByText("Evaluating a deal")).toBeInTheDocument();
  });

  it("resets fields fresh when flipping between document types mid-conversation", () => {
    renderCreator();
    act(() => {
      latestOnTurnResult!(makeTurn({ documentType: "csa", fields: { governingLaw: "Delaware" } }));
    });
    expect(screen.getByText("Delaware")).toBeInTheDocument();

    act(() => {
      latestOnTurnResult!(makeTurn({ documentType: "pilot_agreement", fields: { governingLaw: "Delaware" } }));
    });
    // Shared field name carries over via the flip's own merge...
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    // ...but the new preview reflects the Pilot Agreement, not the old CSA.
    expect(screen.queryByRole("heading", { name: "Cloud Service Agreement (CSA)" })).not.toBeInTheDocument();
  });
});
