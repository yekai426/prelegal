export function slugify(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type FieldDescriptor =
  | { kind: "text" | "date"; key: string; label: string }
  | { kind: "duration"; key: string; label: string }
  | { kind: "party"; key: "partyOne" | "partyTwo"; label: string };

export interface DocumentTypeMeta {
  key: string;
  filename: string;
  pdfFileName: string;
  fields: FieldDescriptor[];
}

// Mirrors backend/app/services/chat/<key>.py's FIELD_GUIDE for each document
// type — this is rendering metadata (labels, order, party role names), not
// validation; the backend Pydantic schemas are the source of truth for what
// values are actually collected.
export const documentRegistry: Record<string, DocumentTypeMeta> = {
  csa: {
    key: "csa",
    filename: "CSA.md",
    pdfFileName: "cloud-service-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "duration", key: "subscriptionPeriod", label: "Subscription Period" },
      { kind: "date", key: "orderDate", label: "Order Date" },
      { kind: "date", key: "nonRenewalNoticeDate", label: "Non-Renewal Notice Date" },
      { kind: "text", key: "technicalSupport", label: "Technical Support" },
      { kind: "text", key: "paymentProcess", label: "Payment Process" },
      { kind: "text", key: "generalCapAmount", label: "General Cap Amount" },
      { kind: "text", key: "increasedCapAmount", label: "Increased Cap Amount" },
      { kind: "text", key: "additionalWarranties", label: "Additional Warranties" },
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Customer" },
    ],
  },
  design_partner_agreement: {
    key: "design_partner_agreement",
    filename: "design-partner-agreement.md",
    pdfFileName: "design-partner-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "duration", key: "term", label: "Term" },
      { kind: "text", key: "program", label: "Program" },
      { kind: "text", key: "fees", label: "Fees" },
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Partner" },
    ],
  },
  sla: {
    key: "sla",
    filename: "sla.md",
    pdfFileName: "service-level-agreement.pdf",
    fields: [
      { kind: "text", key: "targetUptimePercent", label: "Target Uptime" },
      { kind: "text", key: "targetResponseTime", label: "Target Response Time" },
      { kind: "text", key: "supportChannel", label: "Support Channel" },
      { kind: "text", key: "uptimeCreditFormula", label: "Uptime Credit" },
      { kind: "text", key: "responseTimeCreditFormula", label: "Response Time Credit" },
    ],
  },
  psa: {
    key: "psa",
    filename: "psa.md",
    pdfFileName: "professional-services-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "text", key: "customerPolicies", label: "Customer Policies" },
      { kind: "text", key: "deliverables", label: "Deliverables" },
      { kind: "text", key: "rejectionPeriod", label: "Rejection Period" },
      { kind: "text", key: "resubmissionPeriod", label: "Resubmission Period" },
      { kind: "text", key: "fees", label: "Fees" },
      { kind: "text", key: "paymentPeriod", label: "Payment Period" },
      { kind: "text", key: "timeOfAssignment", label: "Time of Assignment" },
      { kind: "text", key: "sowTerm", label: "SOW Term" },
      { kind: "text", key: "customerObligations", label: "Customer Obligations" },
      { kind: "text", key: "securityPolicy", label: "Security Policy" },
      { kind: "text", key: "insuranceMinimums", label: "Insurance Minimums" },
      { kind: "text", key: "generalCapAmount", label: "General Cap Amount" },
      { kind: "text", key: "increasedCapAmount", label: "Increased Cap Amount" },
      { kind: "text", key: "additionalWarranties", label: "Additional Warranties" },
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Customer" },
    ],
  },
  dpa: {
    key: "dpa",
    filename: "DPA.md",
    pdfFileName: "data-processing-agreement.pdf",
    fields: [
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Customer" },
      { kind: "text", key: "categoriesOfPersonalData", label: "Categories of Personal Data" },
      { kind: "text", key: "categoriesOfDataSubjects", label: "Categories of Data Subjects" },
      { kind: "text", key: "specialCategoryData", label: "Special Category Data" },
      { kind: "text", key: "specialCategoryRestrictions", label: "Special Category Data Restrictions" },
      { kind: "text", key: "approvedSubprocessors", label: "Approved Subprocessors" },
      { kind: "text", key: "frequencyNatureAndPurpose", label: "Frequency, Nature & Purpose of Processing" },
      { kind: "text", key: "durationOfProcessing", label: "Duration of Processing" },
      { kind: "text", key: "governingMemberState", label: "Governing Member State" },
      { kind: "text", key: "providerSecurityContact", label: "Provider Security Contact" },
    ],
  },
  software_license_agreement: {
    key: "software_license_agreement",
    filename: "Software-License-Agreement.md",
    pdfFileName: "software-license-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "duration", key: "subscriptionPeriod", label: "Subscription Period" },
      { kind: "date", key: "orderDate", label: "Order Date" },
      { kind: "date", key: "nonRenewalNoticeDate", label: "Non-Renewal Notice Date" },
      { kind: "text", key: "permittedUses", label: "Permitted Uses" },
      { kind: "text", key: "licenseLimits", label: "License Limits" },
      { kind: "text", key: "paymentProcess", label: "Payment Process" },
      { kind: "text", key: "warrantyPeriod", label: "Warranty Period" },
      { kind: "text", key: "deletionProcedure", label: "Deletion Procedure" },
      { kind: "text", key: "generalCapAmount", label: "General Cap Amount" },
      { kind: "text", key: "increasedCapAmount", label: "Increased Cap Amount" },
      { kind: "text", key: "additionalWarranties", label: "Additional Warranties" },
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Customer" },
    ],
  },
  partnership_agreement: {
    key: "partnership_agreement",
    filename: "Partnership-Agreement.md",
    pdfFileName: "partnership-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "date", key: "endDate", label: "End Date" },
      { kind: "text", key: "obligations", label: "Obligations" },
      { kind: "text", key: "territory", label: "Territory" },
      { kind: "text", key: "brandGuidelines", label: "Brand Guidelines" },
      { kind: "text", key: "paymentProcess", label: "Payment Process" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "text", key: "generalCapAmount", label: "General Cap Amount" },
      { kind: "text", key: "additionalWarranties", label: "Additional Warranties" },
      { kind: "party", key: "partyOne", label: "Company" },
      { kind: "party", key: "partyTwo", label: "Partner" },
    ],
  },
  pilot_agreement: {
    key: "pilot_agreement",
    filename: "Pilot-Agreement.md",
    pdfFileName: "pilot-agreement.pdf",
    fields: [
      { kind: "date", key: "effectiveDate", label: "Effective Date" },
      { kind: "text", key: "governingLaw", label: "Governing Law" },
      { kind: "text", key: "chosenCourts", label: "Chosen Courts" },
      { kind: "duration", key: "pilotPeriod", label: "Pilot Period" },
      { kind: "text", key: "evaluationPurposes", label: "Evaluation Purposes" },
      { kind: "text", key: "generalCapAmount", label: "General Cap Amount" },
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Customer" },
    ],
  },
  baa: {
    key: "baa",
    filename: "BAA.md",
    pdfFileName: "business-associate-agreement.pdf",
    fields: [
      { kind: "party", key: "partyOne", label: "Provider" },
      { kind: "party", key: "partyTwo", label: "Company" },
      { kind: "date", key: "baaEffectiveDate", label: "BAA Effective Date" },
      { kind: "text", key: "breachNotificationPeriod", label: "Breach Notification Period" },
      { kind: "text", key: "limitations", label: "Limitations" },
    ],
  },
  ai_addendum: {
    key: "ai_addendum",
    filename: "AI-Addendum.md",
    pdfFileName: "ai-addendum.pdf",
    fields: [
      { kind: "text", key: "trainingData", label: "Training Data" },
      { kind: "text", key: "trainingPurposes", label: "Training Purposes" },
      { kind: "text", key: "trainingRestrictions", label: "Training Restrictions" },
      { kind: "text", key: "improvementRestrictions", label: "Improvement Restrictions" },
    ],
  },
};
