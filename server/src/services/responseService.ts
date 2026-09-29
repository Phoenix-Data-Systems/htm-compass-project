import {
  getResponsesByParticipant,
  saveResponses,
  type SaveResponsesInput,
  type SavedResponse
} from "../repositories/responseRepository.js";

export interface SaveSurveyResponsesResult {
  savedCount: number;
}

export async function submitSurveyResponses(
  input: SaveResponsesInput
): Promise<SaveSurveyResponsesResult | null> {
  return saveResponses(input);
}

export async function loadParticipantResponses(
  surveyKey: string,
  participantId: number
): Promise<SavedResponse[] | null> {
  return getResponsesByParticipant(
    surveyKey,
    participantId
  );
}
