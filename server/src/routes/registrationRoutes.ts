import { Router } from "express";
import { createOrganizationRegistration } from "../controllers/registrationController.js";

const registrationRouter = Router();

registrationRouter.post("/", createOrganizationRegistration);

export { registrationRouter };
