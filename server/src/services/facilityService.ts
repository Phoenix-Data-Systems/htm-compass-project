import { getSurveyFacilities } from "../repositories/facilityRepository.js";

export async function loadSurveyFacilities(surveyKey: string) {
  return getSurveyFacilities(surveyKey);
}
