import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DocumentHistory } from "@/components/DocumentHistory";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

const { useAuth, listDocuments, fetchDocument } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  listDocuments: vi.fn(),
  fetchDocument: vi.fn(),
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth }));
vi.mock("@/lib/documents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/documents")>("@/lib/documents");
  return { ...actual, listDocuments, fetchDocument };
});

const EMPTY_TERMS = parseStandardTerms("# Title\n\n1. First clause.\n");
const standardTermsByType = { csa: EMPTY_TERMS };
const documentTypeLabels = { csa: "Cloud Service Agreement (CSA)" };

function renderHistory() {
  render(<DocumentHistory standardTermsByType={standardTermsByType} documentTypeLabels={documentTypeLabels} />);
}

beforeEach(() => {
  useAuth.mockReset();
  listDocuments.mockReset();
  fetchDocument.mockReset();
});

describe("DocumentHistory", () => {
  it("shows a loading state while auth status is resolving", () => {
    useAuth.mockReturnValue({ status: "loading", user: null });
    renderHistory();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(listDocuments).not.toHaveBeenCalled();
  });

  it("shows an inline sign-in prompt when anonymous, without listing documents", () => {
    useAuth.mockReturnValue({ status: "anonymous", user: null, signIn: vi.fn(), signUp: vi.fn() });
    renderHistory();
    expect(screen.getByText(/sign in to see documents/i)).toBeInTheDocument();
    expect(listDocuments).not.toHaveBeenCalled();
  });

  it("lists the current user's documents once authenticated", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    listDocuments.mockResolvedValue([
      {
        id: 1,
        documentType: "csa",
        documentTypeLabel: "Cloud Service Agreement (CSA)",
        title: "Cloud Service Agreement (CSA) — Acme Corp — August 2, 2026",
        createdAt: "2026-08-02T00:00:00",
      },
    ]);
    renderHistory();

    expect(await screen.findByText(/Acme Corp/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no saved documents", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    listDocuments.mockResolvedValue([]);
    renderHistory();

    expect(await screen.findByText(/haven.t saved any documents yet/i)).toBeInTheDocument();
  });

  it("fetches and previews the selected document read-only", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    listDocuments.mockResolvedValue([
      {
        id: 1,
        documentType: "csa",
        documentTypeLabel: "Cloud Service Agreement (CSA)",
        title: "Cloud Service Agreement (CSA) — Acme Corp",
        createdAt: "2026-08-02T00:00:00",
      },
    ]);
    fetchDocument.mockResolvedValue({
      id: 1,
      documentType: "csa",
      documentTypeLabel: "Cloud Service Agreement (CSA)",
      title: "Cloud Service Agreement (CSA) — Acme Corp",
      createdAt: "2026-08-02T00:00:00",
      fields: { governingLaw: "Delaware" },
    });
    renderHistory();

    fireEvent.click(await screen.findByText(/Acme Corp/));

    await waitFor(() => expect(fetchDocument).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Delaware")).toBeInTheDocument();
  });

  it("keeps the most recently clicked document even if an earlier click's fetch resolves later", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    listDocuments.mockResolvedValue([
      { id: 1, documentType: "csa", documentTypeLabel: "CSA", title: "Doc A", createdAt: "2026-08-01T00:00:00" },
      { id: 2, documentType: "csa", documentTypeLabel: "CSA", title: "Doc B", createdAt: "2026-08-02T00:00:00" },
    ]);

    let resolveSlowFirstClick!: (value: unknown) => void;
    fetchDocument.mockImplementation((id: number) => {
      if (id === 1) {
        return new Promise((resolve) => {
          resolveSlowFirstClick = resolve;
        });
      }
      return Promise.resolve({
        id: 2,
        documentType: "csa",
        documentTypeLabel: "CSA",
        title: "Doc B",
        createdAt: "2026-08-02T00:00:00",
        fields: { governingLaw: "California" },
      });
    });

    renderHistory();

    fireEvent.click(await screen.findByText("Doc A"));
    fireEvent.click(await screen.findByText("Doc B"));

    // The faster second click's detail should be showing...
    expect(await screen.findByText("California")).toBeInTheDocument();

    // ...and the first (slower) click resolving afterward must NOT overwrite it.
    resolveSlowFirstClick({
      id: 1,
      documentType: "csa",
      documentTypeLabel: "CSA",
      title: "Doc A",
      createdAt: "2026-08-01T00:00:00",
      fields: { governingLaw: "Delaware" },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText("California")).toBeInTheDocument();
    expect(screen.queryByText("Delaware")).not.toBeInTheDocument();
  });

  it("shows an error message if loading the document list fails", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    const { DocumentsApiError } = await import("@/lib/documents");
    listDocuments.mockRejectedValue(new DocumentsApiError(503, "temporarily unavailable"));
    renderHistory();

    expect(await screen.findByText("temporarily unavailable")).toBeInTheDocument();
  });
});
