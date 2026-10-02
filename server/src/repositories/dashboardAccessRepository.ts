import { getDatabasePool, sql } from "../config/database.js";

export interface DashboardAccessContext {
  surveyKey: string;
  facilityId: number;
  organizationName: string;
}

export interface OrganizationDashboardAccessContext {
  surveyKey: string;
  organizationName: string;
}

interface DashboardAccessRow {
  SurveyKey: string;
  FacilityID: number;
  OrganizationName: string;
}

interface OrganizationDashboardAccessRow {
  SurveyKey: string;
  OrganizationName: string;
}

export async function getOrganizationDashboardAccessContext(
  dashboardKey: string
): Promise<OrganizationDashboardAccessContext | null> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("dashboardKey", sql.UniqueIdentifier, dashboardKey)
    .query<OrganizationDashboardAccessRow>(`
      SELECT TOP (1)
          os.SurveyKey,
          o.Organization AS OrganizationName
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
          ON o.ID = os.OrgID
         AND o.Active = 1
      INNER JOIN dbo.Surveys s
          ON s.ID = os.SurveyID
         AND s.Active = 1
      WHERE os.DashboardKey = @dashboardKey
        AND os.DashboardKeyActive = 1
        AND (
              os.DashboardKeyExpiresAt IS NULL
              OR os.DashboardKeyExpiresAt > SYSUTCDATETIME()
            );
    `);

  const row = result.recordset[0];

  if (!row) {
    return null;
  }

  return {
    surveyKey: String(row.SurveyKey),
    organizationName: String(row.OrganizationName)
  };
}

export async function getDashboardAccessContext(
  dashboardKey: string,
  facilityKey: string
): Promise<DashboardAccessContext | null> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("dashboardKey", sql.UniqueIdentifier, dashboardKey)
    .input("facilityKey", sql.UniqueIdentifier, facilityKey)
    .query<DashboardAccessRow>(`
      SELECT TOP (1)
          os.SurveyKey,
          f.ID AS FacilityID,
          o.Organization AS OrganizationName
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
          ON o.ID = os.OrgID
         AND o.Active = 1
      INNER JOIN dbo.OrgFacilities f
          ON f.OrgID = os.OrgID
         AND f.FacilityKey = @facilityKey
         AND f.Active = 1
      WHERE os.DashboardKey = @dashboardKey
        AND os.DashboardKeyActive = 1
        AND (
              os.DashboardKeyExpiresAt IS NULL
              OR os.DashboardKeyExpiresAt > SYSUTCDATETIME()
            );
    `);

  const row = result.recordset[0];

  if (!row) {
    return null;
  }

  return {
    surveyKey: String(row.SurveyKey),
    facilityId: Number(row.FacilityID),
    organizationName: String(row.OrganizationName)
  };
}