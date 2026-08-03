import { DocumentHistory } from "@/components/DocumentHistory";
import { loadCatalogData } from "@/lib/catalogData";

export default function DocumentsPage() {
  const { standardTermsByType, documentTypeLabels } = loadCatalogData();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-black">
      <DocumentHistory standardTermsByType={standardTermsByType} documentTypeLabels={documentTypeLabels} />
    </div>
  );
}
