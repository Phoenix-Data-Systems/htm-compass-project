import { getDatabasePool, sql } from "../config/database.js";

export interface CreateParticipantInput {
  surveyKey: string;
  participant: string;
  facilityName: string;
  role: string | null;
  email: string | null;
  department: string | null;
  notes: string | null;
}

export interface CreateParticipantResult {
  participantId: number;
  facilityId: number;
  facilityName: string;
}

interface ParticipantInsertRow {
  ParticipantID: number;
  FacilityID: number;
  FacilityName: string;
}

export async function createParticipant(
  input: CreateParticipantInput
): Promise<CreateParticipantResult | null> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, input.surveyKey)
    .input("participant", sql.VarChar(100), input.participant)
    .input("facilityName", sql.VarChar(200), input.facilityName.trim())
    .input("role", sql.VarChar(50), input.role)
    .input("email", sql.VarChar(50), input.email)
    .input("department", sql.VarChar(50), input.department)
    .input("notes", sql.VarChar(sql.MAX), input.notes)
    .query<ParticipantInsertRow>(`
      SET XACT_ABORT ON;

      BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @OrgID int;
        DECLARE @FacilityID int;
        DECLARE @StoredFacilityName varchar(200);
        DECLARE @ParticipantID int;

        SELECT TOP (1)
          @OrgID = os.OrgID
        FROM dbo.OrgSurveys os
        INNER JOIN dbo.Orgs o
          ON o.ID = os.OrgID
         AND o.Active = 1
        INNER JOIN dbo.Surveys s
          ON s.ID = os.SurveyID
         AND s.Active = 1
        WHERE os.SurveyKey = @surveyKey;

        IF @OrgID IS NULL
        BEGIN
          ROLLBACK TRANSACTION;

          SELECT
            CAST(NULL AS int) AS ParticipantID,
            CAST(NULL AS int) AS FacilityID,
            CAST(NULL AS varchar(200)) AS FacilityName
          WHERE 1 = 0;

          RETURN;
        END;

        SELECT TOP (1)
          @FacilityID = f.ID,
          @StoredFacilityName = f.Facility
        FROM dbo.OrgFacilities f WITH (UPDLOCK, HOLDLOCK)
        WHERE f.OrgID = @OrgID
          AND f.Active = 1
          AND LOWER(LTRIM(RTRIM(f.Facility))) =
              LOWER(LTRIM(RTRIM(@facilityName)))
        ORDER BY f.ID;

        IF @FacilityID IS NULL
        BEGIN
          INSERT INTO dbo.OrgFacilities (
            OrgID,
            Facility,
            Active
          )
          VALUES (
            @OrgID,
            LTRIM(RTRIM(@facilityName)),
            1
          );

          SET @FacilityID = CONVERT(int, SCOPE_IDENTITY());
          SET @StoredFacilityName = LTRIM(RTRIM(@facilityName));
        END;

        INSERT INTO dbo.Participants (
          Participant,
          FacilityID,
          Role,
          Email,
          Department,
          Notes,
          Active
        )
        VALUES (
          @participant,
          @FacilityID,
          @role,
          @email,
          @department,
          @notes,
          1
        );

        SET @ParticipantID = CONVERT(int, SCOPE_IDENTITY());

        COMMIT TRANSACTION;

        SELECT
          @ParticipantID AS ParticipantID,
          @FacilityID AS FacilityID,
          @StoredFacilityName AS FacilityName;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0
          ROLLBACK TRANSACTION;

        THROW;
      END CATCH;
    `);

  const inserted = result.recordset[0];

  if (!inserted) {
    return null;
  }

  return {
    participantId: Number(inserted.ParticipantID),
    facilityId: Number(inserted.FacilityID),
    facilityName: String(inserted.FacilityName)
  };
}