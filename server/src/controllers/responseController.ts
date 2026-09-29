import type { Request, Response } from "express";
import { z } from "zod";
import {
  loadParticipantResponses,
  submitSurveyResponses
} from "../services/responseService.js";

const surveyKeySchema = z.string().uuid();

const participantIdSchema = z.coerce.number().int().positive();

const responseSchema = z.object({
  participantId: z.number().int().positive(),
  responses: z
    .array(
      z.object({
        statementId: z.number().int().positive(),
        value: z.number().int().min(1).max(6)
      })
    )
    .min(1)
});

export async function saveSurveyResponses(
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

  const parsedBody = responseSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid response data",
      errors: parsedBody.error.flatten().fieldErrors
    });
    return;
  }

  const statementIds = parsedBody.data.responses.map(
    (response) => response.statementId
  );

  if (new Set(statementIds).size !== statementIds.length) {
    res.status(400).json({
      status: "error",
      message: "Duplicate statement IDs are not allowed"
    });
    return;
  }

  try {
    const result = await submitSurveyResponses({
      surveyKey: parsedSurveyKey.data,
      participantId: parsedBody.data.participantId,
      responses: parsedBody.data.responses
    });

    if (!result) {
      res.status(400).json({
        status: "error",
        message: "Participant, survey, or statement is invalid"
      });
      return;
    }

    res.status(200).json({
      status: "ok",
      savedCount: result.savedCount
    });
  } catch (error) {
    console.error("Survey response save failed:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to save survey responses"
    });
  }
}

export async function getParticipantResponses(
  req: Request,
  res: Response
): Promise<void> {
  const parsedSurveyKey = surveyKeySchema.safeParse(
    req.params.surveyKey
  );

  const parsedParticipantId = participantIdSchema.safeParse(
    req.params.participantId
  );

  if (!parsedSurveyKey.success || !parsedParticipantId.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid survey key or participant ID"
    });
    return;
  }

  try {
    const responses = await loadParticipantResponses(
      parsedSurveyKey.data,
      parsedParticipantId.data
    );

    if (responses === null) {
      res.status(404).json({
        status: "error",
        message: "Survey or participant not found"
      });
      return;
    }

    res.status(200).json({
      status: "ok",
      participantId: parsedParticipantId.data,
      responses
    });
  } catch (error) {
    console.error("Survey response retrieval failed:", error);

    res.status(500).json({
      status: "error",
      message: "Unable to retrieve survey responses"
    });
  }
}
