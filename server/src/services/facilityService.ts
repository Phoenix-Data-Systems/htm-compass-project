import {
  getSurveyFacilities,
  getDashboardFacilities
} from "../repositories/facilityRepository.js";

export async function loadSurveyFacilities(surveyKey: string) {
  return getSurveyFacilities(surveyKey);
}

export async function loadDashboardFacilities(
  dashboardKey: string
) {
  return getDashboardFacilities(dashboardKey);
}