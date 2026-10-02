import {
  getDashboardSummary,
  getDashboardRespondents
} from "../repositories/dashboardRepository.js";
import { getDashboardQuestions } from "../repositories/dashboardQuestionRepository.js";
import {
  getDashboardAccessContext,
  getOrganizationDashboardAccessContext
} from "../repositories/dashboardAccessRepository.js";

export async function loadDashboardSummary(
  surveyKey: string,
  facilityId: number | null = null
) {
  const [summary, questions, respondentDetails] = await Promise.all([
    getDashboardSummary(surveyKey, facilityId),
    getDashboardQuestions(surveyKey, facilityId),
    getDashboardRespondents(surveyKey, facilityId)
  ]);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    questions,
    respondentDetails
  };
}

export async function loadSecureDashboardSummary(
  dashboardKey: string,
  facilityKey: string
) {
  const accessContext = await getDashboardAccessContext(
    dashboardKey,
    facilityKey
  );

  if (!accessContext) {
    return null;
  }

  const dashboard = await loadDashboardSummary(
    accessContext.surveyKey,
    accessContext.facilityId
  );

  if (!dashboard) {
    return null;
  }

  return {
    organizationName: accessContext.organizationName,
    dashboard
  };
}
export async function loadOrganizationDashboardSummary(
  dashboardKey: string
) {
  const accessContext =
    await getOrganizationDashboardAccessContext(dashboardKey);

  if (!accessContext) {
    return null;
  }

  const dashboard = await loadDashboardSummary(
    accessContext.surveyKey,
    null
  );

  if (!dashboard) {
    return null;
  }

  return {
    organizationName: accessContext.organizationName,
    dashboard
  };
}