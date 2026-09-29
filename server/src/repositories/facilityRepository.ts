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
