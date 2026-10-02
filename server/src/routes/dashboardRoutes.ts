import { Router } from "express";
import {
  getSecureDashboard,
  getOrganizationDashboard
} from "../controllers/dashboardController.js";
import { getDashboardFacilities } from "../controllers/facilityController.js";

const dashboardRouter = Router();

dashboardRouter.get(
  "/:dashboardKey/facilities",
  getDashboardFacilities
);

dashboardRouter.get(
  "/:dashboardKey/:facilityKey",
  getSecureDashboard
);

dashboardRouter.get(
  "/:dashboardKey",
  getOrganizationDashboard
);

export { dashboardRouter };