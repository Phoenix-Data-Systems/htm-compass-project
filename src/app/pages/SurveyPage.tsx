import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import htmcLogo from "@/imports/HTMC_Logo_-_blue.png";
import {
  getRecord,
  saveRecord,
  type SurveyRecord,
} from "../data";
import {
  getParticipantResponses,
  getSurvey,
  saveSurveyResponses,
  type SurveyQuestion
} from "../api";
import { clsx } from "clsx";
import { ChevronRight, Check, Zap } from "lucide-react";

const SURVEY_PER_PAGE = 15;

function ScaleButton({
  value,
  selected,
  onClick,
}: {
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  const colors = [
    "hover:border-rose-400 hover:bg-rose-50 data-[selected=true]:bg-rose-600 data-[selected=true]:border-rose-600 data-[selected=true]:text-white",
    "hover:border-orange-400 hover:bg-orange-50 data-[selected=true]:bg-orange-500 data-[selected=true]:border-orange-500 data-[selected=true]:text-white",
    "hover:border-amber-400 hover:bg-amber-50 data-[selected=true]:bg-amber-500 data-[selected=true]:border-amber-500 data-[selected=true]:text-white",
    "hover:border-lime-500 hover:bg-lime-50 data-[selected=true]:bg-lime-600 data-[selected=true]:border-lime-600 data-[selected=true]:text-white",
    "hover:border-emerald-500 hover:bg-emerald-50 data-[selected=true]:bg-emerald-600 data-[selected=true]:border-emerald-600 data-[selected=true]:text-white",
    "hover:border-green-600 hover:bg-green-50 data-[selected=true]:bg-green-700 data-[selected=true]:border-green-700 data-[selected=true]:text-white",
  ];
  return (
    <button
      data-selected={selected}
      onClick={onClick}
      className={clsx(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 font-semibold text-sm transition-all duration-150",
        "border-border text-foreground bg-white",
        colors[value - 1],
        "focus:outline-none focus:ring-2 focus:ring-primary/30"
      )}
    >
      {value}
    </button>
  );
}

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SurveyRecord | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [unanswered, setUnanswered] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const r = getRecord(token);

    if (!r) {
      navigate("/");
      return;
    }

    if (r.completed) {
      navigate(`/survey/${token}/complete`);
      return;
    }

    let cancelled = false;

    async function loadSurvey() {
      try {
        const [survey, savedResponses] = await Promise.all([
          getSurvey(r.surveyKey),
          getParticipantResponses(r.surveyKey, r.participantId)
        ]);

        if (cancelled) return;

        const orderedQuestions = [...survey.questions].sort(
          (a, b) => a.sequence - b.sequence
        );

        const restoredAnswers: Record<string, number> = {
          ...r.answers
        };

        for (const response of savedResponses) {
          restoredAnswers[String(response.statementId)] = response.value;
        }

        const totalPages = Math.ceil(
          orderedQuestions.length / SURVEY_PER_PAGE
        );

        let resumePage = 0;

        for (let page = 0; page < totalPages; page++) {
          const start = page * SURVEY_PER_PAGE;
          const pageQuestions = orderedQuestions.slice(
            start,
            start + SURVEY_PER_PAGE
          );

          const pageComplete = pageQuestions.every(
            (question) =>
              restoredAnswers[String(question.id)] !== undefined
          );

          if (!pageComplete) {
            resumePage = page;
            break;
          }

          resumePage = Math.min(page + 1, totalPages - 1);
        }

        const syncedRecord = {
          ...r,
          answers: restoredAnswers
        };

        saveRecord(syncedRecord);
        setQuestions(orderedQuestions);
        setRecord(syncedRecord);
        setAnswers(restoredAnswers);
        setPageIndex(resumePage);
      } catch (error) {
        console.error("Unable to load survey:", error);

        if (!cancelled) {
          navigate("/");
        }
      }
    }

    loadSurvey();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (!record) return null;

  // Build ordered Question objects from the record's random selection
  const surveyQuestions = questions.map((question) => ({
    id: String(question.id),
    text: question.statement
  }));
  const surveyTotal = surveyQuestions.length;
  const surveyTotalPages = Math.ceil(surveyTotal / SURVEY_PER_PAGE);

  const pageStart = pageIndex * SURVEY_PER_PAGE;
  const pageQuestions = surveyQuestions.slice(pageStart, pageStart + SURVEY_PER_PAGE);
  const isLastPage = pageIndex === surveyTotalPages - 1;

  const totalAnswered = surveyQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progressPct = surveyTotal > 0 ? Math.round((totalAnswered / surveyTotal) * 100) : 0;
  const answeredOnPage = pageQuestions.filter((q) => answers[q.id] !== undefined).length;

  function setAnswer(questionId: string, value: number) {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    setUnanswered((prev) => prev.filter((id) => id !== questionId));
    if (record) setRecord({ ...record, answers: updated });
  }

  async function handleContinue() {
    const missing = pageQuestions
      .filter((q) => answers[q.id] === undefined)
      .map((q) => q.id);

    if (missing.length) {
      setUnanswered(missing);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!record || !token) return;

    setUnanswered([]);

    if (isLastPage) {
      await handleSubmit();
      return;
    }

    try {
      const pageResponses = pageQuestions.map((q) => ({
        statementId: Number(q.id),
        value: answers[q.id]
      }));

      await saveSurveyResponses(
        record.surveyKey,
        record.participantId,
        pageResponses
      );

      const updatedRecord = {
        ...record,
        answers
      };

      saveRecord(updatedRecord);
      setRecord(updatedRecord);

      setPageIndex((i) => i + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error("Unable to save survey responses:", error);
    }
  }

  function handleAutoFill() {
    if (!record) return;
    const filled = { ...answers };
    for (const q of surveyQuestions) {
      if (filled[q.id] === undefined) {
        filled[q.id] = Math.ceil(Math.random() * 6);
      }
    }
    setAnswers(filled);
    setUnanswered([]);
    setRecord({ ...record, answers: filled });
    setPageIndex(surveyTotalPages - 1);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit() {
    if (!record || !token) return;

    setSubmitting(true);

    try {
      const allResponses = surveyQuestions.map((q) => ({
        statementId: Number(q.id),
        value: answers[q.id]
      }));

      await saveSurveyResponses(
        record.surveyKey,
        record.participantId,
        allResponses
      );

      saveRecord({
        ...record,
        answers,
        completed: true,
        participant: {
          ...record.participant,
          submittedAt: new Date().toISOString()
        }
      });

      navigate(`/survey/${token}/complete`);
    } catch (error) {
      console.error("Unable to submit survey:", error);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background border-b border-border shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <ImageWithFallback
                src={htmcLogo}
                alt="H.T.M. Consulting"
                className="h-7 w-auto object-contain shrink-0"
              />
              <div>
                <p className="text-xs text-foreground/70 uppercase tracking-widest font-medium">
                  {record.participant.hospital}
                </p>
                <p className="text-sm font-medium text-foreground/80">
                  {record.participant.department} · {record.participant.anonymousId}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                {progressPct}%
              </p>
              <p className="text-xs text-foreground/70 mt-0.5">{totalAnswered} of {surveyTotal}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: "linear-gradient(to right, #6BB1D0, #3292BE)" }}
            />
          </div>
          {/* Page indicators */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: surveyTotalPages }, (_, i) => {
              const pStart = i * SURVEY_PER_PAGE;
              const pageQs = surveyQuestions.slice(pStart, pStart + SURVEY_PER_PAGE);
              const allAnswered = pageQs.every((q) => answers[q.id] !== undefined);
              const active = i === pageIndex;
              const done = i < pageIndex || (allAnswered && i <= pageIndex);
              return (
                <div
                  key={i}
                  className={clsx(
                    "flex-1 text-center py-1.5 rounded text-xs font-medium transition-all",
                    active
                      ? "text-white"
                      : done
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-foreground/70"
                  )}
                  style={active ? { backgroundColor: "#6BB1D0" } : {}}
                >
                  {done && !active ? (
                    <span className="flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Page {i + 1}
                    </span>
                  ) : (
                    `Page ${i + 1}`
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div ref={topRef} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Demo auto-fill — page 1 only */}
        {pageIndex === 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Auto-fill for Demo
            </button>
          </div>
        )}
        {/* Page header */}
        <div className="rounded-2xl border-2 border-border bg-white p-6 mb-8">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: "#3292BE" }}
            >
              <span className="text-lg font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
                {pageIndex + 1}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Questions {pageStart + 1}–{pageStart + pageQuestions.length}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Page {pageIndex + 1} of {surveyTotalPages} · {pageStart + pageQuestions.length} of {surveyTotal} shown · All required
              </p>
            </div>
          </div>
        </div>

        {unanswered.length > 0 && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive font-medium">
            Please answer all {unanswered.length} remaining question{unanswered.length !== 1 ? "s" : ""} before continuing.
          </div>
        )}

        {/* Scale legend */}
        <div className="bg-white rounded-xl border border-border px-4 py-3 mb-6 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex gap-1.5 shrink-0">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: ["#dc2626", "#f97316", "#eab308", "#65a30d", "#16a34a", "#15803d"][n - 1],
                }}
              >
                {n}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            1–3 = Opportunity for Improvement &nbsp;·&nbsp; 4–6 = Exceptional
          </p>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-5">
          {pageQuestions.map((q, idx) => {
            const isUnanswered = unanswered.includes(q.id);
            const val = answers[q.id];
            return (
              <div
                key={q.id}
                id={`q-${q.id}`}
                className={clsx(
                  "bg-white rounded-2xl border-2 p-4 sm:p-6 transition-all",
                  isUnanswered ? "border-destructive/50 shadow-sm shadow-destructive/10" : "border-border"
                )}
              >
                <div className="grid gap-x-3 gap-y-3 sm:gap-x-4 sm:gap-y-3" style={{ gridTemplateColumns: "2rem 1fr" }}>
                  {/* Number circle */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white"
                    style={{ backgroundColor: "#3292BE" }}
                  >
                    {pageStart + idx + 1}
                  </div>
                  {/* Question text */}
                  <div>
                    <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                  {/* Scale buttons — full width, centered */}
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="hidden sm:inline-block text-xs text-muted-foreground w-36 text-right shrink-0"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Opportunity for Improvement
                      </span>
                      <div className="flex flex-1 justify-center gap-2">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <ScaleButton
                            key={n}
                            value={n}
                            selected={val === n}
                            onClick={() => setAnswer(q.id, n)}
                          />
                        ))}
                      </div>
                      <span
                        className="hidden sm:inline-block text-xs text-muted-foreground shrink-0"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        Exceptional
                      </span>
                    </div>
                    <div className="flex justify-between sm:hidden text-xs text-muted-foreground px-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                      <span>1–3 = Improvement</span>
                      <span>4–6 = Exceptional</span>
                    </div>
                    {val !== undefined && (
                      <p className="text-xs text-muted-foreground text-center">
                        Selected:{" "}
                        <span className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {val}
                        </span>{" "}
                        / 6
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue / Submit */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleContinue}
            disabled={submitting}
            className={clsx(
              "w-full max-w-md rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-2",
              "text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
            )}
            style={{ backgroundColor: "#3292BE" }}
          >
            {submitting ? (
              "Submitting…"
            ) : isLastPage ? (
              <>
                <Check className="w-4 h-4" />
                Submit Survey
              </>
            ) : (
              <>
                Continue to Page {pageIndex + 2}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground">
            {answeredOnPage} of {pageQuestions.length} questions answered on this page
          </p>
        </div>
      </main>
    </div>
  );
}
