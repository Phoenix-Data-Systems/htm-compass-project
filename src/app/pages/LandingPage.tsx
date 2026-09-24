import { useState } from "react";
import { useNavigate } from "react-router";
import {
  generateToken,
  generateAnonymousId,
  slugify,
  saveRecord,
  getAllHospitals,
  selectRandomQuestions,
  TOTAL_QUESTIONS,
} from "../data";
import { Building2, ClipboardList, BarChart3, Shield, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import htmcLogo from "@/imports/HTMC_Logo_-_blue.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    organization: "",
    hospital: "",
    department: "",
    jobTitle: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const hospitals = getAllHospitals();

  function validate() {
    const e: Record<string, string> = {};
    if (!form.organization.trim()) e.organization = "Organization is required";
    if (!form.hospital.trim()) e.hospital = "Hospital / Facility is required";
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.jobTitle.trim()) e.jobTitle = "Job title is required";
    return e;
  }

  function handleBegin() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const token = generateToken();
    const anonymousId = generateAnonymousId();
    const hospitalSlug = slugify(form.hospital);
    const questionIds = selectRandomQuestions();
    saveRecord({
      participant: {
        token,
        anonymousId,
        organization: form.organization.trim(),
        hospital: form.hospital.trim(),
        hospitalSlug,
        department: form.department.trim(),
      },
      answers: {},
      completed: false,
      questionIds,
    });
    navigate(`/survey/${token}`);
  }

  function field(
    key: keyof typeof form,
    label: string,
    placeholder: string,
    type = "text"
  ) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/80">{label}</label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }));
            setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
          }}
          placeholder={placeholder}
          className={clsx(
            "w-full rounded-lg border bg-white px-4 py-3 text-sm text-foreground outline-none transition-all",
            "placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-primary/30 focus:border-primary",
            errors[key] ? "border-destructive ring-1 ring-destructive/30" : "border-border"
          )}
        />
        {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <ImageWithFallback
              src={htmcLogo}
              alt="H.T.M. Consulting"
              className="h-10 w-auto object-contain"
            />
            <div className="border-l border-border pl-5">
              <h1 className="text-lg font-semibold leading-none text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Strategic Improvement Assessment
              </h1>
              <p className="text-xs text-foreground/70 mt-0.5">Organizational Health Check-up</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Info */}
          <div className="flex flex-col gap-8">
            <div>
              <h2
                className="text-4xl font-bold text-foreground leading-tight mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                What is our Strategic Improvement Assessment?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                A structured assessment to evaluate your healthcare organization across four critical dimensions.
                Your responses are confidential and contribute to aggregated, anonymized insights.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { label: "Strengths", color: "bg-emerald-100 text-emerald-800 border-emerald-200", desc: "Internal assets" },
                  { label: "Weaknesses", color: "bg-rose-100 text-rose-800 border-rose-200", desc: "Areas to improve" },
                  { label: "Opportunities", color: "bg-blue-100 text-blue-800 border-blue-200", desc: "External gains" },
                  { label: "Threats", color: "bg-orange-100 text-orange-800 border-orange-200", desc: "External risks" },
                ] as const
              ).map((item) => (
                <div
                  key={item.label}
                  className={clsx("rounded-xl border p-4", item.color)}
                >
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Anonymous &amp; Confidential</p>
                  <p className="text-xs mt-0.5">Only an anonymous participant ID appears in results — no personal information is stored</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{TOTAL_QUESTIONS} Questions, 5 Pages</p>
                  <p className="text-xs mt-0.5">15 questions per page — rated 1 to 6</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Live Dashboard Per Hospital</p>
                  <p className="text-xs mt-0.5">Results auto-tagged into SWOT categories with aggregated averages</p>
                </div>
              </div>
            </div>

            {/* Existing hospital dashboards */}
            {hospitals.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-5">
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-accent" />
                  Active Dashboards
                </p>
                <div className="flex flex-col gap-2">
                  {hospitals.slice(0, 5).map((h) => (
                    <a
                      key={h.slug}
                      href={`/results/${h.slug}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-muted hover:bg-secondary transition-colors text-sm group"
                    >
                      <div>
                        <p className="font-medium text-foreground">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h.count} response{h.count !== 1 ? "s" : ""}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div>
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
              <h3
                className="text-xl font-semibold text-foreground mb-1"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Begin Your Assessment
              </h3>
              <p className="text-sm text-muted-foreground mb-7">
                Responses are stored anonymously. Only a generated participant ID appears in results.
              </p>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {field("organization", "Organization", "e.g. Regional Health Network")}
                  {field("hospital", "Hospital / Facility", "e.g. Mercy General Hospital")}
                </div>

                <div className="border-t border-border pt-5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                    Participant Information
                  </p>
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-foreground/80">Department / Unit</label>
                      <div className="relative">
                        <select
                          value={form.department}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, department: e.target.value }));
                            setErrors((er) => { const n = { ...er }; delete n.department; return n; });
                          }}
                          className={clsx(
                            "w-full rounded-lg border bg-white px-4 py-3 pr-10 text-sm text-foreground outline-none transition-all appearance-none",
                            "focus:ring-2 focus:ring-primary/30 focus:border-primary",
                            errors.department ? "border-destructive ring-1 ring-destructive/30" : "border-border",
                            !form.department && "text-muted-foreground"
                          )}
                        >
                          <option value="" disabled>Select a department…</option>
                          <option value="Clinical Engineering">Clinical Engineering</option>
                          <option value="Facilities Plant">Facilities Plant</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      {errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
                    </div>
                    {field("jobTitle", "Job Title", "e.g. Senior BMET")}
                  </div>
                </div>

                <button
                  onClick={handleBegin}
                  disabled={loading}
                  className={clsx(
                    "mt-2 w-full rounded-xl bg-primary text-primary-foreground py-4 text-sm font-semibold",
                    "flex items-center justify-center gap-2 transition-all",
                    "hover:bg-primary/90 active:scale-[0.99] disabled:opacity-60"
                  )}
                >
                  {loading ? "Starting…" : "Begin Survey"}
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Your responses are anonymous. A unique session link is generated on start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
