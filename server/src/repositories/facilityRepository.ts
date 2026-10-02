import { getDatabasePool, sql } from "../config/database.js";

export interface SurveyFacility {
  id: number;
  name: string;
}

export async function getSurveyFacilities(
  surveyKey: string
): Promise<SurveyFacility[]> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, surveyKey)
    .query(`
      SELECT
          f.ID,
          f.Facility
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.OrgFacilities f
          ON f.OrgID = os.OrgID
      WHERE os.SurveyKey = @surveyKey
        AND f.Active = 1
      ORDER BY f.Facility;
    `);

  return result.recordset.map((row) => ({
    id: Number(row.ID),
    name: String(row.Facility)
  }));
}

export interface DashboardFacility {
  key: string;
  name: string;
}

export async function getDashboardFacilities(
  dashboardKey: string
): Promise<DashboardFacility[]> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("dashboardKey", sql.UniqueIdentifier, dashboardKey)
    .query(`
      SELECT
          f.FacilityKey,
          f.Facility
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.OrgFacilities f
          ON f.OrgID = os.OrgID
         AND f.Active = 1
      WHERE os.DashboardKey = @dashboardKey
        AND os.DashboardKeyActive = 1
        AND (
              os.DashboardKeyExpiresAt IS NULL
              OR os.DashboardKeyExpiresAt > SYSUTCDATETIME()
            )
      ORDER BY f.Facility;
    `);

  return result.recordset.map((row) => ({
    key: String(row.FacilityKey),
    name: String(row.Facility)
  }));
}