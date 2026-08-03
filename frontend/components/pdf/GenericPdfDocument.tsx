import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { DocumentTypeMeta } from "@/lib/documentRegistry";
import { DRAFT_DISCLAIMER } from "@/lib/disclaimer";
import { formatFieldValue, type GenericFields } from "@/lib/genericFields";
import type { ParsedStandardTerms } from "@/lib/parseStandardTerms";
import { parseRichText } from "@/lib/richText";
import { emptyParty, type PartyInfo } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#18181b",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 6,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  partiesRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderStyle: "solid",
    padding: 10,
  },
  attribution: {
    marginTop: 16,
    fontSize: 8,
    color: "#71717a",
  },
});

// Renders **bold** and [text](url) segments as nested react-pdf <Text>/<Link> runs.
// Reserved for the trusted Standard Terms body — never for field values.
function PdfRichText({ text, style }: { text: string; style?: Style | Style[] }) {
  return (
    <Text style={style}>
      {parseRichText(text).map((segment, index) => {
        if (segment.type === "bold") {
          return (
            <Text key={index} style={styles.bold}>
              {segment.value}
            </Text>
          );
        }
        if (segment.type === "link") {
          return (
            <Link key={index} src={segment.href}>
              {segment.text}
            </Link>
          );
        }
        return <Text key={index}>{segment.value}</Text>;
      })}
    </Text>
  );
}

export function GenericPdfDocument({
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
  const partyDescriptors = meta.fields.filter((descriptor) => descriptor.kind === "party");

  return (
    <Document title={documentTypeLabel}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{documentTypeLabel}</Text>

        <Text style={styles.heading}>Cover Page</Text>
        {meta.fields
          .filter((descriptor) => descriptor.kind !== "party")
          .map((descriptor) => (
            <Text key={descriptor.key} style={styles.paragraph}>
              <Text style={styles.bold}>{descriptor.label}. </Text>
              {formatFieldValue(descriptor, fields)}
            </Text>
          ))}

        {partyDescriptors.length > 0 && (
          <View style={styles.partiesRow}>
            {partyDescriptors.map((descriptor) => {
              const party = (fields[descriptor.key] as PartyInfo) ?? emptyParty();
              return (
                <View key={descriptor.key} style={styles.partyBox}>
                  <Text style={[styles.paragraph, styles.bold]}>{descriptor.label}</Text>
                  <Text style={styles.paragraph}>Signature: ____________________</Text>
                  <Text style={styles.paragraph}>Print Name: {party.printName || "—"}</Text>
                  <Text style={styles.paragraph}>Title: {party.title || "—"}</Text>
                  <Text style={styles.paragraph}>Company: {party.company || "—"}</Text>
                  <Text style={styles.paragraph}>Notice Address: {party.noticeAddress || "—"}</Text>
                  <Text style={styles.paragraph}>Date: ____________________</Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.heading}>{standardTerms.title}</Text>
        {standardTerms.sections.map((section) => (
          <PdfRichText key={section.number} style={styles.paragraph} text={`**${section.number}.** ${section.body}`} />
        ))}

        {standardTerms.attribution && (
          <PdfRichText style={styles.attribution} text={standardTerms.attribution} />
        )}
        <Text style={styles.attribution}>{DRAFT_DISCLAIMER}</Text>
      </Page>
    </Document>
  );
}
