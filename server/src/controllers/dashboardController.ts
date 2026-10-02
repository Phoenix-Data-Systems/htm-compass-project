import type { Request, Response } from "express";
import { z } from "zod";
import {
  loadSecureDashboardSummary,
  loadOrganizationDashboardSummary
} from "../services/dashboardService.js";

const surveyKeySchema = z.string().uuid();

export async function getSecureDashboard(
  req: Request,
  res: Response
) {
  const parsedDashboardKey = surveyKeySchema.safeParse(
    req.params.dashboardKey
  );

  const parsedFacilityKey = surveyKeySchema.safeParse(
    req.params.facilityKey
  );

  if (!parsedDashboardKey.success || !parsedFacilityKey.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid dashboard access link"
    });
  }

  try {
    const result = await loadSecureDashboardSummary(
      parsedDashboardKey.data,
      parsedFacilityKey.data
    );

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Dashboard not found"
      });
    }

    return res.json({
      status: "ok",
      organizationName: result.organizationName,
      dashboard: result.dashboard
    });
  } catch (error) {
    console.error("Unable to load secure dashboard:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load dashboard"
    });
  }
}
export async function getOrganizationDashboard(
  req: Request,
  res: Response
) {
  const parsedDashboardKey = surveyKeySchema.safeParse(
    req.params.dashboardKey
  );

  if (!parsedDashboardKey.success) {
    return res.status(400).json({
      status: "error",
      message: "Invalid dashboard access link"
    });
  }

  try {
    const result = await loadOrganizationDashboardSummary(
      parsedDashboardKey.data
    );

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Dashboard not found"
      });
    }

    return res.json({
      status: "ok",
      organizationName: result.organizationName,
      dashboard: result.dashboard
    });
  } catch (error) {
    console.error("Unable to load organization dashboard:", error);

    return res.status(500).json({
      status: "error",
      message: "Unable to load dashboard"
    });
  }
}