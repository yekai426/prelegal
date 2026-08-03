export interface StandardTermsSection {
  number: string;
  body: string;
}

export interface ParsedStandardTerms {
  title: string;
  sections: StandardTermsSection[];
  attribution: string;
}

const VARIABLE_LINK_CLASSES = "coverpage_link|orderform_link|keyterms_link|businessterms_link|sow_link";
const VARIABLE_LINK_PATTERN = new RegExp(`<span class="(?:${VARIABLE_LINK_CLASSES})">(.*?)<\\/span>`, "g");

// The source markdown wraps cross-references to Cover Page/Order Form/Key
// Terms/Business Terms/SOW fields in <span class="..._link">Term</span> for
// Common Paper's own site rendering — we bold-wrap those instead. Section
// heading spans (header_2/header_3) and any other bare <span> wrappers
// (including malformed/unbalanced ones, e.g. a stray extra closing tag) are
// stripped to their plain inner text with no special styling.
function stripVariableSpans(text: string): string {
  const withBoldVariables = text.replace(VARIABLE_LINK_PATTERN, "**$1**");
  return withBoldVariables.replace(/<span[^>]*>/g, "").replace(/<\/span>/g, "");
}

const ATTRIBUTION_PATTERN = /creativecommons\.org|CC BY/i;

export function parseStandardTerms(markdown: string): ParsedStandardTerms {
  const lines = markdown.split("\n").map((line) => line.trimEnd());

  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Standard Terms";

  let lastNonEmpty = lines.length - 1;
  while (lastNonEmpty >= 0 && lines[lastNonEmpty].trim() === "") {
    lastNonEmpty--;
  }
  const candidateLast = lines[lastNonEmpty] ?? "";
  const isAttribution = ATTRIBUTION_PATTERN.test(candidateLast);
  const attribution = isAttribution ? stripVariableSpans(candidateLast).trim() : "";
  // If the last non-empty line isn't a real attribution footer (true for
  // every template except Mutual-NDA's two files), it's ordinary body text
  // and must be included in section parsing, not excluded.
  const sectionEndIndex = isAttribution ? lastNonEmpty : lastNonEmpty + 1;

  const sections: StandardTermsSection[] = [];
  let current: StandardTermsSection | null = null;

  for (let i = 0; i < sectionEndIndex; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    // A new top-level section only starts at zero indentation. Nested
    // sub-clauses (4-space-indented in every template but Mutual-NDA's flat
    // one) still match the same numbered-line pattern but must fold into the
    // current section's body instead of splitting it into a false section.
    const match = /^\S/.test(rawLine) ? rawLine.match(/^(\d+)\.\s+(.*)$/) : null;
    if (match) {
      if (current) sections.push(current);
      current = { number: match[1], body: match[2] };
    } else if (current) {
      current.body += ` ${rawLine.trim()}`;
    }
  }
  if (current) sections.push(current);

  return {
    title,
    sections: sections.map((section) => ({
      number: section.number,
      body: stripVariableSpans(section.body).trim(),
    })),
    attribution,
  };
}
