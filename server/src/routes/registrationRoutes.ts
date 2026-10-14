import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { createOrganizationRegistration } from "../controllers/registrationController.js";

const registrationRouter = Router();

const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many registration attempts. Please try again later."
  }
});

registrationRouter.post(
  "/",
  registrationRateLimiter,
  createOrganizationRegistration
);

export { registrationRouter };
