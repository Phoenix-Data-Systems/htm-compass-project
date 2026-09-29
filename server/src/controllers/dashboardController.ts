import type { Request, Response } from "express";
import { z } from "zod";
import { loadDashboardSummary } from "../services/dashboardService.js";

const surveyKeySchema = z.string().uuid();

export async function getDashboard(
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

  const facilityId = Number(req.query.facilityId);

  if (!Number.isInteger(facilityId) || facilityId <= 0) {
    return res.status(400).json({
      status: "error",
      message: "A valid facilityId is required"
    });
  }

  try {
    const dashboard = await loadDashboardSummary(
      parsedKey.data,
      facilityId
    );

    if (!dashboard) {
      return res.status(404).json({
        status: "error",
        message: "Dashboard not found"
      });
    }

    return res.json({
      status: "ok",
      dashboard
    });
  } catch (error) {
    console.error("Unable to load dashboard:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load dashboard"
    });
  }
}
