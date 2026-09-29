import type { Request, Response } from "express";
import { z } from "zod";
import { registerParticipant } from "../services/participantService.js";

const surveyKeySchema = z.string().uuid();

const participantSchema = z.object({
  participant: z.string().trim().min(1).max(100),
  facilityId: z.number().int().positive(),
  role: z.string().trim().max(50).optional().nullable(),
  email: z
    .union([
      z.string().trim().max(50).email(),
      z.literal("")
    ])
    .optional()
    .nullable(),
  department: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

function normalizeOptional(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function createParticipantForSurvey(
  req: Request,
  res: Response
): Promise<void> {
  const parsedSurveyKey = surveyKeySchema.safeParse(
    req.params.surveyKey
  );

  if (!parsedSurveyKey.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid survey key"
    });
    return;
  }

  const parsedBody = participantSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid participant data",
      errors: parsedBody.error.flatten().fieldErrors
    });
    return;
  }

  try {
    const participant = await registerParticipant({
      surveyKey: parsedSurveyKey.data,
      participant: parsedBody.data.participant,
      facilityId: parsedBody.data.facilityId,
      role: normalizeOptional(parsedBody.data.role),
      email: normalizeOptional(parsedBody.data.email),
      department: normalizeOptional(parsedBody.data.department),
      notes: normalizeOptional(parsedBody.data.notes)
    });

    if (!participant) {
      res.status(404).json({
        status: "error",
        message: "Survey or facility not found"
      });
      return;
    }

    res.status(201).json({
      status: "ok",
      participant
    });
  } catch (error) {
    console.error("Participant creation failed:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to create participant"
    });
  }
}
