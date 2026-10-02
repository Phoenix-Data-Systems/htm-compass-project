import { getDatabasePool, sql } from "../config/database.js";

export interface SurveyQuestionRow {
  OrgSurveyID: number;
  SurveyID: number;
  Organization: string;
  SurveyDescription: string | null;
  DueDate: Date | null;
  StatementID: number;
  Statement: string;
  StatementSeq: number;
  DomainID: number;
  Domain: string;
  Threshold: number | null;
  Above: string | null;
  NotAbove: string | null;
  ThemeID: number;
  Theme: string;
  ThemeSeq: number;
}

export async function getSurveyByKey(
  surveyKey: string
): Promise<SurveyQuestionRow[]> {
  const pool = await getDatabasePool();

  const result = await pool
    .request()
    .input("surveyKey", sql.UniqueIdentifier, surveyKey)
    .query<SurveyQuestionRow>(`
      SELECT
        os.ID AS OrgSurveyID,
        os.SurveyID,
        o.Organization,
        s.Description AS SurveyDescription,
        os.DueDate,
        st.ID AS StatementID,
        st.Statement,
        CAST(st.Seq AS float) AS StatementSeq,
        d.ID AS DomainID,
        d.Domain,
        CAST(d.Threshold AS float) AS Threshold,
        d.Above,
        d.NotAbove,
        t.ID AS ThemeID,
        t.Theme,
        CAST(t.Seq AS float) AS ThemeSeq
      FROM dbo.OrgSurveys os
      INNER JOIN dbo.Orgs o
        ON o.ID = os.OrgID
      INNER JOIN dbo.Surveys s
        ON s.ID = os.SurveyID
      INNER JOIN dbo.SurveyStatements ss
        ON ss.SurveyID = s.ID
      INNER JOIN dbo.Statements st
        ON st.ID = ss.StatementID
      INNER JOIN dbo.Domains d
        ON d.ID = st.DomainID
      INNER JOIN dbo.Themes t
        ON t.ID = st.ThemeID
      WHERE os.SurveyKey = @surveyKey
        AND ss.Active = 1
        AND st.Active = 1
      ORDER BY st.Seq, st.ID;
    `);

  return result.recordset;
}
