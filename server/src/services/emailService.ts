import {
  EmailClient,
  KnownEmailSendStatus
} from "@azure/communication-email";
import { ManagedIdentityCredential } from "@azure/identity";

import { environment } from "../config/environment.js";

export interface SendSurveyInvitationInput {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  surveyKey: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function getSurveyUrl(surveyKey: string): string {
  if (!environment.appBaseUrl) {
    throw new Error("APP_BASE_URL is not configured");
  }

  const baseUrl = environment.appBaseUrl.replace(/\/$/, "");

  return `${baseUrl}/assess/${encodeURIComponent(surveyKey)}`;
}

function getEmailClient(): EmailClient {
  if (!environment.acsEmailEndpoint) {
    throw new Error("ACS_EMAIL_ENDPOINT is not configured");
  }

  return new EmailClient(
    environment.acsEmailEndpoint,
    new ManagedIdentityCredential()
  );
}

export async function sendSurveyInvitation(
  input: SendSurveyInvitationInput
): Promise<void> {
  if (!environment.acsEmailSender) {
    throw new Error("ACS_EMAIL_SENDER is not configured");
  }

  const recipientName = sanitizeHeaderValue(input.recipientName);
  const organizationName = sanitizeHeaderValue(input.organizationName);
  const surveyUrl = getSurveyUrl(input.surveyKey);

  const client = getEmailClient();

  const poller = await client.beginSend({
    senderAddress: environment.acsEmailSender,
    recipients: {
      to: [
        {
          address: input.recipientEmail,
          displayName: recipientName
        }
      ]
    },
    content: {
      subject: `${organizationName} SWOT Assessment`,
      plainText: [
        `Hello ${recipientName},`,
        "",
        `Your SWOT assessment for ${organizationName} is ready.`,
        "",
        `Survey link: ${surveyUrl}`,
        "",
        "You can share this link with the participants who will complete the assessment."
      ].join("\n"),
      html: `
        <p>Hello ${escapeHtml(recipientName)},</p>
        <p>Your SWOT assessment for <strong>${escapeHtml(organizationName)}</strong> is ready.</p>
        <p>
          <a href="${escapeHtml(surveyUrl)}">Open SWOT Assessment</a>
        </p>
        <p>You can share this link with the participants who will complete the assessment.</p>
      `
    }
  });

  const result = await poller.pollUntilDone();

  if (result.status !== KnownEmailSendStatus.Succeeded) {
    throw new Error("Azure Communication Services email send failed");
  }
}
