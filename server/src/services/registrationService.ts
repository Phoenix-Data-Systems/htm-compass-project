import {
  createOrganizationRegistration,
  type CreateOrganizationRegistrationInput
} from "../repositories/registrationRepository.js";

export interface RegisterOrganizationInput {
  organization: string;
  contactName: string;
  contactJobTitle: string;
  contactPhone: string;
  contactEmail: string;
  numberOfFacilities: number;
}

export interface RegisterOrganizationResult {
  organizationId: number;
  orgSurveyId: number;
  surveyKey: string;
  dashboardKey: string;
}

const CURRENT_SURVEY_ID = 1;
const SCHEDULED_STATUS_ID = 1;

export async function registerOrganization(
  input: RegisterOrganizationInput
): Promise<RegisterOrganizationResult> {
  const registrationInput: CreateOrganizationRegistrationInput = {
    ...input,
    surveyId: CURRENT_SURVEY_ID,
    initialStatusId: SCHEDULED_STATUS_ID
  };

  return createOrganizationRegistration(registrationInput);
}
