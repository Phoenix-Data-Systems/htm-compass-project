import { getDatabasePool, sql } from "../config/database.js";

export interface SurveyAnswer {
  statementId: number;
  value: number;
}

export interface SaveResponsesInput {
  surveyKey: string;
  participantId: number;
  responses: SurveyAnswer[];
}

export interface SaveResponsesResult {
  savedCount: number;
}

interface SavedCountRow {
  SavedCount: number;
}

export async function saveResponses(
  input: SaveResponsesInput
): Promise<SaveResponsesResult | null> {
  const pool = await getDatabasePool();

  const responsesJson = JSON.stringify(input.responses);

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, input.surveyKey)
    .input("participantId", sql.Int, input.participantId)
    .input("responsesJson", sql.NVarChar(sql.MAX), responsesJson)
    .query<SavedCountRow>(`
      SET NOCOUNT ON;
      SET XACT_ABORT ON;

      DECLARE @OrgSurveyID int;
      DECLARE @SurveyID int;

      SELECT
        @OrgSurveyID = os.ID,
        @SurveyID = os.SurveyID
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
        ON o.ID = os.OrgID
       AND o.Active = 1
      INNER JOIN dbo.Surveys s
        ON s.ID = os.SurveyID
       AND s.Active = 1
      INNER JOIN dbo.OrgFacilities f
        ON f.OrgID = os.OrgID
       AND f.Active = 1
      INNER JOIN dbo.Participants p
        ON p.FacilityID = f.ID
       AND p.ID = @participantId
       AND p.Active = 1
      WHERE os.SurveyKey = @surveyKey;

      IF @OrgSurveyID IS NULL
      BEGIN
        SELECT CAST(-1 AS int) AS SavedCount;
        RETURN;
      END;

      DECLARE @IncomingResponses TABLE (
        StatementID int NOT NULL,
        Value int NOT NULL
      );

      INSERT INTO @IncomingResponses (
        StatementID,
        Value
      )
      SELECT
        StatementID,
        Value
      FROM OPENJSON(@responsesJson)
      WITH (
        StatementID int '$.statementId',
        Value int '$.value'
      );

      IF EXISTS (
        SELECT 1
        FROM @IncomingResponses ir
        WHERE NOT EXISTS (
          SELECT 1
          FROM dbo.SurveyStatements ss
          INNER JOIN dbo.Statements s
            ON s.ID = ss.StatementID
           AND s.Active = 1
          WHERE ss.SurveyID = @SurveyID
            AND ss.StatementID = ir.StatementID
            AND ss.Active = 1
        )
      )
      BEGIN
        SELECT CAST(-2 AS int) AS SavedCount;
        RETURN;
      END;

      BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE r
        SET
          r.Value = ir.Value,
          r.ResponseDT = GETDATE()
        FROM dbo.Responses r
        INNER JOIN @IncomingResponses ir
          ON ir.StatementID = r.StatementID
        WHERE r.OrgSurveyID = @OrgSurveyID
          AND r.ParticipantID = @participantId;

        INSERT INTO dbo.Responses (
          OrgSurveyID,
          ParticipantID,
          StatementID,
          Value,
          ResponseDT
        )
        SELECT
          @OrgSurveyID,
          @participantId,
          ir.StatementID,
          ir.Value,
          GETDATE()
        FROM @IncomingResponses ir
        WHERE NOT EXISTS (
          SELECT 1
          FROM dbo.Responses r WITH (UPDLOCK, HOLDLOCK)
          WHERE r.OrgSurveyID = @OrgSurveyID
            AND r.ParticipantID = @participantId
            AND r.StatementID = ir.StatementID
        );

        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0
          ROLLBACK TRANSACTION;

        THROW;
      END CATCH;

      SELECT COUNT(*) AS SavedCount
      FROM @IncomingResponses;
    `);

  const row = result.recordset[0];

  if (!row || Number(row.SavedCount) < 0) {
    return null;
  }

  return {
    savedCount: Number(row.SavedCount)
  };
}

export interface SavedResponse {
  statementId: number;
  value: number;
  responseDate: Date | null;
}

interface SavedResponseRow {
  StatementID: number | null;
  Value: number | null;
  ResponseDT: Date | null;
}

export async function getResponsesByParticipant(
  surveyKey: string,
  participantId: number
): Promise<SavedResponse[] | null> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, surveyKey)
    .input("participantId", sql.Int, participantId)
    .query<SavedResponseRow>(`
      SELECT
        r.StatementID,
        r.Value,
        r.ResponseDT
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
        ON o.ID = os.OrgID
       AND o.Active = 1
      INNER JOIN dbo.Surveys s
        ON s.ID = os.SurveyID
       AND s.Active = 1
      INNER JOIN dbo.OrgFacilities f
        ON f.OrgID = os.OrgID
       AND f.Active = 1
      INNER JOIN dbo.Participants p
        ON p.FacilityID = f.ID
       AND p.ID = @participantId
       AND p.Active = 1
      LEFT JOIN dbo.Responses r
        ON r.OrgSurveyID = os.ID
       AND r.ParticipantID = p.ID
      WHERE os.SurveyKey = @surveyKey
      ORDER BY r.StatementID;
    `);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset
    .filter(
      (row) =>
        row.StatementID !== null &&
        row.Value !== null
    )
    .map((row) => ({
      statementId: Number(row.StatementID),
      value: Number(row.Value),
      responseDate: row.ResponseDT
    }));
}

