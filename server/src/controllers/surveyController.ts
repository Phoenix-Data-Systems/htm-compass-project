import type { Request, Response } from "express";
import { z } from "zod";
import { loadSurvey } from "../services/surveyService.js";

const surveyKeySchema = z.string().uuid();

export async function getSurvey(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = surveyKeySchema.safeParse(req.params.surveyKey);

  if (!parsed.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid survey key"
    });
    return;
  }

  const survey = await loadSurvey(parsed.data);

  if (!survey) {
    res.status(404).json({
      status: "error",
      message: "Survey not found"
    });
    return;
  }

  res.status(200).json({
    status: "ok",
    survey
  });
}
