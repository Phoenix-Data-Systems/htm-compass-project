import { getDatabasePool, sql } from "../config/database.js";

export interface CreateParticipantInput {
  surveyKey: string;
  participant: string;
  facilityId: number;
  role: string | null;
  email: string | null;
  department: string | null;
  notes: string | null;
}

interface ParticipantInsertRow {
  ID: number;
}

export async function createParticipant(
  input: CreateParticipantInput
): Promise<number | null> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, input.surveyKey)
    .input("participant", sql.VarChar(100), input.participant)
    .input("facilityId", sql.Int, input.facilityId)
    .input("role", sql.VarChar(50), input.role)
    .input("email", sql.VarChar(50), input.email)
    .input("department", sql.VarChar(50), input.department)
    .input("notes", sql.VarChar(sql.MAX), input.notes)
    .query<ParticipantInsertRow>(`
      INSERT INTO dbo.Participants (
        Participant,
        FacilityID,
        Role,
        Email,
        Department,
        Notes,
        Active
      )
      OUTPUT INSERTED.ID
      SELECT
        @participant,
        f.ID,
        @role,
        @email,
        @department,
        @notes,
        1
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
        ON o.ID = os.OrgID
      INNER JOIN dbo.Surveys s
        ON s.ID = os.SurveyID
      INNER JOIN dbo.OrgFacilities f
        ON f.OrgID = os.OrgID
       AND f.ID = @facilityId
      WHERE os.SurveyKey = @surveyKey
        AND o.Active = 1
        AND s.Active = 1
        AND f.Active = 1;
    `);

  const inserted = result.recordset[0];

  return inserted ? Number(inserted.ID) : null;
}
