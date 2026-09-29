import { getDatabasePool, sql } from "../config/database.js";

export interface DashboardSummary {
  respondents: number;
  questionsAnalyzed: number;
  overallScore: number | null;
  strengths: number;
  weaknesses: number;
  opportunities: number;
  threats: number;
  swotIndex: number;
}

export async function getDashboardSummary(
  surveyKey: string,
  facilityId: number
): Promise<DashboardSummary | null> {
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
             AND p.FacilityID = @facilityId
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
      QuestionAverages AS
      (
          SELECT
              s.ID AS StatementID,
              CAST(d.Threshold AS decimal(10,2)) AS Threshold,
              d.Above,
              d.NotAbove,
              CAST(
                  AVG(CAST(r.Value AS decimal(10,2)))
                  AS decimal(10,2)
              ) AS AverageScore
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
          INNER JOIN dbo.Responses r
              ON r.OrgSurveyID = sc.OrgSurveyID
             AND r.StatementID = s.ID
          INNER JOIN CompletedParticipants cp
              ON cp.OrgSurveyID = r.OrgSurveyID
             AND cp.ParticipantID = r.ParticipantID
          GROUP BY
              s.ID,
              d.Threshold,
              d.Above,
              d.NotAbove
      ),
      ClassifiedQuestions AS
      (
          SELECT
              AverageScore,
              CASE
                  WHEN AverageScore >= Threshold THEN Above
                  ELSE NotAbove
              END AS SWOTCategory
          FROM QuestionAverages
      )
      SELECT
          (
              SELECT COUNT(*)
              FROM CompletedParticipants
          ) AS Respondents,

          COUNT(*) AS QuestionsAnalyzed,

          CAST(
              AVG(CAST(AverageScore AS decimal(10,2)))
              AS decimal(10,2)
          ) AS OverallScore,

          SUM(CASE WHEN SWOTCategory = 'Strength'
              THEN 1 ELSE 0 END) AS Strengths,

          SUM(CASE WHEN SWOTCategory = 'Weakness'
              THEN 1 ELSE 0 END) AS Weaknesses,

          SUM(CASE WHEN SWOTCategory = 'Opportunity'
              THEN 1 ELSE 0 END) AS Opportunities,

          SUM(CASE WHEN SWOTCategory = 'Threat'
              THEN 1 ELSE 0 END) AS Threats,

          (
              SUM(CASE WHEN SWOTCategory = 'Strength'
                  THEN 1 ELSE 0 END) * 2
              -
              SUM(CASE WHEN SWOTCategory = 'Weakness'
                  THEN 1 ELSE 0 END)
              +
              SUM(CASE WHEN SWOTCategory = 'Opportunity'
                  THEN 1 ELSE 0 END)
              -
              SUM(CASE WHEN SWOTCategory = 'Threat'
                  THEN 1 ELSE 0 END) * 2
          ) AS SWOTIndex

      FROM ClassifiedQuestions;
    `);

  const row = result.recordset[0];

  if (!row) {
    return null;
  }

  return {
    respondents: Number(row.Respondents ?? 0),
    questionsAnalyzed: Number(row.QuestionsAnalyzed ?? 0),
    overallScore:
      row.OverallScore === null
        ? null
        : Number(row.OverallScore),
    strengths: Number(row.Strengths ?? 0),
    weaknesses: Number(row.Weaknesses ?? 0),
    opportunities: Number(row.Opportunities ?? 0),
    threats: Number(row.Threats ?? 0),
    swotIndex: Number(row.SWOTIndex ?? 0)
  };
}

export interface DashboardRespondent {
  anonymousId: string;
  facilityId: number;
  facility: string;
  department: string | null;
  submittedAt: string | null;
  answeredCount: number;
}

export async function getDashboardRespondents(
  surveyKey: string,
  facilityId: number
): Promise<DashboardRespondent[]> {
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
              r.ParticipantID,
              COUNT(DISTINCT r.StatementID) AS AnsweredCount,
              MAX(r.ResponseDT) AS SubmittedAt
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
             AND p.FacilityID = @facilityId
          INNER JOIN dbo.OrgFacilities f
              ON f.ID = p.FacilityID
             AND f.OrgID = sqc.OrgID
             AND f.Active = 1
          GROUP BY
              r.OrgSurveyID,
              r.ParticipantID,
              sqc.TotalQuestions
          HAVING COUNT(DISTINCT r.StatementID) = sqc.TotalQuestions
      )
      SELECT
          CONCAT(
              'R-',
              LEFT(
                  CONVERT(
                      varchar(64),
                      HASHBYTES(
                          'SHA2_256',
                          CONCAT(
                              CAST(cp.OrgSurveyID AS varchar(20)),
                              ':',
                              CAST(cp.ParticipantID AS varchar(20))
                          )
                      ),
                      2
                  ),
                  8
              )
          ) AS AnonymousID,
          p.FacilityID,
          f.Facility,
          p.Department,
          cp.SubmittedAt,
          cp.AnsweredCount
      FROM CompletedParticipants cp
      INNER JOIN SurveyContext sc
          ON sc.OrgSurveyID = cp.OrgSurveyID
      INNER JOIN dbo.Participants p
          ON p.ID = cp.ParticipantID
         AND p.Active = 1
         AND p.FacilityID = @facilityId
      INNER JOIN dbo.OrgFacilities f
          ON f.ID = p.FacilityID
         AND f.OrgID = sc.OrgID
         AND f.Active = 1
      ORDER BY
          cp.SubmittedAt DESC;
    `);

  return result.recordset.map((row) => ({
    anonymousId: String(row.AnonymousID),
    facilityId: Number(row.FacilityID),
    facility: String(row.Facility),
    department:
      row.Department === null
        ? null
        : String(row.Department),
    submittedAt:
      row.SubmittedAt === null
        ? null
        : new Date(row.SubmittedAt).toISOString(),
    answeredCount: Number(row.AnsweredCount)
  }));
}
