import type { Request, Response } from "express";
import { z } from "zod";
import { loadSurveyFacilities } from "../services/facilityService.js";

const surveyKeySchema = z.string().uuid();

export async function getSurveyFacilities(
  req: Request,
  res: Response
) {
  const parsedKey = surveyKeySchema.safeParse(req.params.surveyKey);

  if (!parsedKey.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid survey key"
    });
  }

  try {
    const facilities = await loadSurveyFacilities(parsedKey.data);

    return res.json({
      status: "ok",
      facilities
    });
  } catch (error) {
    console.error("Unable to load survey facilities:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load facilities"
    });
  }
}
