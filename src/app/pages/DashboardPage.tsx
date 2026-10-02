import { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import { useParams, Link } from "react-router";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import htmcLogo from "@/imports/HTMC_Logo_-_blue.png";
import {
  SWOT_META,
  SWOT_TAGS,
  INTENSITY_META,
  calcStats,
  type SWOTTag,
  type QuestionStat,
} from "../data";
import {
  getOrganizationDashboard,
  type DashboardSummary
} from "../api";
import { clsx } from "clsx";
import { Building2, Users, Copy, Check, Home, TrendingUp, TrendingDown, FileDown } from "lucide-react";

function TrendIcon({ avg }: { avg: number }) {
  if (avg > 3.5) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
  return <TrendingDown className="w-4 h-4 text-rose-600" />;
}


interface BarPoint {
  id: string;
  name: string;
  fullText: string;
  avg: number;
  count: number;
  primaryTag: SWOTTag;
  hasData: boolean;
}

function SWOTBarChart({ data }: { data: BarPoint[] }) {
  const [tooltip, setTooltip] = useState<{ point: BarPoint; px: number; py: number } | null>(null);

  const W = 600, H = 260;
  const pad = { top: 12, right: 8, bottom: 36, left: 36 };
  const pw = W - pad.left - pad.right;
  const ph = H - pad.top - pad.bottom;

  const yMin = 0, yMax = 6;
  const yScale = (v: number) => ph - ((v - yMin) / (yMax - yMin)) * ph;
  const refY = yScale(3.5);

  const barCount = data.length;
  const barGap = 1;
  const barW = Math.max(1, pw / barCount - barGap);

  const yTicks = [0, 1, 2, 3, 4, 5, 6];
  const xTickIndices = [0, 9, 19, 29, 39, 49];

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ fontFamily: "'DM Mono', monospace" }}
        onMouseLeave={() => setTooltip(null)}
      >
        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Y grid lines */}
          {yTicks.map((v) => (
            <line key={`gy-${v}`} x1={0} y1={yScale(v)} x2={pw} y2={yScale(v)}
              stroke="#e2e8f0" strokeWidth={v === 0 ? 0 : 1} />
          ))}

          {/* Reference line at 3.5 */}
          <line x1={0} y1={refY} x2={pw} y2={refY} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />
          <text x={pw + 2} y={refY} dominantBaseline="middle" fontSize={8} fill="#94a3b8">3.5</text>

          {/* Bars */}
          {data.map((d, i) => {
            const x = i * (barW + barGap);
            const barH = d.hasData ? Math.max(2, ph - yScale(d.avg)) : 0;
            const y = d.hasData ? yScale(d.avg) : ph;
            const fill = d.hasData ? SWOT_META[d.primaryTag].hexColor : "#e2e8f0";
            return (
              <rect
                key={d.id}
                x={x}
                y={y}
                width={barW}
                height={barH}
                fill={fill}
                fillOpacity={0.85}
                rx={1}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement!;
                  const rect = svg.getBoundingClientRect();
                  const scaleX = W / rect.width;
                  const scaleY = H / rect.height;
                  setTooltip({
                    point: d,
                    px: (pad.left + x + barW / 2) / scaleX,
                    py: (pad.top + y) / scaleY,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Y axis ticks */}
          {yTicks.map((v) => (
            <g key={`yt-${v}`}>
              <line x1={-3} y1={yScale(v)} x2={0} y2={yScale(v)} stroke="#94a3b8" strokeWidth={1} />
              <text x={-6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#94a3b8">{v}</text>
            </g>
          ))}

          {/* X axis labels */}
          {xTickIndices.map((i) => {
            const d = data[i];
            if (!d) return null;
            const x = i * (barW + barGap) + barW / 2;
            return (
              <text key={`xt-${i}`} x={x} y={ph + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {d.name}
              </text>
            );
          })}

          {/* Plot border bottom */}
          <line x1={0} y1={ph} x2={pw} y2={ph} stroke="#e2e8f0" strokeWidth={1} />
        </g>
      </svg>

      {/* Floating tooltip */}
      {tooltip && (() => {
        const meta = SWOT_META[tooltip.point.primaryTag];
        const flipX = tooltip.px > 55;
        return (
          <div
            className="pointer-events-none absolute z-10 bg-white border border-border rounded-xl p-3 shadow-lg text-xs max-w-[220px]"
            style={{
              left: flipX ? tooltip.px - 8 : tooltip.px + 8,
              top: Math.max(0, tooltip.py - 60),
              transform: flipX ? "translateX(-100%)" : undefined,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <p className="font-bold text-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              {tooltip.point.id}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-2 line-clamp-3">{tooltip.point.fullText}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.hexColor }} />
              <span className={clsx("font-semibold", meta.color)}>{meta.label}</span>
              <span className="ml-auto font-mono font-bold text-foreground">
                {tooltip.point.hasData ? Math.round(tooltip.point.avg) : "\u2014"}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function DashboardPage() {
  const { dashboardKey } = useParams<{ dashboardKey: string }>();

  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [organizationName, setOrganizationName] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTag, setActiveTag] = useState<SWOTTag>("strengths");
  const [exporting, setExporting] = useState(false);
  const [pdfMode, setPdfMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  async function handleExportPdf() {
    if (!printRef.current) return;
    setExporting(true);
    // Expand all four SWOT tag tables so they appear in the PDF.
    // flushSync forces the DOM update to complete before we proceed.
    flushSync(() => setPdfMode(true));
    // Give the browser one tick to apply styles before capture.
    await new Promise<void>((resolve) => setTimeout(resolve, 80));
    try {
      // dom-to-image-more uses SVG foreignObject rendering (the browser's own engine),
      // so it handles oklch and all modern CSS that html2canvas can't parse.
      const [{ default: domtoimage }, { default: jsPDF }] = await Promise.all([
        import("dom-to-image-more"),
        import("jspdf"),
      ]);

      const dataUrl = await (domtoimage as any).toPng(printRef.current, {
        scale: 2,
        bgcolor: "#ffffff",
      });

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = dataUrl;
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (img.naturalHeight * imgW) / img.naturalWidth;
      let yPos = 0;
      let remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(dataUrl, "PNG", 0, -yPos, imgW, imgH);
        remaining -= pageH;
        if (remaining > 0) { pdf.addPage(); yPos += pageH; }
      }
      pdf.save(`${dashboardKey ?? "dashboard"}-swot-report.pdf`);
    } finally {
      setPdfMode(false);
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!dashboardKey) {
      setLoadError(true);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDashboardData() {
      setLoading(true);
      setLoadError(false);

      try {
        const dashboardResponse = await getOrganizationDashboard(
          dashboardKey
        );

        if (cancelled) return;

        setDashboard(dashboardResponse.dashboard);
        setOrganizationName(dashboardResponse.organizationName);
      } catch (error) {
        console.error("Unable to load dashboard", error);

        if (!cancelled) {
          setDashboard(null);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [dashboardKey]);

  function categoryToTag(category: string): SWOTTag {
    switch (category) {
      case "Strength":
        return "strengths";
      case "Weakness":
        return "weaknesses";
      case "Opportunity":
        return "opportunities";
      case "Threat":
        return "threats";
      default:
        return "weaknesses";
    }
  }

  function dashboardIntensity(
    avg: number,
    tag: SWOTTag
  ): QuestionStat["intensity"] {
    const positive = tag === "strengths" || tag === "opportunities";

    if (positive) {
      if (avg >= 5.5) return "critical-positive";
      if (avg >= 4.5) return "clear-positive";
      return "mild-positive";
    }

    if (avg > 2.5) return "mild-negative";
    if (avg >= 1.5) return "clear-negative";
    return "critical-negative";
  }

  const questionStats: QuestionStat[] = (dashboard?.questions ?? []).map((q) => {
    const scores = Object.entries(q.distribution ?? {}).flatMap(
      ([value, count]) =>
        Array.from({ length: Number(count) }, () => Number(value))
    );

    const primaryTag = categoryToTag(q.swotCategory);
    const classification =
      q.domain.toLowerCase() === "external" ? "external" : "internal";

    return {
      question: {
        id: `S${String(q.statementId).padStart(3, "0")}`,
        text: q.statement,
        classification,
        theme: q.theme,
        scoreDirection: "positive",
      },
      scores,
      avg: q.averageScore,
      stats: {
        avg: q.averageScore,
        median: q.medianScore,
        min: q.minScore,
        max: q.maxScore,
        count: q.responseCount,
      },
      tags: [primaryTag],
      primaryTag,
      intensity: dashboardIntensity(q.averageScore, primaryTag),
    };
  });

  const tagSummaries = SWOT_TAGS.map((tag) => {
    const questions = questionStats.filter(
      (question) => question.primaryTag === tag
    );

    return {
      tag,
      questions,
      stats: calcStats(questions.flatMap((question) => question.scores)),
    };
  });

  const records = dashboard?.respondentDetails ?? [];
  const hospitalName = records[0]?.facility ?? "Hospital";

  const overallAvg = dashboard?.overallScore ?? 0;
  const answeredCount = dashboard?.questionsAnalyzed ?? 0;

  // SWOT Index: S=+2, O=+1, W=-1, T=-2
  const SWOT_WEIGHTS: Record<SWOTTag, number> = { strengths: 2, opportunities: 1, weaknesses: -1, threats: -2 };
  const swotIndex = dashboard?.swotIndex ?? 0;

  // Overall classification from swot index
  const strengthCount = tagSummaries.find(t => t.tag === "strengths")!.questions.length;
  const opportunityCount = tagSummaries.find(t => t.tag === "opportunities")!.questions.length;
  const weaknessCount = tagSummaries.find(t => t.tag === "weaknesses")!.questions.length;
  const threatCount = tagSummaries.find(t => t.tag === "threats")!.questions.length;

  const overallTag: SWOTTag | null = answeredCount > 0
    ? (swotIndex >= 0
      ? (strengthCount >= opportunityCount ? "strengths" : "opportunities")
      : (weaknessCount >= threatCount ? "weaknesses" : "threats"))
    : null;

  // Distribution chart order: T -> W -> O -> S
  const DIST_ORDER: SWOTTag[] = ["threats", "weaknesses", "opportunities", "strengths"];
  const distributionData = DIST_ORDER.map((tag) => {
    const summary = tagSummaries.find((t) => t.tag === tag)!;
    return { tag, count: summary.questions.length, pct: (summary.questions.length / Math.max(answeredCount, 1)) * 100 };
  });
  const maxDistCount = Math.max(...distributionData.map((d) => d.count), 1);

  // Top 5 strengths (highest avg) and top 5 threats (lowest avg)
  const topStrengths = questionStats
    .filter((qs) => qs.primaryTag === "strengths" && qs.scores.length > 0)
    .sort((a, b) => b.stats.avg - a.stats.avg)
    .slice(0, 5);
  const topThreats = questionStats
    .filter((qs) => qs.primaryTag === "threats" && qs.scores.length > 0)
    .sort((a, b) => a.stats.avg - b.stats.avg)
    .slice(0, 5);

  // TOWS quadrant data
  const towsStrengths = questionStats.filter(qs => qs.primaryTag === "strengths" && qs.scores.length > 0);
  const towsWeaknesses = questionStats.filter(qs => qs.primaryTag === "weaknesses" && qs.scores.length > 0);
  const towsOpportunities = questionStats.filter(qs => qs.primaryTag === "opportunities" && qs.scores.length > 0);
  const towsThreats = questionStats.filter(qs => qs.primaryTag === "threats" && qs.scores.length > 0);

  // Domain matrix - dynamic, grouped by theme tag from question data
  const themes = [...new Set(questionStats.map(q => q.question.theme))];
  const domainRows = themes.map((theme) => {
    const qs = questionStats.filter(q => q.question.theme === theme);
    const scores = qs.flatMap((q) => q.scores);
    const avg = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
    const tagCounts: Record<SWOTTag, number> = { strengths: 0, weaknesses: 0, opportunities: 0, threats: 0 };
    qs.filter(q => q.scores.length > 0).forEach(q => tagCounts[q.primaryTag]++);
    const dominantTag = (Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as SWOTTag) || null;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    scores.forEach((s) => { dist[s] = (dist[s] ?? 0) + 1; });
    const distPcts = [1, 2, 3, 4, 5, 6].map((v) => ({ value: v, pct: scores.length > 0 ? (dist[v] / scores.length) * 100 : 0 }));
    return { name: theme, avg, tag: dominantTag, tagCounts, responseCount: scores.length, distPcts };
  }).sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

  // Bar chart data: all 50 questions
  const barData = questionStats.map((qs) => ({
    id: qs.question.id,
    name: qs.question.id,
    fullText: qs.question.text,
    avg: qs.scores.length ? qs.stats.avg : 0,
    count: qs.stats.count,
    primaryTag: qs.primaryTag,
    hasData: qs.scores.length > 0,
  }));

  const activeTagSummary = tagSummaries.find((t) => t.tag === activeTag);
  const activeMeta = SWOT_META[activeTag];

  function renderTagTable(tag: SWOTTag) {
    const meta = SWOT_META[tag];
    const tagSummary = tagSummaries.find((t) => t.tag === tag);
    return (
      <div key={tag} className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border" style={{ backgroundColor: `${meta.hexColor}12` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: meta.hexColor }}>
            {tag[0].toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">{meta.label} {"\u2014"} Tagged Questions</h4>
            <p className="text-xs text-muted-foreground">{tagSummary?.questions.length ?? 0} questions {"\u00B7"} {records.length} respondents</p>
          </div>
        </div>
        {(tagSummary?.questions.length ?? 0) === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground text-sm">
            No questions currently tagged as {meta.label}. More responses may shift the averages.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium w-16">ID</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Question</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium w-20">Avg</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium w-20">Median</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium w-16">Min</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium w-16">Max</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium w-32">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {tagSummary?.questions.map((qs: QuestionStat) => {
                  const avg = qs.stats.avg;
                  const fillPct = ((avg - 1) / 5) * 100;
                  return (
                    <tr key={qs.question.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-semibold text-muted-foreground">{qs.question.id}</td>
                      <td className="px-4 py-4 text-sm text-foreground max-w-xs">
                        <p className="leading-relaxed">{qs.question.text}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{qs.question.theme}</span>
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{qs.question.classification}</span>
                          {qs.scores.length > 0 && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: INTENSITY_META[qs.intensity].color }}>
                              {INTENSITY_META[qs.intensity].label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-base" style={{ color: meta.hexColor, fontFamily: "'DM Mono', monospace" }}>
                          {qs.stats.count > 0 ? Math.round(avg) : "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-sm text-foreground">{qs.stats.count > 0 ? Math.round(qs.stats.median) : "\u2014"}</td>
                      <td className="px-4 py-4 text-center font-mono text-sm text-muted-foreground">{qs.stats.count > 0 ? qs.stats.min : "\u2014"}</td>
                      <td className="px-4 py-4 text-center font-mono text-sm text-muted-foreground">{qs.stats.count > 0 ? qs.stats.max : "\u2014"}</td>
                      <td className="px-4 py-4">
                        {qs.stats.count > 0 ? (
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, backgroundColor: meta.hexColor, opacity: 0.8 }} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No data</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const dashboardUrl = dashboardKey
    ? `${window.location.origin}/results/${dashboardKey}`
    : window.location.href;

  function copyLink() {
    navigator.clipboard.writeText(dashboardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const EmptyState = () => (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ImageWithFallback src={htmcLogo} alt="H.T.M. Consulting" className="h-9 w-auto object-contain" />
            <div className="border-l border-border pl-4">
              <span className="font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                SWOT Analysis Dashboard
              </span>
            </div>
          </div>
          <Link to="/" className="text-sm text-foreground/70 hover:text-foreground flex items-center gap-1.5 transition-colors">
            <Home className="w-3.5 h-3.5" /> Home
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            No Results Yet
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            No completed survey responses found for <strong>{hospitalName}</strong>. Share the survey link to collect responses.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <Home className="w-4 h-4" /> Back to Survey
          </Link>
        </div>
      </main>
    </div>
  );

  if (loading) return null;
  if (loadError || !dashboard || records.length === 0) return <EmptyState />;

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <ImageWithFallback src={htmcLogo} alt="H.T.M. Consulting" className="h-10 w-auto object-contain shrink-0" />
              <div className="border-l border-border pl-5">
                {organizationName && (
                  <p className="text-xs text-foreground/70 uppercase tracking-widest font-medium mb-0.5">{organizationName}</p>
                )}
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {hospitalName}
                </h1>
                <p className="text-sm text-foreground/70 mt-0.5">SWOT Analysis Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-2 text-sm text-foreground">
                <Users className="w-4 h-4 text-foreground/70" />
                <span className="font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>{records.length}</span>
                <span className="text-foreground/70">response{records.length !== 1 ? "s" : ""}</span>
              </div>
              <button
                onClick={copyLink}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  copied ? "bg-emerald-600 text-white" : "bg-muted text-foreground hover:bg-secondary"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-muted text-foreground hover:bg-secondary transition-all"
              >
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#3292BE" }}
              >
                <FileDown className="w-3.5 h-3.5" />
                {exporting ? "Exporting\u2026" : "Export PDF"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main ref={printRef} className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Section 1: Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Overall Score */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">Overall Score</p>
            <div className="flex items-end gap-2 mb-2">
              <p className="leading-none text-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: "3rem", fontWeight: 700 }}>
                {overallAvg > 0 ? Math.round(overallAvg) : "\u2014"}
              </p>
              <p className="text-muted-foreground mb-1">/ 6.0</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(overallAvg / 6) * 100}%`, background: "linear-gradient(to right, #6BB1D0, #3292BE)" }} />
            </div>
            {overallTag && (
              <span className={clsx("inline-block text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mt-1", SWOT_META[overallTag].bgColor, SWOT_META[overallTag].color)}>
                Classification: {SWOT_META[overallTag].label}
              </span>
            )}
          </div>

          {/* SWOT Index */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">SWOT Index Score</p>
            <p className="leading-none mb-3" style={{ fontFamily: "'DM Mono', monospace", fontSize: "3rem", fontWeight: 700, color: swotIndex >= 0 ? "#16a34a" : "#dc2626" }}>
              {swotIndex > 0 ? "+" : ""}{swotIndex}
            </p>
            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {tagSummaries.map(({ tag, questions: tQs }) => (
                <span key={tag}>
                  {tQs.length} {SWOT_META[tag].label} {"\u00D7"} {SWOT_WEIGHTS[tag] > 0 ? "+" : ""}{SWOT_WEIGHTS[tag]} = {tQs.length > 0 ? (tQs.length * SWOT_WEIGHTS[tag] > 0 ? "+" : "") + (tQs.length * SWOT_WEIGHTS[tag]) : "0"}
                </span>
              ))}
            </div>
          </div>

          {/* Questions + Respondents */}
          <div className="bg-white rounded-2xl border border-border p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Questions Analyzed</p>
              <p className="leading-none" style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.5rem", fontWeight: 700, color: "var(--foreground)" }}>
                {answeredCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">of {questionStats.length} total</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Respondents</p>
              <p className="leading-none" style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.5rem", fontWeight: 700, color: "var(--foreground)" }}>
                {records.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">completed surveys</p>
            </div>
          </div>
        </div>

        {/* Section 2: SWOT Category KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {tagSummaries.map(({ tag, stats, questions: tagQs }) => {
            const meta = SWOT_META[tag];
            return (
              <div
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={clsx("rounded-2xl border-2 p-5 cursor-pointer transition-all", meta.bgColor, meta.borderColor, activeTag === tag && "ring-2 ring-offset-2")}
                style={activeTag === tag ? { ringColor: meta.hexColor } : {}}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={clsx("text-xs font-bold uppercase tracking-widest", meta.color)}>{meta.label}</span>
                  <TrendIcon avg={stats.avg} />
                </div>
                <p className={clsx("leading-none", meta.color)} style={{ fontFamily: "'DM Mono', monospace", fontSize: "2.25rem", fontWeight: 700 }}>
                  {tagQs.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">question{tagQs.length !== 1 ? "s" : ""} tagged</p>
                <p className={clsx("text-sm font-semibold mt-2", meta.color)} style={{ fontFamily: "'DM Mono', monospace" }}>
                  {stats.count > 0 ? `avg ${Math.round(stats.avg)}` : "no data"}
                </p>
              </div>
            );
          })}
        </div>

        {/* Section 3: SWOT Distribution Chart */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            SWOT Distribution
          </h3>
          <p className="text-xs text-muted-foreground mb-5">Count of questions in each SWOT category, ordered by severity.</p>
          <div className="flex flex-col gap-3">
            {distributionData.map(({ tag, count, pct }) => {
              const meta = SWOT_META[tag];
              const barPct = (count / maxDistCount) * 100;
              return (
                <div key={tag} className="flex items-center gap-4">
                  <span className={clsx("text-xs font-semibold w-28 shrink-0 text-right", meta.color)}>{meta.label}</span>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg transition-all duration-500 flex items-center"
                      style={{ width: `${barPct}%`, backgroundColor: meta.hexColor, opacity: 0.85, minWidth: count > 0 ? "2rem" : 0 }}
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 w-28">
                    <span className="font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{count}</span>
                    <span className="text-xs text-muted-foreground">({pct.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Top Findings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { label: "Top Strengths", items: topStrengths, tag: "strengths" as SWOTTag, desc: "Highest-scoring questions" },
            { label: "Top Threats", items: topThreats, tag: "threats" as SWOTTag, desc: "Lowest-scoring questions \u2014 highest risk" },
          ].map(({ label, items, tag, desc }) => {
            const meta = SWOT_META[tag];
            return (
              <div key={tag} className={clsx("rounded-2xl border-2 p-5", meta.bgColor, meta.borderColor)}>
                <p className={clsx("text-xs font-bold uppercase tracking-widest", meta.color)}>{label}</p>
                <p className="text-[10px] text-muted-foreground mb-4 mt-0.5">{desc}</p>
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No questions tagged yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((qs, i) => (
                      <div key={qs.question.id} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5" style={{ backgroundColor: meta.hexColor }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-muted-foreground font-mono">{qs.question.id} {"\u00B7"} {qs.question.theme}</p>
                          <p className="text-xs text-foreground leading-snug line-clamp-2">{qs.question.text}</p>
                          <span
                            className="inline-block text-[9px] font-semibold uppercase tracking-wide px-1 py-0.5 rounded text-white mt-1"
                            style={{ backgroundColor: INTENSITY_META[qs.intensity].color }}
                          >
                            {INTENSITY_META[qs.intensity].label}
                          </span>
                        </div>
                        <span className="text-sm font-bold shrink-0" style={{ color: meta.hexColor, fontFamily: "'DM Mono', monospace" }}>
                          {Math.round(qs.stats.avg)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section 5: TOWS Matrix */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            TOWS Strategic Matrix
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            The TOWS method combines your SWOT results into four strategic directions.
            Internal factors (Strengths/Weaknesses) {"\u00D7"} External factors (Opportunities/Threats).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SO */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">SO</span>
                <p className="text-sm font-semibold text-emerald-700">Leverage Strengths {"\u00D7"} Opportunities</p>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Use your strongest internal capabilities to capture favorable external conditions.</p>
              <div className="flex gap-4 text-xs mb-3">
                <span className="text-emerald-700 font-semibold">{towsStrengths.length} Strengths</span>
                <span className="text-blue-700 font-semibold">{towsOpportunities.length} Opportunities</span>
              </div>
              {towsStrengths.slice(0, 3).map(qs => (
                <div key={qs.question.id} className="flex items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{qs.question.id} {"\u00B7"} {qs.question.theme}</span>
                  <p className="text-[11px] text-foreground leading-snug line-clamp-1">{qs.question.text}</p>
                  <span className="text-[11px] font-bold text-emerald-600 shrink-0 ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(qs.stats.avg)}</span>
                </div>
              ))}
              {towsStrengths.length === 0 && <p className="text-xs text-muted-foreground">No strengths identified yet.</p>}
            </div>
            {/* ST */}
            <div className="bg-white rounded-2xl border-2 border-orange-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">ST</span>
                <p className="text-sm font-semibold text-orange-700">Deploy Strengths vs. Threats</p>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Apply existing strengths to minimize or neutralize external threats.</p>
              <div className="flex gap-4 text-xs mb-3">
                <span className="text-emerald-700 font-semibold">{towsStrengths.length} Strengths</span>
                <span className="text-orange-700 font-semibold">{towsThreats.length} Threats</span>
              </div>
              {towsThreats.slice(0, 3).map(qs => (
                <div key={qs.question.id} className="flex items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{qs.question.id} {"\u00B7"} {qs.question.theme}</span>
                  <p className="text-[11px] text-foreground leading-snug line-clamp-1">{qs.question.text}</p>
                  <span className="text-[11px] font-bold text-orange-600 shrink-0 ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(qs.stats.avg)}</span>
                </div>
              ))}
              {towsThreats.length === 0 && <p className="text-xs text-muted-foreground">No threats identified yet.</p>}
            </div>
            {/* WO */}
            <div className="bg-white rounded-2xl border-2 border-blue-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">WO</span>
                <p className="text-sm font-semibold text-blue-700">Improve Weaknesses via Opportunities</p>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Address internal gaps by leveraging external opportunities to overcome them.</p>
              <div className="flex gap-4 text-xs mb-3">
                <span className="text-rose-700 font-semibold">{towsWeaknesses.length} Weaknesses</span>
                <span className="text-blue-700 font-semibold">{towsOpportunities.length} Opportunities</span>
              </div>
              {towsWeaknesses.slice(0, 3).map(qs => (
                <div key={qs.question.id} className="flex items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{qs.question.id} {"\u00B7"} {qs.question.theme}</span>
                  <p className="text-[11px] text-foreground leading-snug line-clamp-1">{qs.question.text}</p>
                  <span className="text-[11px] font-bold text-rose-600 shrink-0 ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(qs.stats.avg)}</span>
                </div>
              ))}
              {towsWeaknesses.length === 0 && <p className="text-xs text-muted-foreground">No weaknesses identified yet.</p>}
            </div>
            {/* WT */}
            <div className="bg-white rounded-2xl border-2 border-rose-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center shrink-0">WT</span>
                <p className="text-sm font-semibold text-rose-700">Minimize Weaknesses & Avoid Threats</p>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Critical risk areas {"\u2014"} internal weaknesses exposed to external threats require immediate attention.</p>
              <div className="flex gap-4 text-xs mb-3">
                <span className="text-rose-700 font-semibold">{towsWeaknesses.length} Weaknesses</span>
                <span className="text-orange-700 font-semibold">{towsThreats.length} Threats</span>
              </div>
              {[...towsWeaknesses, ...towsThreats].sort((a, b) => a.stats.avg - b.stats.avg).slice(0, 3).map(qs => (
                <div key={qs.question.id} className="flex items-start gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{qs.question.id} {"\u00B7"} {qs.question.theme}</span>
                  <p className="text-[11px] text-foreground leading-snug line-clamp-1">{qs.question.text}</p>
                  <span className="text-[11px] font-bold text-rose-600 shrink-0 ml-auto" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(qs.stats.avg)}</span>
                </div>
              ))}
              {towsWeaknesses.length === 0 && towsThreats.length === 0 && <p className="text-xs text-muted-foreground">No critical areas identified yet.</p>}
            </div>
          </div>

        </div>

        {/* Section 6: Domain SWOT Matrix with response distribution */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
              Domain SWOT Matrix
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked strongest {"\u2192"} weakest. Response distribution shown to surface hidden risks masked by averages.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium w-6">Rank</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Domain</th>
                  <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium w-20">Avg</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium w-40">SWOT Breakdown</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium w-48">Response Distribution (1{"\u2013"}6)</th>
                </tr>
              </thead>
              <tbody>
                {domainRows.map((row, rank) => {
                  const SCORE_COLORS = ["#dc2626", "#f97316", "#eab308", "#65a30d", "#16a34a", "#15803d"];
                  return (
                    <tr key={row.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-semibold text-muted-foreground">#{rank + 1}</td>
                      <td className="px-4 py-4 text-sm font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold" style={{ color: row.avg !== null ? (row.avg >= 3.5 ? "#16a34a" : "#dc2626") : "#94a3b8", fontFamily: "'DM Mono', monospace" }}>
                          {row.avg !== null ? Math.round(row.avg) : "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {row.responseCount > 0 && row.tagCounts ? (
                          <div className="flex flex-wrap gap-1">
                            {(["strengths", "weaknesses", "opportunities", "threats"] as SWOTTag[]).map(tag => {
                              const count = row.tagCounts![tag];
                              if (count === 0) return null;
                              const m = SWOT_META[tag];
                              return (
                                <span key={tag} className={clsx("text-[10px] font-semibold px-1.5 py-0.5 rounded", m.bgColor, m.color)}>
                                  {m.label[0]}: {count}
                                </span>
                              );
                            })}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">No data</span>}
                      </td>
                      <td className="px-4 py-4">
                        {row.responseCount > 0 ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex h-3 rounded overflow-hidden gap-px">
                              {row.distPcts.map(({ value, pct }) => (
                                pct > 0 && (
                                  <div key={value} style={{ width: `${pct}%`, backgroundColor: SCORE_COLORS[value - 1] }} title={`Score ${value}: ${pct.toFixed(0)}%`} />
                                )
                              ))}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {row.distPcts.filter(d => d.pct > 0).map(({ value, pct }) => (
                                <span key={value} className="text-[9px] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                                  {value}:{pct.toFixed(0)}%
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">No data</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Full question bar chart */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h3
            className="text-base font-semibold text-foreground mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            All Questions {"\u2014"} Average Score by SWOT Tag
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Each bar represents one question (Q01{"\u2013"}Q73), colored by its primary SWOT tag based on average score. Hover for details.
          </p>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            {SWOT_TAGS.map((tag) => (
              <div key={tag} className="flex items-center gap-1.5 text-xs text-foreground/70">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SWOT_META[tag].hexColor }} />
                {SWOT_META[tag].label}
              </div>
            ))}
          </div>
          <SWOTBarChart data={barData} />
        </div>

        {/* Per-tag question breakdown */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Questions by SWOT Category
            </h3>
          </div>

          {/* Tab selector - hidden during PDF export */}
          {!pdfMode && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {SWOT_TAGS.map((tag) => {
                const meta = SWOT_META[tag];
                const isActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={clsx(
                      "rounded-lg px-4 py-2 text-xs font-semibold transition-all border-2",
                      isActive ? "text-white border-transparent" : clsx("bg-white", meta.color, meta.borderColor)
                    )}
                    style={isActive ? { backgroundColor: meta.hexColor, borderColor: meta.hexColor } : {}}
                  >
                    {meta.label}
                    <span className="ml-1.5 opacity-75">({tagSummaries.find((t) => t.tag === tag)?.questions.length ?? 0})</span>
                  </button>
                );
              })}
            </div>
          )}

          {pdfMode ? (
            /* PDF export: all four categories expanded */
            <div className="flex flex-col gap-8">
              {SWOT_TAGS.map((tag) => (
                <div key={tag}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: SWOT_META[tag].hexColor }}>
                    {SWOT_META[tag].label}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{SWOT_META[tag].description}</p>
                  {renderTagTable(tag)}
                </div>
              ))}
            </div>
          ) : (
            /* Normal view: single active tab */
            <>
              <p className="text-xs text-muted-foreground mb-4">{activeMeta.description}</p>
              {renderTagTable(activeTag)}
            </>
          )}
        </div>

        {/* Respondents table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              Respondents ({records.length})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Names, emails, and job titles are masked. Only anonymous IDs are stored.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium">Anonymous ID</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Department</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Submitted</th>
                  <th className="text-center px-3 py-3 text-xs text-muted-foreground font-medium">Answered</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  return (
                    <tr key={r.anonymousId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs font-semibold text-foreground">
                        {r.anonymousId}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{r.department ?? "-"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.submittedAt
                          ? new Date(r.submittedAt).toLocaleDateString()
                          : "\u2014"}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-mono text-foreground">
                        {r.answeredCount} / {questionStats.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
