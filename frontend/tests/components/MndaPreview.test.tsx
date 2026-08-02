import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MndaPreview } from "@/components/MndaPreview";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { defaultFormData } from "@/lib/types";

const STANDARD_TERMS: ParsedStandardTerms = {
  title: "Standard Terms",
  sections: [
    {
      number: "1",
      body: "**Introduction**. This references the **Purpose** defined above.",
    },
  ],
  attribution:
    "Common Paper Mutual Non-Disclosure Agreement [Version 1.0](https://commonpaper.com/standards/mutual-nda/1.0/) free to use under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).",
};

describe("MndaPreview", () => {
  it("shows placeholder text for unfilled fields", () => {
    render(
      <MndaPreview formData={defaultFormData()} standardTerms={STANDARD_TERMS} />,
    );
    expect(
      screen.getByText(/\[effective date not yet specified\]/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[governing law not yet specified\]/i),
    ).toBeInTheDocument();
  });

  it("shows filled-in values once the form has data", () => {
    const formData = {
      ...defaultFormData(),
      purpose: "Evaluating a joint venture.",
      governingLaw: "Delaware",
      jurisdiction: "courts located in New Castle, DE",
    };
    render(<MndaPreview formData={formData} standardTerms={STANDARD_TERMS} />);
    expect(screen.getByText(/evaluating a joint venture\./i)).toBeInTheDocument();
    expect(screen.getByText(/governing law: delaware/i)).toBeInTheDocument();
  });

  it("renders Standard Terms markdown (bold, links) via RichText", () => {
    render(
      <MndaPreview formData={defaultFormData()} standardTerms={STANDARD_TERMS} />,
    );
    const boldIntro = screen.getByText("Introduction");
    expect(boldIntro.tagName).toBe("STRONG");
    expect(
      screen.getByRole("link", { name: "CC BY 4.0" }),
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  });

  it("does NOT parse markdown-like syntax in free-text Cover Page fields", () => {
    const raw =
      "Evaluating a **strategic** deal for [our teams](https://example.com)";
    const formData = { ...defaultFormData(), purpose: raw };
    render(<MndaPreview formData={formData} standardTerms={STANDARD_TERMS} />);

    // The literal raw text (including ** and [](...)) must appear as-is...
    expect(screen.getByText(raw)).toBeInTheDocument();
    // ...and must NOT have been turned into a real link.
    expect(
      screen.queryByRole("link", { name: "our teams" }),
    ).not.toBeInTheDocument();
  });
});
