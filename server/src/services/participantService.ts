import {
  createParticipant,
  type CreateParticipantInput
} from "../repositories/participantRepository.js";

export interface ParticipantResponse {
  id: number;
  facilityId: number;
  facilityName: string;
}

export async function registerParticipant(
  input: CreateParticipantInput
): Promise<ParticipantResponse | null> {
  const result = await createParticipant(input);

  if (!result) {
    return null;
  }

  return {
    id: result.participantId,
    facilityId: result.facilityId,
    facilityName: result.facilityName
  };
}