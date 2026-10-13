import nodemailer from "nodemailer";

import { environment } from "../config/environment.js";

export interface SendSurveyInvitationInput {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  surveyKey: string;
}

function getTransporter() {
  if (!environment.smtpHost || !environment.smtpPort) {
    throw new Error("SMTP configuration is incomplete");
  }

  const hasUsername = Boolean(environment.smtpUser);
  const hasPassword = Boolean(environment.smtpPassword);

  if (hasUsername !== hasPassword) {
    throw new Error(
      "SMTP_USER and SMTP_PASSWORD must either both be configured or both be omitted"
    );
  }

  return nodemailer.createTransport({
    host: environment.smtpHost,
    port: environment.smtpPort,
    secure: environment.smtpPort === 465,
    auth:
      environment.smtpUser && environment.smtpPassword
        ? {
            user: environment.smtpUser,
            pass: environment.smtpPassword
          }
        : undefined
  });
}

function getSurveyUrl(surveyKey: string): string {
  if (!environment.appBaseUrl) {
    throw new Error("APP_BASE_URL is not configured");
  }

  const baseUrl = environment.appBaseUrl.replace(/\/$/, "");

  return `${baseUrl}/assess/${encodeURIComponent(surveyKey)}`;
}

export async function sendSurveyInvitation(
  input: SendSurveyInvitationInput
): Promise<void> {
  if (!environment.mailFrom) {
    throw new Error("MAIL_FROM is not configured");
  }

  const surveyUrl = getSurveyUrl(input.surveyKey);
  const transporter = getTransporter();

  await transporter.sendMail({
    from: environment.mailFrom,
    to: input.recipientEmail,
    subject: `${input.organizationName} SWOT Assessment`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      `Your SWOT assessment for ${input.organizationName} is ready.`,
      "",
      `Survey link: ${surveyUrl}`,
      "",
      "You can share this link with the participants who will complete the assessment."
    ].join("\n"),
    html: `
      <p>Hello ${input.recipientName},</p>
      <p>Your SWOT assessment for <strong>${input.organizationName}</strong> is ready.</p>
      <p>
        <a href="${surveyUrl}">Open SWOT Assessment</a>
      </p>
      <p>You can share this link with the participants who will complete the assessment.</p>
    `
  });
}