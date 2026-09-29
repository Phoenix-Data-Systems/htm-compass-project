import {
  createParticipant,
  type CreateParticipantInput
} from "../repositories/participantRepository.js";

export interface ParticipantResponse {
  id: number;
}

export async function registerParticipant(
  input: CreateParticipantInput
): Promise<ParticipantResponse | null> {
  const participantId = await createParticipant(input);

  if (participantId === null) {
    return null;
  }

  return {
    id: participantId
  };
}
