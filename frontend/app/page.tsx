import fs from "node:fs";
import path from "node:path";
import { DocumentCreator } from "@/components/DocumentCreator";
import { documentRegistry, slugify } from "@/lib/documentRegistry";
import { parseStandardTerms, type ParsedStandardTerms } from "@/lib/parseStandardTerms";

interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

export default function Home() {
  // Reads the canonical Standard Terms and catalog from the repo's
  // templates/ and catalog.json so the legal boilerplate has a single
  // source of truth, mirroring the existing Mutual-NDA-only build-time read.
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <DocumentCreator standardTermsByType={standardTermsByType} documentTypeLabels={documentTypeLabels} />
    </div>
  );
}
