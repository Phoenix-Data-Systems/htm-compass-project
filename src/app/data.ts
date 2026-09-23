// ---- SWOT output tags ----

export type SWOTTag = "strengths" | "weaknesses" | "opportunities" | "threats";

export const SWOT_TAGS: SWOTTag[] = ["strengths", "weaknesses", "opportunities", "threats"];

export const SWOT_META: Record<
  SWOTTag,
  { label: string; color: string; bgColor: string; borderColor: string; hexColor: string; description: string }
> = {
  strengths: {
    label: "Strengths",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    hexColor: "#16a34a",
    description: "Internal capabilities scoring positive (avg > 3.5) — 4 mild · 5 clear · 6 critical",
  },
  weaknesses: {
    label: "Weaknesses",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
    hexColor: "#dc2626",
    description: "Internal capabilities scoring negative (avg ≤ 3.5) — 3 mild · 2 clear · 1 critical",
  },
  opportunities: {
    label: "Opportunities",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    hexColor: "#2563eb",
    description: "External conditions scoring positive (avg > 3.5) — 4 mild · 5 clear · 6 critical",
  },
  threats: {
    label: "Threats",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    hexColor: "#ea580c",
    description: "External factors scoring negative (avg ≤ 3.5) — 3 mild · 2 clear · 1 critical",
  },
};

// ---- Score intensity ----

export type ScoreIntensity =
  | "critical-positive"
  | "clear-positive"
  | "mild-positive"
  | "mild-negative"
  | "clear-negative"
  | "critical-negative";

export const INTENSITY_META: Record<ScoreIntensity, { label: string; shortLabel: string; color: string }> = {
  "critical-positive": { label: "Critical Positive", shortLabel: "Critical", color: "#15803d" },
  "clear-positive":    { label: "Clear Positive",    shortLabel: "Clear",    color: "#16a34a" },
  "mild-positive":     { label: "Mild Positive",     shortLabel: "Mild",     color: "#65a30d" },
  "mild-negative":     { label: "Mild Negative",     shortLabel: "Mild",     color: "#d97706" },
  "clear-negative":    { label: "Clear Negative",    shortLabel: "Clear",    color: "#dc2626" },
  "critical-negative": { label: "Critical Negative", shortLabel: "Critical", color: "#9f1239" },
};

/**
 * Maps an average score to an intensity level.
 * Positive: score 4 (mild) · 5 (clear) · 6 (critical)
 * Negative: score 3 (mild) · 2 (clear) · 1 (critical)
 * Threshold between positive/negative: 3.5
 */
export function getScoreIntensity(avg: number): ScoreIntensity {
  if (avg >= 5.5) return "critical-positive";
  if (avg >= 4.5) return "clear-positive";
  if (avg > 3.5)  return "mild-positive";
  if (avg > 2.5)  return "mild-negative";
  if (avg >= 1.5) return "clear-negative";
  return "critical-negative";
}

/**
 * Classification-aware SWOT tagging.
 * Internal: avg > 3.5 → Strength, ≤ 3.5 → Weakness
 * External: avg > 3.5 → Opportunity, ≤ 3.5 → Threat
 * Individual score map: 4 mild · 5 clear · 6 critical positive; 3 mild · 2 clear · 1 critical negative
 */
export function getPrimaryTagForScore(avg: number, classification: "internal" | "external"): SWOTTag {
  if (avg > 3.5) return classification === "internal" ? "strengths" : "opportunities";
  return classification === "internal" ? "weaknesses" : "threats";
}

export function getTagsForScore(avg: number, classification: "internal" | "external"): SWOTTag[] {
  return [getPrimaryTagForScore(avg, classification)];
}

// ---- Questions ----

export interface Question {
  id: string;
  text: string;
  classification: "internal" | "external"; // swot_domain from JSON
  theme: string;                            // grouping / filter tag
  scoreDirection: "positive" | "negative"; // positive = high score is good
}

export const QUESTIONS: Question[] = [
  // Theme: Corrective Maintenance
  { id: "S001", text: "The corrective maintenance request process is clearly defined and effective.", classification: "internal", theme: "Corrective Maintenance", scoreDirection: "positive" },
  { id: "S002", text: "Corrective maintenance response times are tracked and reviewed for trends.", classification: "internal", theme: "Corrective Maintenance", scoreDirection: "positive" },
  { id: "S003", text: "Service response expectations for clinical staff are formally defined and communicated.", classification: "internal", theme: "Corrective Maintenance", scoreDirection: "positive" },
  { id: "S004", text: "The current CMMS coding structure for work order request, result, and fault support needed corrective maintenance reporting.", classification: "internal", theme: "Corrective Maintenance", scoreDirection: "positive" },
  { id: "S005", text: "Corrective maintenance turnaround times are tracked and analyzed effectively.", classification: "internal", theme: "Corrective Maintenance", scoreDirection: "positive" },
  // Theme: Preventative Maintenance
  { id: "S006", text: "Equipment risk classification, including life support, high-risk, and critical designations, is determined using a defined and consistently applied methodology.", classification: "internal", theme: "Preventative Maintenance", scoreDirection: "positive" },
  { id: "S007", text: "Device eligibility for an AEM program is determined using defined data elements and risk-scoring criteria.", classification: "internal", theme: "Preventative Maintenance", scoreDirection: "positive" },
  { id: "S008", text: "Responsibility for performing risk classification on new devices entering the hospital is clearly assigned.", classification: "internal", theme: "Preventative Maintenance", scoreDirection: "positive" },
  { id: "S009", text: "Assets included in an AEM program are clearly identified within the asset management system.", classification: "internal", theme: "Preventative Maintenance", scoreDirection: "positive" },
  { id: "S010", text: "The department has an effective mechanism to monitor whether failure rates change after devices are placed in an AEM program.", classification: "internal", theme: "Preventative Maintenance", scoreDirection: "positive" },
  { id: "S011", text: "Preventive maintenance workload is distributed evenly across available staff or work groups.", classification: "external", theme: "Preventative Maintenance", scoreDirection: "positive" },
  // Theme: Regulatory Compliance
  { id: "S012", text: "The department maintains the MEMP in a current state.", classification: "external", theme: "Regulatory Compliance", scoreDirection: "positive" },
  { id: "S013", text: "The department effectively follows the requirements of the MEMP.", classification: "external", theme: "Regulatory Compliance", scoreDirection: "positive" },
  { id: "S014", text: "Employees demonstrate understanding of their individual responsibilities for MEMP compliance.", classification: "external", theme: "Regulatory Compliance", scoreDirection: "positive" },
  // Theme: Safety-Recalls and Hazards
  { id: "S015", text: "Recalls and hazard alerts are managed through a closed-loop process that verifies completion and resolution.", classification: "external", theme: "Safety-Recalls and Hazards", scoreDirection: "positive" },
  // Theme: Equipment Planning and Acquiring New Assets
  { id: "S016", text: "The department is effectively notified when any new equipment (purchased, loaner, rental, demo, and patient-owned) is scheduled to enter the facility.", classification: "internal", theme: "Equipment Planning and Acquiring New Assets", scoreDirection: "positive" },
  { id: "S017", text: "HTM is appropriately involved in projects, renovations, and buildouts.", classification: "internal", theme: "Equipment Planning and Acquiring New Assets", scoreDirection: "positive" },
  { id: "S018", text: "The validation process for entering new equipment into the system is clearly defined and consistently followed.", classification: "internal", theme: "Equipment Planning and Acquiring New Assets", scoreDirection: "positive" },
  { id: "S019", text: "Acquisition cost, network connection details, including IP address, MAC address, operating system, and other required information, are documented consistently.", classification: "internal", theme: "Equipment Planning and Acquiring New Assets", scoreDirection: "positive" },
  // Theme: Department Performance
  { id: "S020", text: "Documented labor is accurately captured and reviewed for trends across modality, technicians, and facilities.", classification: "internal", theme: "Department Performance", scoreDirection: "positive" },
  { id: "S021", text: "Preventive maintenance and corrective maintenance labor times are benchmarked against industry standards or relevant external comparators.", classification: "external", theme: "Department Performance", scoreDirection: "positive" },
  { id: "S022", text: "Critical equipment downtime reports are reviewed and used to evaluate service performance.", classification: "internal", theme: "Department Performance", scoreDirection: "positive" },
  // Theme: Employee Engagement
  { id: "S023", text: "Employee goals are reviewed periodically throughout the year.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S024", text: "Employees clearly understand their daily and weekly performance responsibilities.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S025", text: "Employees are able to communicate with supervisors about operational observations and improvement opportunities.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S026", text: "The department has an effective orientation and onboarding process.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S027", text: "The department has a career ladder that appropriately supports staff development.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S028", text: "The department has a defined succession planning process.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  { id: "S029", text: "Employees understand how their roles contribute to the department's mission, vision, and goals.", classification: "internal", theme: "Employee Engagement", scoreDirection: "positive" },
  // Theme: Capital Equipment Replacement Planning
  { id: "S030", text: "Ancillary costs, such as training, test equipment, implementation needs, and related expenses, are incorporated into replacement planning.", classification: "internal", theme: "Capital Equipment Replacement Planning", scoreDirection: "positive" },
  { id: "S031", text: "Equipment replacement decisions are made using defined criteria and a consistent decision-making process.", classification: "internal", theme: "Capital Equipment Replacement Planning", scoreDirection: "positive" },
  { id: "S032", text: "HTM plays a significant role in the organization's capital replacement planning process.", classification: "internal", theme: "Capital Equipment Replacement Planning", scoreDirection: "positive" },
  // Theme: Customer Satisfaction
  { id: "S033", text: "Customer satisfaction surveys that assess all aspects of HTM service delivery are conducted on a regular basis.", classification: "internal", theme: "Customer Satisfaction", scoreDirection: "positive" },
  { id: "S034", text: "Customer satisfaction survey results are reviewed with an eye on continuous process improvement.", classification: "internal", theme: "Customer Satisfaction", scoreDirection: "positive" },
  { id: "S035", text: "Poor customer satisfaction survey results translate into comprehensive action plans for remediation.", classification: "internal", theme: "Customer Satisfaction", scoreDirection: "positive" },
  // Theme: Policies
  { id: "S036", text: "Department policies are well-documented and readily available.", classification: "internal", theme: "Policies", scoreDirection: "positive" },
  { id: "S037", text: "Department policies are reviewed and updated on a regular annual schedule.", classification: "internal", theme: "Policies", scoreDirection: "positive" },
  { id: "S038", text: "Employees consistently review and reaffirm applicable policies each year.", classification: "internal", theme: "Policies", scoreDirection: "positive" },
  { id: "S039", text: "Policy compliance is consistently monitored and enforced.", classification: "internal", theme: "Policies", scoreDirection: "positive" },
  // Theme: Productivity
  { id: "S040", text: "Cost of service ratio is accurately determined and monitored.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  { id: "S041", text: "Cost of service ratio is analyzed by hospital, technician, device type, and comparable departments as applicable.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  { id: "S042", text: "The methodology for determining cost of service ratio is clearly defined and consistently applied.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  { id: "S043", text: "Ratios that fall outside of established norms are analyzed for root cause and remediation.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  { id: "S044", text: "Preventive maintenance completion benchmarks are established and monitored.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  { id: "S045", text: "Corrective maintenance completion benchmarks are established and monitored.", classification: "internal", theme: "Productivity", scoreDirection: "positive" },
  // Theme: Communication
  { id: "S046", text: "The department has a clearly defined and effective communication policy for staff, customer, and executive leadership updates.", classification: "internal", theme: "Communication", scoreDirection: "positive" },
  // Theme: Safety-EOC-Rounds
  { id: "S047", text: "Safety rounds are used effectively to proactively identify nonconforming equipment.", classification: "internal", theme: "Safety-EOC-Rounds", scoreDirection: "positive" },
  { id: "S048", text: "Safety rounds are a closed-loop process that assign nonconformance items for remediation and feedback to the appropriate committee.", classification: "internal", theme: "Safety-EOC-Rounds", scoreDirection: "positive" },
  // Theme: Inventory Management
  { id: "S049", text: "Inventory validation activities are performed periodically throughout the year.", classification: "internal", theme: "Inventory Management", scoreDirection: "positive" },
  { id: "S050", text: "Device nomenclature, including manufacturer, model, and device category, is clean, standardized, and consistently applied.", classification: "internal", theme: "Inventory Management", scoreDirection: "positive" },
  // Theme: Disposition Management
  { id: "S051", text: "The department has a current and clearly defined asset disposition process that includes transfers, sales, trade-ins, donations, and disposals.", classification: "internal", theme: "Disposition Management", scoreDirection: "positive" },
  { id: "S052", text: "Assets are defined and prioritized for disposition using consistent criteria.", classification: "internal", theme: "Disposition Management", scoreDirection: "positive" },
  { id: "S053", text: "Final asset dispositions are accurately tracked and recorded.", classification: "internal", theme: "Disposition Management", scoreDirection: "positive" },
  { id: "S054", text: "The annual monetary value of all asset dispositions is tracked and reviewed.", classification: "internal", theme: "Disposition Management", scoreDirection: "positive" },
  // Theme: Parts Management
  { id: "S055", text: "The parts ordering process is clearly defined and effectively addresses centralized and decentralized purchasing responsibilities.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S056", text: "Parts usage and costs are accurately tracked and reviewed.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S057", text: "Parts needs for preventive maintenance work are forecasted using a defined process.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S058", text: "Equipment downtime attributable to waiting for parts is tracked and analyzed.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S059", text: "Ancillary parts costs, including rush shipping and related expenses, are tracked and reviewed.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S060", text: "Part requests are aggregated by vendor.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  { id: "S061", text: "Parts quality relative to DOAs, late part deliveries, wrong part deliveries, and premature failures are assessed on an ongoing basis.", classification: "internal", theme: "Parts Management", scoreDirection: "positive" },
  // Theme: Safety-User Error and Patient Incidents
  { id: "S062", text: "User-related error trends are tracked and analyzed by model, department, or other relevant category.", classification: "internal", theme: "Safety-User Error and Patient Incidents", scoreDirection: "positive" },
  { id: "S063", text: "User-related error trends are escalated to nursing, nursing education, or other appropriate stakeholders through a defined notification process.", classification: "internal", theme: "Safety-User Error and Patient Incidents", scoreDirection: "positive" },
  { id: "S064", text: "The department participates appropriately in Risk Management's annual FMEA process.", classification: "internal", theme: "Safety-User Error and Patient Incidents", scoreDirection: "positive" },
  { id: "S065", text: "Equipment, including disposables, involved in a patient incident follows a defined and effective process for investigation and root cause analysis.", classification: "internal", theme: "Safety-User Error and Patient Incidents", scoreDirection: "positive" },
  // Theme: Service Vendor Compliance-Contract Management
  { id: "S066", text: "The process for purchasing new and renewing existing service contracts is clearly defined and effective.", classification: "internal", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S067", text: "HTM is appropriately represented in service contract decision-making.", classification: "internal", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S068", text: "Service contract information is accurately maintained and identifiable in the current CMMS.", classification: "internal", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S069", text: "Service vendors are evaluated to ensure they meet applicable regulatory requirements.", classification: "external", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S070", text: "Vendor service performance is reviewed to determine overall satisfaction and effectiveness.", classification: "external", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S071", text: "Completed vendor service activities are received, documented, and tracked consistently.", classification: "internal", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  { id: "S072", text: "Contract value analysis processes effectively support decisions about contracted versus in-house service.", classification: "internal", theme: "Service Vendor Compliance-Contract Management", scoreDirection: "positive" },
  // Theme: Other CE Roles
  { id: "S073", text: "HTM is appropriately involved in any and all technology management opportunities in your organization.", classification: "internal", theme: "Other CE Roles", scoreDirection: "positive" },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;

// ---- Data model ----

export interface ParticipantInfo {
  token: string;
  anonymousId: string;
  organization: string;
  hospital: string;
  hospitalSlug: string;
  department: string;
  submittedAt?: string;
}

export interface SurveyRecord {
  participant: ParticipantInfo;
  answers: Record<string, number>;
  completed: boolean;
  questionIds: string[]; // shuffled subset shown to this participant
}

// ---- Helpers ----

export function generateToken(): string {
  return crypto.randomUUID();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Hashes name, email, and jobTitle together — none are stored in plaintext. */
export function generateAnonymousId(name: string, email: string, jobTitle: string): string {
  const str = (name + email + jobTitle).toLowerCase();
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return `ANON-${hash.toString(36).toUpperCase().padStart(6, "0")}`;
}

/** Fisher-Yates shuffle — returns all question IDs in random order. */
export function selectRandomQuestions(count: number = QUESTIONS.length): string[] {
  const ids = QUESTIONS.map((q) => q.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, Math.min(count, ids.length));
}

// ---- Storage ----

const STORAGE_KEY = "swot_survey_data_v2";

interface StorageShape {
  records: Record<string, SurveyRecord>;
  hospitalIndex: Record<string, string[]>;
}

function readStorage(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { records: {}, hospitalIndex: {} };
}

function writeStorage(data: StorageShape) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveRecord(record: SurveyRecord) {
  const data = readStorage();
  data.records[record.participant.token] = record;
  const slug = record.participant.hospitalSlug;
  if (!data.hospitalIndex[slug]) data.hospitalIndex[slug] = [];
  if (!data.hospitalIndex[slug].includes(record.participant.token)) {
    data.hospitalIndex[slug].push(record.participant.token);
  }
  writeStorage(data);
}

export function getRecord(token: string): SurveyRecord | null {
  return readStorage().records[token] ?? null;
}

export function getHospitalRecords(hospitalSlug: string): SurveyRecord[] {
  const data = readStorage();
  const tokens = data.hospitalIndex[hospitalSlug] ?? [];
  return tokens
    .map((t) => data.records[t])
    .filter(Boolean)
    .filter((r) => r.completed);
}

export function getAllHospitals(): { slug: string; name: string; count: number }[] {
  const data = readStorage();
  return Object.entries(data.hospitalIndex)
    .map(([slug, tokens]) => {
      const completed = tokens.filter((t) => data.records[t]?.completed).length;
      const name = data.records[tokens[0]]?.participant.hospital ?? slug;
      return { slug, name, count: completed };
    })
    .filter((h) => h.count > 0);
}

// ---- Stats ----

export function calcStats(values: number[]) {
  if (!values.length) return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  const avg = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  return {
    avg: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: sorted.length,
  };
}

// ---- Aggregation ----

export interface QuestionStat {
  question: Question;
  scores: number[];
  avg: number;
  stats: ReturnType<typeof calcStats>;
  tags: SWOTTag[];
  primaryTag: SWOTTag;
  intensity: ScoreIntensity;
}

export interface TagSummary {
  tag: SWOTTag;
  questions: QuestionStat[];
  stats: ReturnType<typeof calcStats>;
}

export function aggregateByTag(records: SurveyRecord[]): {
  questionStats: QuestionStat[];
  tagSummaries: TagSummary[];
} {
  const scoreMap: Record<string, number[]> = {};
  for (const q of QUESTIONS) scoreMap[q.id] = [];
  for (const record of records) {
    for (const q of QUESTIONS) {
      const val = record.answers[q.id];
      if (val !== undefined) scoreMap[q.id].push(val);
    }
  }

  const questionStats: QuestionStat[] = QUESTIONS.map((q) => {
    const scores = scoreMap[q.id];
    const stats = calcStats(scores);
    const primaryTag = scores.length ? getPrimaryTagForScore(stats.avg, q.classification) : "weaknesses";
    const intensity = scores.length ? getScoreIntensity(stats.avg) : "mild-negative";
    return {
      question: q,
      scores,
      avg: stats.avg,
      stats,
      tags: scores.length ? getTagsForScore(stats.avg, q.classification) : [],
      primaryTag,
      intensity,
    };
  });

  const byTag: Record<SWOTTag, QuestionStat[]> = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
  };
  for (const qs of questionStats) {
    if (!qs.scores.length) continue;
    for (const tag of qs.tags) byTag[tag].push(qs);
  }

  const tagSummaries: TagSummary[] = SWOT_TAGS.map((tag) => ({
    tag,
    questions: byTag[tag],
    stats: calcStats(byTag[tag].flatMap((q) => q.scores)),
  }));

  return { questionStats, tagSummaries };
}
