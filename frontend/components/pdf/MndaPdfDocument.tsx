import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
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
import { parseRichText } from "@/lib/richText";
import type { MndaFormData } from "@/lib/types";

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
function PdfRichText({
  text,
  style,
}: {
  text: string;
  style?: Style | Style[];
}) {
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

// Renders a bold label followed by a plain-text value. Used for Cover Page
// fields, where the value may be raw user input and must NOT be parsed as
// markdown (unlike the Standard Terms body, which is trusted source text).
function PdfLabeledText({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>{label} </Text>
      {value}
    </Text>
  );
}

export function MndaPdfDocument({
  formData,
  standardTerms,
}: {
  formData: MndaFormData;
  standardTerms: ParsedStandardTerms;
}) {
  const parties = [
    { label: "Party 1", party: formData.partyOne },
    { label: "Party 2", party: formData.partyTwo },
  ];

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <Text style={styles.heading}>Cover Page</Text>
        <PdfLabeledText label="Purpose." value={purposeText(formData)} />
        <PdfLabeledText
          label="Effective Date."
          value={formatEffectiveDate(formData.effectiveDate)}
        />
        <PdfLabeledText label="MNDA Term." value={mndaTermText(formData)} />
        <PdfLabeledText
          label="Term of Confidentiality."
          value={confidentialityTermText(formData)}
        />
        <PdfLabeledText
          label="Governing Law & Jurisdiction."
          value={governingLawAndJurisdictionText(formData)}
        />
        <PdfLabeledText
          label="MNDA Modifications."
          value={modificationsText(formData)}
        />
        <Text style={styles.paragraph}>
          By signing this Cover Page, each party agrees to enter into this
          MNDA as of the Effective Date.
        </Text>

        <View style={styles.partiesRow}>
          {parties.map(({ label, party }) => (
            <View key={label} style={styles.partyBox}>
              <Text style={[styles.paragraph, styles.bold]}>{label}</Text>
              <Text style={styles.paragraph}>Signature: ____________________</Text>
              <Text style={styles.paragraph}>
                Print Name: {party.printName || "—"}
              </Text>
              <Text style={styles.paragraph}>Title: {party.title || "—"}</Text>
              <Text style={styles.paragraph}>
                Company: {party.company || "—"}
              </Text>
              <Text style={styles.paragraph}>
                Notice Address: {party.noticeAddress || "—"}
              </Text>
              <Text style={styles.paragraph}>Date: ____________________</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>{standardTerms.title}</Text>
        {standardTerms.sections.map((section) => (
          <PdfRichText
            key={section.number}
            style={styles.paragraph}
            text={`**${section.number}.** ${section.body}`}
          />
        ))}

        <PdfRichText style={styles.attribution} text={standardTerms.attribution} />
        <Text style={styles.attribution}>{DRAFT_DISCLAIMER}</Text>
      </Page>
    </Document>
  );
}
