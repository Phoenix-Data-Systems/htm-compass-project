import {
  createOrganizationRegistration,
  type CreateOrganizationRegistrationInput
} from "../repositories/registrationRepository.js";
import { environment } from "../config/environment.js";
import { sendSurveyInvitation } from "./emailService.js";

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

function isEmailConfigured(): boolean {
  return Boolean(
    environment.appBaseUrl &&
      environment.acsEmailEndpoint &&
      environment.acsEmailSender
  );
}

export async function registerOrganization(
  input: RegisterOrganizationInput
): Promise<RegisterOrganizationResult> {
  const registrationInput: CreateOrganizationRegistrationInput = {
    ...input,
    surveyId: CURRENT_SURVEY_ID,
    initialStatusId: SCHEDULED_STATUS_ID
  };

  const registration = await createOrganizationRegistration(registrationInput);

  if (isEmailConfigured()) {
    try {
      await sendSurveyInvitation({
        recipientEmail: input.contactEmail,
        recipientName: input.contactName,
        organizationName: input.organization,
        surveyKey: registration.surveyKey
      });
    } catch {
      console.error("Failed to send survey invitation email", {
        organizationId: registration.organizationId
      });
    }
  }

  return registration;
}
