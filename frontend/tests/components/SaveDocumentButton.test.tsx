import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SaveDocumentButton } from "@/components/SaveDocumentButton";
import { DocumentsApiError } from "@/lib/documents";

const { useAuth, saveDocument } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  saveDocument: vi.fn(),
}));

vi.mock("@/lib/AuthContext", () => ({ useAuth }));
vi.mock("@/lib/documents", async () => {
  const actual = await vi.importActual<typeof import("@/lib/documents")>("@/lib/documents");
  return { ...actual, saveDocument };
});

beforeEach(() => {
  useAuth.mockReset();
  saveDocument.mockReset();
});

describe("SaveDocumentButton", () => {
  it("saves immediately and shows a confirmation when already authenticated", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    saveDocument.mockResolvedValue({
      id: 5,
      documentType: "csa",
      documentTypeLabel: "Cloud Service Agreement (CSA)",
      title: "Cloud Service Agreement (CSA) — Acme Corp — August 2, 2026",
      createdAt: "2026-08-02T00:00:00",
    });

    render(<SaveDocumentButton documentType="csa" fields={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /save to my documents/i }));

    await waitFor(() => expect(saveDocument).toHaveBeenCalledWith("csa", {}));
    expect(await screen.findByText(/Cloud Service Agreement \(CSA\) — Acme Corp — August 2, 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view your documents/i })).toHaveAttribute("href", "/documents");
  });

  it("shows an inline sign-in prompt instead of saving when anonymous", () => {
    useAuth.mockReturnValue({ status: "anonymous", user: null, signIn: vi.fn(), signUp: vi.fn() });

    render(<SaveDocumentButton documentType="csa" fields={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /save to my documents/i }));

    expect(saveDocument).not.toHaveBeenCalled();
    expect(screen.getByText(/sign in to save this document/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("saves automatically once the inline sign-in succeeds", async () => {
    const signIn = vi.fn().mockResolvedValue({ id: 1, email: "a@example.com", createdAt: "2026-08-02T00:00:00" });
    useAuth.mockReturnValue({ status: "anonymous", user: null, signIn, signUp: vi.fn() });
    saveDocument.mockResolvedValue({
      id: 6,
      documentType: "csa",
      documentTypeLabel: "Cloud Service Agreement (CSA)",
      title: "Cloud Service Agreement (CSA) — August 2, 2026",
      createdAt: "2026-08-02T00:00:00",
    });

    render(<SaveDocumentButton documentType="csa" fields={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /save to my documents/i }));

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(saveDocument).toHaveBeenCalledWith("csa", {}));
  });

  it("shows an error message when saving fails", async () => {
    useAuth.mockReturnValue({ status: "authenticated", user: { id: 1, email: "a@example.com" } });
    saveDocument.mockRejectedValue(new DocumentsApiError(503, "temporarily unavailable"));

    render(<SaveDocumentButton documentType="csa" fields={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /save to my documents/i }));

    expect(await screen.findByText("temporarily unavailable")).toBeInTheDocument();
  });
});
