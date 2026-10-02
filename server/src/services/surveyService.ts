import {
  getSurveyByKey,
  type SurveyQuestionRow
} from "../repositories/surveyRepository.js";

export interface SurveyResponse {
  orgSurveyId: number;
  surveyId: number;
  organization: string;
  description: string | null;
  dueDate: Date | null;
  questions: Array<{
    id: number;
    statement: string;
    sequence: number;
    domain: {
      id: number;
      name: string;
      threshold: number | null;
      above: string | null;
      notAbove: string | null;
    };
    theme: {
      id: number;
      name: string;
      sequence: number;
    };
  }>;
}

export async function loadSurvey(
  surveyKey: string
): Promise<SurveyResponse | null> {
  const rows: SurveyQuestionRow[] = await getSurveyByKey(surveyKey);

  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];

  if (!first) {
    return null;
  }

  return {
    orgSurveyId: Number(first.OrgSurveyID),
    surveyId: Number(first.SurveyID),
    organization: first.Organization,
    description: first.SurveyDescription,
    dueDate: first.DueDate,
    questions: rows.map((row) => ({
      id: Number(row.StatementID),
      statement: row.Statement,
      sequence: Number(row.StatementSeq),
      domain: {
        id: Number(row.DomainID),
        name: row.Domain,
        threshold:
          row.Threshold === null ? null : Number(row.Threshold),
        above: row.Above,
        notAbove: row.NotAbove
      },
      theme: {
        id: Number(row.ThemeID),
        name: row.Theme,
        sequence: Number(row.ThemeSeq)
      }
    }))
  };
}
