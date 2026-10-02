const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api"
).replace(/\/$/, "");

export interface OrganizationRegistrationInput {
  organization: string;
  contactName: string;
  contactJobTitle: string;
  contactPhone: string;
  contactEmail: string;
  numberOfFacilities: number;
}

export interface OrganizationRegistrationResult {
  organizationId: number;
  orgSurveyId: number;
  surveyKey: string;
  dashboardKey: string;
}

interface RegistrationApiResponse {
  status: "ok";
  registration: OrganizationRegistrationResult;
}

interface SurveyOrganizationApiResponse {
  status: "ok";
  survey: {
    orgSurveyId: number;
    surveyId: number;
    organization: string;
    description: string | null;
    dueDate: string | null;
  };
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function registerOrganization(
  input: OrganizationRegistrationInput
): Promise<OrganizationRegistrationResult> {
  const response = await fetch(`${API_BASE_URL}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as RegistrationApiResponse;

  return body.registration;
}

export async function getSurveyOrganization(
  surveyKey: string
): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SurveyOrganizationApiResponse;

  return body.survey.organization;
}

export interface SurveyFacility {
  id: number;
  name: string;
}

interface SurveyFacilitiesApiResponse {
  status: "ok";
  facilities: SurveyFacility[];
}

export async function getSurveyFacilities(
  surveyKey: string
): Promise<SurveyFacility[]> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}/facilities`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SurveyFacilitiesApiResponse;

  return body.facilities;
}

export interface CreateParticipantInput {
  participant: string;
  facilityName: string;
  role: string | null;
  email: string | null;
  department: string | null;
  notes: string | null;
}

interface CreateParticipantApiResponse {
  status: "ok";
  participant: {
    id: number;
    facilityId: number;
    facilityName: string;
  };
}

export async function createParticipant(
  surveyKey: string,
  input: CreateParticipantInput
): Promise<{
  id: number;
  facilityId: number;
  facilityName: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}/participants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as CreateParticipantApiResponse;

  return body.participant;
}

export interface SurveyQuestion {
  id: number;
  statement: string;
  sequence: number;
  domain: {
    id: number;
    name: string;
    threshold: number;
    above: string;
    notAbove: string;
  };
  theme: {
    id: number;
    name: string;
    sequence: number;
  };
}

export interface SurveyDetails {
  orgSurveyId: number;
  surveyId: number;
  organization: string;
  description: string | null;
  dueDate: string | null;
  questions: SurveyQuestion[];
}

interface SurveyApiResponse {
  status: "ok";
  survey: SurveyDetails;
}

export async function getSurvey(
  surveyKey: string
): Promise<SurveyDetails> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SurveyApiResponse;

  return body.survey;
}

export interface SurveyResponseInput {
  statementId: number;
  value: number;
}

interface SaveSurveyResponsesApiResponse {
  status: "ok";
  savedCount: number;
}

export async function saveSurveyResponses(
  surveyKey: string,
  participantId: number,
  responses: SurveyResponseInput[]
): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}/responses`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        participantId,
        responses
      })
    }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as SaveSurveyResponsesApiResponse;

  return body.savedCount;
}

export interface ParticipantSurveyResponse {
  statementId: number;
  value: number;
  responseDate: string;
}

interface ParticipantResponsesApiResponse {
  status: "ok";
  participantId: number;
  responses: ParticipantSurveyResponse[];
}

export async function getParticipantResponses(
  surveyKey: string,
  participantId: number
): Promise<ParticipantSurveyResponse[]> {
  const response = await fetch(
    `${API_BASE_URL}/surveys/${encodeURIComponent(surveyKey)}/participants/${participantId}/responses`
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const body = (await response.json()) as ParticipantResponsesApiResponse;

  return body.responses;
}

export interface DashboardQuestion {
  statementId: number;
  statement: string;
  domain: string;
  theme: string;
  averageScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  responseCount: number;
  swotCategory: "Strength" | "Weakness" | "Opportunity" | "Threat";
  distribution: Record<string, number>;
}

export interface DashboardRespondent {
  anonymousId: string;
  facilityId: number;
  facility: string;
  department: string | null;
  submittedAt: string | null;
  answeredCount: number;
}

export interface DashboardSummary {
  respondents: number;
  questionsAnalyzed: number;
  overallScore: number | null;
  strengths: number;
  weaknesses: number;
  opportunities: number;
  threats: number;
  swotIndex: number;
  questions: DashboardQuestion[];
  respondentDetails: DashboardRespondent[];
}

export interface DashboardFacility {
  key: string;
  name: string;
}

interface DashboardFacilitiesApiResponse {
  status: "ok";
  facilities: DashboardFacility[];
}

export async function getDashboardFacilities(
  dashboardKey: string
): Promise<DashboardFacility[]> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/${encodeURIComponent(dashboardKey)}/facilities`
  );

  if (!response.ok) {
    throw new Error("Unable to load dashboard facilities");
  }

  const body = (await response.json()) as DashboardFacilitiesApiResponse;

  return body.facilities;
}


export interface SecureDashboardApiResponse {
  status: "ok";
  organizationName: string;
  dashboard: DashboardSummary;
}
export async function getSecureDashboard(
  dashboardKey: string,
  facilityKey: string
): Promise<SecureDashboardApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/${encodeURIComponent(dashboardKey)}/${encodeURIComponent(facilityKey)}`
  );

  if (!response.ok) {
    throw new Error("Unable to load dashboard");
  }

  return response.json();
}
export async function getOrganizationDashboard(
  dashboardKey: string
): Promise<SecureDashboardApiResponse> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/${encodeURIComponent(dashboardKey)}`
  );

  if (!response.ok) {
    throw new Error("Unable to load dashboard");
  }

  return response.json();
}