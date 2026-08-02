export interface StandardTermsSection {
  number: string;
  body: string;
}

export interface ParsedStandardTerms {
  title: string;
  sections: StandardTermsSection[];
  attribution: string;
}

// The source markdown wraps cross-references to Cover Page fields in
// <span class="coverpage_link">Term</span> for Common Paper's own site rendering.
// We don't need that behavior here, so we fold it into a bold reference instead.
function stripCoverpageSpans(text: string): string {
  return text.replace(/<span class="coverpage_link">(.*?)<\/span>/g, "**$1**");
}

export function parseStandardTerms(markdown: string): ParsedStandardTerms {
  const lines = markdown.split("\n").map((line) => line.trimEnd());

  const titleLine = lines.find((line) => line.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "Standard Terms";

  let lastNonEmpty = lines.length - 1;
  while (lastNonEmpty >= 0 && lines[lastNonEmpty].trim() === "") {
    lastNonEmpty--;
  }
  const attribution = stripCoverpageSpans(lines[lastNonEmpty] ?? "").trim();

  const sections: StandardTermsSection[] = [];
  let current: StandardTermsSection | null = null;

  for (let i = 0; i < lastNonEmpty; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^(\d+)\.\s+(.*)$/);
    if (match) {
      if (current) sections.push(current);
      current = { number: match[1], body: match[2] };
    } else if (current) {
      current.body += ` ${line}`;
    }
  }
  if (current) sections.push(current);

  return {
    title,
    sections: sections.map((section) => ({
      number: section.number,
      body: stripCoverpageSpans(section.body).trim(),
    })),
    attribution,
  };
}
