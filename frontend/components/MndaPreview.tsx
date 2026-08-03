import {
  confidentialityTermText,
  formatEffectiveDate,
  governingLawAndJurisdictionText,
  mndaTermText,
  modificationsText,
  purposeText,
} from "@/lib/coverPageText";
import { DRAFT_DISCLAIMER } from "@/lib/disclaimer";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import type { MndaFormData } from "@/lib/types";
import { RichText } from "./RichText";

export function MndaPreview({
  formData,
  standardTerms,
}: {
  formData: MndaFormData;
  standardTerms: ParsedStandardTerms;
}) {
  return (
    <article className="space-y-8 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
      <header className="text-center">
        <h1 className="text-xl font-bold text-navy dark:text-white">
          Mutual Non-Disclosure Agreement
        </h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-navy dark:text-white">
          Cover Page
        </h2>
        <p>
          <strong>Purpose.</strong> {purposeText(formData)}
        </p>
        <p>
          <strong>Effective Date.</strong>{" "}
          {formatEffectiveDate(formData.effectiveDate)}
        </p>
        <p>
          <strong>MNDA Term.</strong> {mndaTermText(formData)}
        </p>
        <p>
          <strong>Term of Confidentiality.</strong>{" "}
          {confidentialityTermText(formData)}
        </p>
        <p>
          <strong>Governing Law &amp; Jurisdiction.</strong>{" "}
          {governingLawAndJurisdictionText(formData)}
        </p>
        <p>
          <strong>MNDA Modifications.</strong> {modificationsText(formData)}
        </p>
        <p>
          By signing this Cover Page, each party agrees to enter into this
          MNDA as of the Effective Date.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Party 1", party: formData.partyOne },
            { label: "Party 2", party: formData.partyTwo },
          ].map(({ label, party }) => (
            <div
              key={label}
              className="space-y-1 rounded-md border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h3 className="font-semibold text-navy dark:text-white">
                {label}
              </h3>
              <p>Signature: ____________________________</p>
              <p>Print Name: {party.printName || "—"}</p>
              <p>Title: {party.title || "—"}</p>
              <p>Company: {party.company || "—"}</p>
              <p>Notice Address: {party.noticeAddress || "—"}</p>
              <p>Date: ____________________________</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-navy dark:text-white">
          {standardTerms.title}
        </h2>
        {standardTerms.sections.map((section) => (
          <p key={section.number}>
            <strong>{section.number}.</strong>{" "}
            <RichText text={section.body} />
          </p>
        ))}
      </section>

      <footer className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
        <RichText text={standardTerms.attribution} />
        <p className="italic">{DRAFT_DISCLAIMER}</p>
      </footer>
    </article>
  );
}
