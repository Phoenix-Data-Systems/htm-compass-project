import { getDatabasePool, sql } from "../config/database.js";

export interface DashboardQuestion {
  statementId: number;
  statement: string;
  domain: string;
  theme: string;
  averageScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  responseCount: number;
  swotCategory: string;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
}

export async function getDashboardQuestions(
  surveyKey: string,
  facilityId: number | null = null
): Promise<DashboardQuestion[]> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, surveyKey)
    .input("facilityId", sql.Int, facilityId)
    .query(`
      ;WITH SurveyContext AS
      (
          SELECT
              os.ID AS OrgSurveyID,
              os.OrgID,
              os.SurveyID
          FROM dbo.OrgSurveys os
          WHERE os.SurveyKey = @surveyKey
      ),
      SurveyQuestionCount AS
      (
          SELECT
              sc.OrgSurveyID,
              sc.OrgID,
              sc.SurveyID,
              COUNT(*) AS TotalQuestions
          FROM SurveyContext sc
          INNER JOIN dbo.SurveyStatements ss
              ON ss.SurveyID = sc.SurveyID
             AND ss.Active = 1
          INNER JOIN dbo.Statements s
              ON s.ID = ss.StatementID
             AND s.Active = 1
          GROUP BY
              sc.OrgSurveyID,
              sc.OrgID,
              sc.SurveyID
      ),
      CompletedParticipants AS
      (
          SELECT
              r.OrgSurveyID,
              r.ParticipantID
          FROM dbo.Responses r
          INNER JOIN SurveyQuestionCount sqc
              ON sqc.OrgSurveyID = r.OrgSurveyID
          INNER JOIN dbo.SurveyStatements ss
              ON ss.SurveyID = sqc.SurveyID
             AND ss.StatementID = r.StatementID
             AND ss.Active = 1
          INNER JOIN dbo.Participants p
              ON p.ID = r.ParticipantID
             AND p.Active = 1
             AND (@facilityId IS NULL OR p.FacilityID = @facilityId)
          INNER JOIN dbo.OrgFacilities f
              ON f.ID = p.FacilityID
             AND f.OrgID = sqc.OrgID
             AND f.Active = 1
          GROUP BY
              r.OrgSurveyID,
              r.ParticipantID,
              sqc.TotalQuestions
          HAVING COUNT(DISTINCT r.StatementID) = sqc.TotalQuestions
      ),
      ResponseRows AS
      (
          SELECT
              s.ID AS StatementID,
              s.Statement,
              d.Domain,
              CAST(d.Threshold AS decimal(10,2)) AS Threshold,
              d.Above,
              d.NotAbove,
              t.Theme,
              r.Value,
              PERCENTILE_CONT(0.5)
                  WITHIN GROUP (ORDER BY r.Value)
                  OVER (PARTITION BY s.ID) AS MedianScore
          FROM SurveyContext sc
          INNER JOIN dbo.SurveyStatements ss
              ON ss.SurveyID = sc.SurveyID
             AND ss.Active = 1
          INNER JOIN dbo.Statements s
              ON s.ID = ss.StatementID
             AND s.Active = 1
          INNER JOIN dbo.Domains d
              ON d.ID = s.DomainID
             AND d.Active = 1
          INNER JOIN dbo.Themes t
              ON t.ID = s.ThemeID
             AND t.Active = 1
          INNER JOIN dbo.Responses r
              ON r.OrgSurveyID = sc.OrgSurveyID
             AND r.StatementID = s.ID
          INNER JOIN CompletedParticipants cp
              ON cp.OrgSurveyID = r.OrgSurveyID
             AND cp.ParticipantID = r.ParticipantID
      )
      SELECT
          StatementID,
          Statement,
          Domain,
          Theme,

          CAST(
              AVG(CAST(Value AS decimal(10,2)))
              AS decimal(10,2)
          ) AS AverageScore,

          CAST(
              MAX(MedianScore)
              AS decimal(10,2)
          ) AS MedianScore,

          MIN(Value) AS MinScore,
          MAX(Value) AS MaxScore,
          COUNT(*) AS ResponseCount,

          CASE
              WHEN AVG(CAST(Value AS decimal(10,2))) >= Threshold
                  THEN Above
              ELSE NotAbove
          END AS SWOTCategory,

          SUM(CASE WHEN Value = 1 THEN 1 ELSE 0 END) AS Score1,
          SUM(CASE WHEN Value = 2 THEN 1 ELSE 0 END) AS Score2,
          SUM(CASE WHEN Value = 3 THEN 1 ELSE 0 END) AS Score3,
          SUM(CASE WHEN Value = 4 THEN 1 ELSE 0 END) AS Score4,
          SUM(CASE WHEN Value = 5 THEN 1 ELSE 0 END) AS Score5,
          SUM(CASE WHEN Value = 6 THEN 1 ELSE 0 END) AS Score6

      FROM ResponseRows

      GROUP BY
          StatementID,
          Statement,
          Domain,
          Theme,
          Threshold,
          Above,
          NotAbove

      ORDER BY StatementID;
    `);

  return result.recordset.map((row) => ({
    statementId: Number(row.StatementID),
    statement: String(row.Statement),
    domain: String(row.Domain),
    theme: String(row.Theme),
    averageScore: Number(row.AverageScore),
    medianScore: Number(row.MedianScore),
    minScore: Number(row.MinScore),
    maxScore: Number(row.MaxScore),
    responseCount: Number(row.ResponseCount),
    swotCategory: String(row.SWOTCategory),
    distribution: {
      1: Number(row.Score1),
      2: Number(row.Score2),
      3: Number(row.Score3),
      4: Number(row.Score4),
      5: Number(row.Score5),
      6: Number(row.Score6)
    }
  }));
}
