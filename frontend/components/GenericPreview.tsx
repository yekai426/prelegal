import type { DocumentTypeMeta } from "@/lib/documentRegistry";
import { formatFieldValue, type GenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { emptyParty, type PartyInfo } from "@/lib/types";
import { RichText } from "./RichText";

export function GenericPreview({
  documentTypeLabel,
  fields,
  meta,
  standardTerms,
}: {
  documentTypeLabel: string;
  fields: GenericFields;
  meta: DocumentTypeMeta;
  standardTerms: ParsedStandardTerms;
}) {
  return (
    <article className="space-y-8 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
      <header className="text-center">
        <h1 className="text-xl font-bold text-zinc-950 dark:text-white">{documentTypeLabel}</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">Cover Page</h2>
        {meta.fields
          .filter((descriptor) => descriptor.kind !== "party")
          .map((descriptor) => (
            <p key={descriptor.key}>
              <strong>{descriptor.label}.</strong> {formatFieldValue(descriptor, fields)}
            </p>
          ))}

        {meta.fields.some((descriptor) => descriptor.kind === "party") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {meta.fields
              .filter((descriptor) => descriptor.kind === "party")
              .map((descriptor) => {
                const party = (fields[descriptor.key] as PartyInfo) ?? emptyParty();
                return (
                  <div
                    key={descriptor.key}
                    className="space-y-1 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <h3 className="font-semibold text-zinc-950 dark:text-white">{descriptor.label}</h3>
                    <p>Signature: ____________________________</p>
                    <p>Print Name: {party.printName || "—"}</p>
                    <p>Title: {party.title || "—"}</p>
                    <p>Company: {party.company || "—"}</p>
                    <p>Notice Address: {party.noticeAddress || "—"}</p>
                    <p>Date: ____________________________</p>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{standardTerms.title}</h2>
        {standardTerms.sections.map((section) => (
          <p key={section.number}>
            <strong>{section.number}.</strong> <RichText text={section.body} />
          </p>
        ))}
      </section>

      {standardTerms.attribution && (
        <footer className="text-xs text-zinc-500 dark:text-zinc-400">
          <RichText text={standardTerms.attribution} />
        </footer>
      )}
    </article>
  );
}
