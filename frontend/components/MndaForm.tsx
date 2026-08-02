"use client";

import {
  clampDuration,
  type ConfidentialityTermChoice,
  type DurationUnit,
  type MndaFormData,
  type MndaTermChoice,
  type PartyInfo,
} from "@/lib/types";

const DURATION_UNITS: DurationUnit[] = ["day", "month", "year"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function DurationFields({
  duration,
  unit,
  onChange,
  disabled,
}: {
  duration: number;
  unit: DurationUnit;
  onChange: (duration: number, unit: DurationUnit) => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={duration}
        disabled={disabled}
        onChange={(e) => onChange(clampDuration(Number(e.target.value)), unit)}
        className={`${inputClasses} w-20 disabled:opacity-50`}
      />
      <select
        value={unit}
        disabled={disabled}
        onChange={(e) => onChange(duration, e.target.value as DurationUnit)}
        className={`${inputClasses} w-auto disabled:opacity-50`}
      >
        {DURATION_UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
            {duration === 1 ? "" : "s"}
          </option>
        ))}
      </select>
    </span>
  );
}

function PartyFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PartyInfo;
  onChange: (value: PartyInfo) => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {label}
      </legend>
      <Field label="Print Name">
        <input
          type="text"
          value={value.printName}
          onChange={(e) => onChange({ ...value, printName: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="Title">
        <input
          type="text"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="Company">
        <input
          type="text"
          value={value.company}
          onChange={(e) => onChange({ ...value, company: e.target.value })}
          className={inputClasses}
        />
      </Field>
      <Field label="Notice Address (email or postal address)">
        <input
          type="text"
          value={value.noticeAddress}
          onChange={(e) =>
            onChange({ ...value, noticeAddress: e.target.value })
          }
          className={inputClasses}
        />
      </Field>
    </fieldset>
  );
}

export function MndaForm({
  value,
  onChange,
}: {
  value: MndaFormData;
  onChange: (value: MndaFormData) => void;
}) {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Field label="Purpose (how Confidential Information may be used)">
        <textarea
          rows={2}
          value={value.purpose}
          onChange={(e) => onChange({ ...value, purpose: e.target.value })}
          className={inputClasses}
        />
      </Field>

      <Field label="Effective Date">
        <input
          type="date"
          value={value.effectiveDate}
          onChange={(e) =>
            onChange({ ...value, effectiveDate: e.target.value })
          }
          className={inputClasses}
        />
      </Field>

      <fieldset className="space-y-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          MNDA Term
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mndaTermChoice"
            checked={value.mndaTermChoice === "expires"}
            onChange={() =>
              onChange({ ...value, mndaTermChoice: "expires" as MndaTermChoice })
            }
          />
          Expires{" "}
          <DurationFields
            duration={value.mndaTermDuration.duration}
            unit={value.mndaTermDuration.unit}
            disabled={value.mndaTermChoice !== "expires"}
            onChange={(duration, unit) =>
              onChange({ ...value, mndaTermDuration: { duration, unit } })
            }
          />{" "}
          from Effective Date.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="mndaTermChoice"
            checked={value.mndaTermChoice === "continues"}
            onChange={() =>
              onChange({
                ...value,
                mndaTermChoice: "continues" as MndaTermChoice,
              })
            }
          />
          Continues until terminated in accordance with the terms of the
          MNDA.
        </label>
      </fieldset>

      <fieldset className="space-y-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Term of Confidentiality
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="confidentialityTermChoice"
            checked={value.confidentialityTermChoice === "duration"}
            onChange={() =>
              onChange({
                ...value,
                confidentialityTermChoice:
                  "duration" as ConfidentialityTermChoice,
              })
            }
          />
          <DurationFields
            duration={value.confidentialityTermDuration.duration}
            unit={value.confidentialityTermDuration.unit}
            disabled={value.confidentialityTermChoice !== "duration"}
            onChange={(duration, unit) =>
              onChange({
                ...value,
                confidentialityTermDuration: { duration, unit },
              })
            }
          />{" "}
          from Effective Date, but in the case of trade secrets until no
          longer considered a trade secret under applicable laws.
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="confidentialityTermChoice"
            checked={value.confidentialityTermChoice === "perpetuity"}
            onChange={() =>
              onChange({
                ...value,
                confidentialityTermChoice:
                  "perpetuity" as ConfidentialityTermChoice,
              })
            }
          />
          In perpetuity.
        </label>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Governing Law">
          <input
            type="text"
            placeholder="e.g. Delaware"
            value={value.governingLaw}
            onChange={(e) =>
              onChange({ ...value, governingLaw: e.target.value })
            }
            className={inputClasses}
          />
        </Field>
        <Field label="Jurisdiction">
          <input
            type="text"
            placeholder='e.g. courts located in New Castle, DE'
            value={value.jurisdiction}
            onChange={(e) =>
              onChange({ ...value, jurisdiction: e.target.value })
            }
            className={inputClasses}
          />
        </Field>
      </div>

      <Field label="MNDA Modifications (optional)">
        <textarea
          rows={2}
          value={value.modifications}
          onChange={(e) =>
            onChange({ ...value, modifications: e.target.value })
          }
          className={inputClasses}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PartyFields
          label="Party 1"
          value={value.partyOne}
          onChange={(partyOne) => onChange({ ...value, partyOne })}
        />
        <PartyFields
          label="Party 2"
          value={value.partyTwo}
          onChange={(partyTwo) => onChange({ ...value, partyTwo })}
        />
      </div>
    </form>
  );
}
