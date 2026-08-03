import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsApiError, fetchDocument, listDocuments, saveDocument } from "@/lib/documents";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saveDocument", () => {
  it("posts the document_type/fields body and returns the mapped detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 7,
        document_type: "csa",
        document_type_label: "Cloud Service Agreement (CSA)",
        title: "Cloud Service Agreement (CSA) — Acme Corp — August 2, 2026",
        created_at: "2026-08-02T00:00:00",
        fields: { governingLaw: "Delaware" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await saveDocument("csa", { governingLaw: "Delaware" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/documents",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: "csa", fields: { governingLaw: "Delaware" } }),
      }),
    );
    expect(result).toEqual({
      id: 7,
      documentType: "csa",
      documentTypeLabel: "Cloud Service Agreement (CSA)",
      title: "Cloud Service Agreement (CSA) — Acme Corp — August 2, 2026",
      createdAt: "2026-08-02T00:00:00",
      fields: { governingLaw: "Delaware" },
    });
  });

  it("throws DocumentsApiError when unauthenticated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ detail: "Not authenticated" }),
      }),
    );
    await expect(saveDocument("csa", {})).rejects.toBeInstanceOf(DocumentsApiError);
  });
});

describe("listDocuments", () => {
  it("maps each summary in the list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            document_type: "mutual_nda",
            document_type_label: "Mutual NDA",
            title: "Mutual NDA — August 1, 2026",
            created_at: "2026-08-01T00:00:00",
          },
        ],
      }),
    );
    const result = await listDocuments();
    expect(result).toEqual([
      {
        id: 1,
        documentType: "mutual_nda",
        documentTypeLabel: "Mutual NDA",
        title: "Mutual NDA — August 1, 2026",
        createdAt: "2026-08-01T00:00:00",
      },
    ]);
  });
});

describe("fetchDocument", () => {
  it("requests the document by id and maps the detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 9,
        document_type: "baa",
        document_type_label: "Business Associate Agreement (BAA)",
        title: "Business Associate Agreement (BAA) — August 2, 2026",
        created_at: "2026-08-02T00:00:00",
        fields: {},
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchDocument(9);
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/9");
  });

  it("throws DocumentsApiError on a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Document not found" }),
      }),
    );
    await expect(fetchDocument(999)).rejects.toBeInstanceOf(DocumentsApiError);
  });
});
