import fs from "node:fs";
import path from "node:path";
import { MndaCreator } from "@/components/MndaCreator";
import { parseStandardTerms } from "@/lib/parseStandardTerms";

export default function Home() {
  // Reads the canonical Standard Terms from the repo's templates/ directory
  // so the legal boilerplate has a single source of truth.
  const standardTermsPath = path.join(
    process.cwd(),
    "..",
    "templates",
    "Mutual-NDA.md",
  );
  const raw = fs.readFileSync(standardTermsPath, "utf-8");
  const standardTerms = parseStandardTerms(raw);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <MndaCreator standardTerms={standardTerms} />
    </div>
  );
}
