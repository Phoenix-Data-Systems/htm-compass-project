import {
  getDashboardSummary,
  getDashboardRespondents
} from "../repositories/dashboardRepository.js";
import { getDashboardQuestions } from "../repositories/dashboardQuestionRepository.js";

export async function loadDashboardSummary(
  surveyKey: string,
  facilityId: number
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
