import { ApiError, parseErrorDetail } from "./apiError";
import type { DocumentFields } from "./documentState";

export class DocumentsApiError extends ApiError {}

export interface DocumentSummary {
  id: number;
  documentType: string;
  documentTypeLabel: string;
  title: string;
  createdAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  fields: DocumentFields;
}

interface DocumentSummaryWire {
  id: number;
  document_type: string;
  document_type_label: string;
  title: string;
  created_at: string;
}

interface DocumentDetailWire extends DocumentSummaryWire {
  fields: DocumentFields;
}

function mapSummary(body: DocumentSummaryWire): DocumentSummary {
  return {
    id: body.id,
    documentType: body.document_type,
    documentTypeLabel: body.document_type_label,
    title: body.title,
    createdAt: body.created_at,
  };
}

function mapDetail(body: DocumentDetailWire): DocumentDetail {
  return { ...mapSummary(body), fields: body.fields };
}

export async function saveDocument(documentType: string, fields: DocumentFields): Promise<DocumentDetail> {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_type: documentType, fields }),
  });
  if (!res.ok) throw new DocumentsApiError(res.status, await parseErrorDetail(res));
  return mapDetail(await res.json());
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new DocumentsApiError(res.status, await parseErrorDetail(res));
  const body: DocumentSummaryWire[] = await res.json();
  return body.map(mapSummary);
}

export async function fetchDocument(id: number): Promise<DocumentDetail> {
  const res = await fetch(`/api/documents/${id}`);
  if (!res.ok) throw new DocumentsApiError(res.status, await parseErrorDetail(res));
  return mapDetail(await res.json());
}
