import { Router } from "express";
import { getSurvey } from "../controllers/surveyController.js";
import { getSurveyFacilities } from "../controllers/facilityController.js";
import { createParticipantForSurvey } from "../controllers/participantController.js";
import {
  getParticipantResponses,
  saveSurveyResponses
} from "../controllers/responseController.js";

const surveyRouter = Router();

surveyRouter.get("/:surveyKey", getSurvey);
surveyRouter.get("/:surveyKey/facilities", getSurveyFacilities);

surveyRouter.post(
  "/:surveyKey/participants",
  createParticipantForSurvey
);

surveyRouter.post(
  "/:surveyKey/responses",
  saveSurveyResponses
);

surveyRouter.get(
  "/:surveyKey/participants/:participantId/responses",
  getParticipantResponses
);

export { surveyRouter };



