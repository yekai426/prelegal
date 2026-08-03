import fs from "node:fs";
import path from "node:path";
import { documentRegistry, slugify } from "./documentRegistry";
import { parseStandardTerms, type ParsedStandardTerms } from "./parseStandardTerms";

interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

export interface CatalogData {
  standardTermsByType: Record<string, ParsedStandardTerms>;
  documentTypeLabels: Record<string, string>;
}

// Reads the canonical Standard Terms and catalog from the repo's templates/
// and catalog.json so the legal boilerplate has a single source of truth.
// Server-only (uses fs) — call from a Server Component only.
export function loadCatalogData(): CatalogData {
  const repoRoot = path.join(process.cwd(), "..");

  const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(path.join(repoRoot, "catalog.json"), "utf-8"));
  const documentTypeLabels: Record<string, string> = {};
  for (const entry of catalog) {
    const key = slugify(path.parse(entry.filename).name);
    if (key in documentRegistry || key === "mutual_nda") {
      documentTypeLabels[key] = entry.name;
    }
  }

  const standardTermsByType: Record<string, ParsedStandardTerms> = {};
  standardTermsByType.mutual_nda = parseStandardTerms(
    fs.readFileSync(path.join(repoRoot, "templates", "Mutual-NDA.md"), "utf-8"),
  );
  for (const meta of Object.values(documentRegistry)) {
    standardTermsByType[meta.key] = parseStandardTerms(
      fs.readFileSync(path.join(repoRoot, "templates", meta.filename), "utf-8"),
    );
  }

  return { standardTermsByType, documentTypeLabels };
}
