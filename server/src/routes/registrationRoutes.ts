import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { createOrganizationRegistration } from "../controllers/registrationController.js";

const registrationRouter = Router();

const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const rawIp = req.ip ?? req.socket.remoteAddress ?? "unknown";

    const normalizedIp = rawIp.replace(
      /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/,
      "$1"
    );

    return normalizedIp === "unknown"
      ? normalizedIp
      : ipKeyGenerator(normalizedIp);
  },
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
