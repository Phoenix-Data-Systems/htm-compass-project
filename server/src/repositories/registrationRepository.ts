import { createHash } from "node:crypto";
import { getDatabasePool, sql } from "../config/database.js";

export class DuplicateRegistrationError extends Error {
  constructor() {
    super("Registration already exists");
    this.name = "DuplicateRegistrationError";
  }
}

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
    const normalizedOrganization = input.organization.trim().toLowerCase();
    const normalizedEmail = input.contactEmail.trim().toLowerCase();

    const lockResource = `swot-registration:${createHash("sha256")
      .update(JSON.stringify([
        normalizedOrganization,
        normalizedEmail,
        input.surveyId
      ]))
      .digest("hex")}`;

    const lockResult = await new sql.Request(transaction)
      .input("lockResource", sql.NVarChar(255), lockResource)
      .query<{ LockResult: number }>(`
        DECLARE @result INT;

        EXEC @result = sys.sp_getapplock
          @Resource = @lockResource,
          @LockMode = 'Exclusive',
          @LockOwner = 'Transaction',
          @LockTimeout = 10000;

        SELECT @result AS LockResult;
      `);

    if ((lockResult.recordset[0]?.LockResult ?? -1) < 0) {
      throw new Error("Unable to acquire registration lock");
    }

    const existingResult = await new sql.Request(transaction)
      .input("organizationKey", sql.VarChar(255), normalizedOrganization)
      .input("emailKey", sql.VarChar(320), normalizedEmail)
      .input("surveyId", sql.Int, input.surveyId)
      .query<{ ID: number }>(`
        SELECT TOP (1) os.ID
        FROM dbo.OrgSurveys os
        INNER JOIN dbo.Orgs o
          ON o.ID = os.OrgID
        INNER JOIN dbo.OrgRegistration r
          ON r.OrgID = o.ID
        WHERE os.SurveyID = @surveyId
          AND LOWER(LTRIM(RTRIM(o.Organization))) = @organizationKey
          AND LOWER(LTRIM(RTRIM(r.ContactEmail))) = @emailKey;
      `);

    if (existingResult.recordset.length > 0) {
      throw new DuplicateRegistrationError();
    }

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
