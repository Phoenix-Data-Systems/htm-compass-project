import { getDatabasePool, sql } from "../config/database.js";

export interface CreateOrganizationRegistrationInput {
  organization: string;
  contactName: string;
  contactJobTitle: string;
  contactPhone: string;
  contactEmail: string;
  numberOfFacilities: number;
  surveyId: number;
  initialStatusId: number;
}

export interface OrganizationRegistrationResult {
  organizationId: number;
  orgSurveyId: number;
  surveyKey: string;
  dashboardKey: string;
}

interface OrganizationInsertRow {
  ID: number;
}

interface OrgSurveyInsertRow {
  ID: number;
  SurveyKey: string;
  DashboardKey: string;
}

export async function createOrganizationRegistration(
  input: CreateOrganizationRegistrationInput
): Promise<OrganizationRegistrationResult> {
  const pool = await getDatabasePool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const organizationResult = await new sql.Request(transaction)
      .input("organization", sql.VarChar(255), input.organization)
      .query<OrganizationInsertRow>(`
        INSERT INTO dbo.Orgs (
          Organization,
          Active
        )
        OUTPUT INSERTED.ID
        VALUES (
          @organization,
          1
        );
      `);

    const organization = organizationResult.recordset[0];

    if (!organization) {
      throw new Error("Organization creation failed");
    }

    const organizationId = Number(organization.ID);

    await new sql.Request(transaction)
      .input("orgId", sql.Int, organizationId)
      .input("contactName", sql.VarChar(200), input.contactName)
      .input("contactJobTitle", sql.VarChar(200), input.contactJobTitle)
      .input("contactPhone", sql.VarChar(50), input.contactPhone)
      .input("contactEmail", sql.VarChar(320), input.contactEmail)
      .input("numberOfFacilities", sql.Int, input.numberOfFacilities)
      .query(`
        INSERT INTO dbo.OrgRegistration (
          OrgID,
          ContactName,
          ContactJobTitle,
          ContactPhone,
          ContactEmail,
          NumberOfFacilities
        )
        VALUES (
          @orgId,
          @contactName,
          @contactJobTitle,
          @contactPhone,
          @contactEmail,
          @numberOfFacilities
        );
      `);

    const surveyResult = await new sql.Request(transaction)
      .input("orgId", sql.Int, organizationId)
      .input("surveyId", sql.Int, input.surveyId)
      .input("statusId", sql.Int, input.initialStatusId)
      .query<OrgSurveyInsertRow>(`
        INSERT INTO dbo.OrgSurveys (
          OrgID,
          SurveyID,
          SurveyDT,
          Status,
          DueDate
        )
        OUTPUT
          INSERTED.ID,
          INSERTED.SurveyKey,
          INSERTED.DashboardKey
        SELECT
          @orgId,
          s.ID,
          SYSUTCDATETIME(),
          @statusId,
          NULL
        FROM dbo.Surveys s
        WHERE s.ID = @surveyId
          AND s.Active = 1;
      `);

    const orgSurvey = surveyResult.recordset[0];

    if (!orgSurvey) {
      throw new Error("Active survey not found");
    }

    await transaction.commit();

    return {
      organizationId,
      orgSurveyId: Number(orgSurvey.ID),
      surveyKey: String(orgSurvey.SurveyKey),
      dashboardKey: String(orgSurvey.DashboardKey)
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error(
        "Organization registration rollback failed:",
        rollbackError
      );
    }

    throw error;
  }
}
