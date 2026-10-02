import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import htmcLogo from "@/imports/HTMC_Logo_-_blue.png";
import compassBg from "@/imports/compass_bg.png";
import { registerOrganization } from "../api";
import { clsx } from "clsx";
import {
  Search,
  Users,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  Copy,
  Check,
  Building2,
  Phone,
  Mail,
  Briefcase,
  Layers,
} from "lucide-react";

type FormState = {
  organization: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactJobTitle: string;
  facilities: string;
};

const EMPTY_FORM: FormState = {
  organization: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactJobTitle: "",
  facilities: "",
};

function Field({
  label,
  fieldKey,
  placeholder,
  type = "text",
  icon,
  value,
  error,
  onChange,
}: {
  label: string;
  fieldKey: keyof FormState;
  placeholder: string;
  type?: string;
  icon: React.ReactNode;
  value: string;
  error?: string;
  onChange: (key: keyof FormState, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
        className={clsx(
          "w-full rounded-lg border bg-white px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground",
          "focus:ring-2 focus:ring-primary/30 focus:border-primary",
          error ? "border-destructive ring-1 ring-destructive/30" : "border-border"
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    orgId: string;
    surveyKey: string;
    dashboardKey: string;
    url: string;
    dashboardUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [dashboardCopied, setDashboardCopied] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);

  function scrollToForm(e: React.MouseEvent) {
    e.preventDefault();
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setField(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate(): Partial<FormState> {
    const e: Partial<FormState> = {};
    if (!form.organization.trim()) e.organization = "Required";
    if (!form.contactName.trim()) e.contactName = "Required";
    if (!form.contactPhone.trim()) e.contactPhone = "Required";
    if (!form.contactEmail.trim()) e.contactEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = "Invalid email";
    if (!form.contactJobTitle.trim()) e.contactJobTitle = "Required";
    if (!form.facilities.trim()) e.facilities = "Required";
    else if (isNaN(Number(form.facilities)) || Number(form.facilities) < 1) e.facilities = "Must be a positive number";
    return e;
  }

  async function handleSubmit() {
    const e = validate();

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSubmitting(true);

    try {
      const registration = await registerOrganization({
        organization: form.organization.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        contactJobTitle: form.contactJobTitle.trim(),
        numberOfFacilities: Number(form.facilities)
      });

      const url = `${window.location.origin}/assess/${registration.surveyKey}`;
      const dashboardUrl = `${window.location.origin}/results/${registration.dashboardKey}`;

      setResult({
        orgId: String(registration.organizationId),
        surveyKey: registration.surveyKey,
        dashboardKey: registration.dashboardKey,
        url,
        dashboardUrl
      });
    } catch (error) {
      console.error("Organization registration failed:", error);

      setErrors((current) => ({
        ...current,
        organization: "Unable to register organization. Please try again."
      }));
    } finally {
      setSubmitting(false);
    }
  }

  function copyUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyDashboardUrl() {
    if (!result) return;
    navigator.clipboard.writeText(result.dashboardUrl);
    setDashboardCopied(true);
    setTimeout(() => setDashboardCopied(false), 2000);
  }

  const HOW_STEPS = [
    {
      n: "01",
      title: "Administer to your team",
      body: "Share the assessment link with your entire HTM department. Every team member completes the survey independently — no coordination required.",
    },
    {
      n: "02",
      title: "All submissions are anonymous",
      body: "Responses are fully anonymized before storage. Team members can answer honestly without concern for attribution.",
    },
    {
      n: "03",
      title: "Results dashboard with real insights",
      body: "As submissions come in, a live dashboard aggregates responses into a SWOT analysis with scored categories, trend indicators, and domain breakdowns.",
    },
    {
      n: "04",
      title: "Expert 1-hour action planning session",
      body: "An H.T.M. Consulting expert reviews your results with you, identifies your highest-priority opportunities, and co-creates a concrete roadmap for improvement.",
    },
  ];

  // HEADER_H must match the header's rendered height so scroll-padding-top
  // prevents sections from snapping under the sticky header.
  const HEADER_H = 66;

  return (
    <div
      ref={scrollRef}
      className="h-screen overflow-y-auto bg-background"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        scrollSnapType: "y proximity",
        scrollBehavior: "smooth",
        scrollPaddingTop: `${HEADER_H}px`,
      }}
    >
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <ImageWithFallback src={htmcLogo} alt="H.T.M. Consulting" className="h-10 w-auto object-contain" />
            <div className="border-l border-border pl-5">
              <h1 className="text-lg font-semibold leading-none text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                HTM Compass
              </h1>
              <p className="text-xs text-foreground/70 mt-0.5">Strategic Improvement Assessment</p>
            </div>
          </div>
          <button
            onClick={scrollToForm}
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#3292BE" }}
          >
            Get Started <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Hero / Section 1: What is HTM Compass? ── */}
      <section
        className="relative bg-white border-b border-border"
        style={{
          scrollSnapAlign: "start",
          backgroundImage: `url(${compassBg})`,
          backgroundSize: "cover",
          backgroundPosition: "top right",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 50% white overlay on mobile/tablet to dim the background image */}
        <div className="absolute inset-0 bg-white/50 lg:hidden pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#EBF5FB", color: "#3292BE" }}
            >
              What is HTM Compass?
            </span>
            <h2
              className="text-4xl font-bold text-foreground leading-tight mb-5"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >A strategic path<br></br>for your HTM department</h2>
            <p className="text-muted-foreground leading-relaxed mb-5">
              HTM Compass is a structured SWOT assessment built specifically for Healthcare Technology Management departments.
              It gives your team a clear picture of where you stand today — your internal strengths and weaknesses,
              and the external opportunities and threats shaping your environmentfor your HTM department.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The result is more than a snapshot. HTM Compass delivers scored insights, category breakdowns, and a
              facilitated action-planning session with an H.T.M. Consulting expert — so your findings translate directly
              into a prioritized roadmap your department can act on.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-8">
            {[
              { label: "Strengths", desc: "Internal capabilities you can build on", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
              { label: "Weaknesses", desc: "Internal gaps that limit your potential", color: "bg-rose-50 border-rose-200 text-rose-800" },
              { label: "Opportunities", desc: "External conditions working in your favor", color: "bg-blue-50 border-blue-200 text-blue-800" },
              { label: "Threats", desc: "External pressures you need to navigate", color: "bg-orange-50 border-orange-200 text-orange-800" },
            ].map((item) => (
              <div key={item.label} className={clsx("rounded-2xl border p-5 shadow-md", item.color)}>
                <p className="font-bold text-sm mb-1">{item.label}</p>
                <p className="text-xs opacity-70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 2: Who is it for? ── */}
      <section className="bg-background border-b border-border" style={{ scrollSnapAlign: "start" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#EBF5FB", color: "#3292BE" }}
            >
              Who is it for?
            </span>
            <h2
              className="text-3xl font-bold text-foreground leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Built for HTM departments ready to grow
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              HTM Compass is designed for Healthcare Technology Management departments that want more than a status quo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-6 h-6" style={{ color: "#3292BE" }} />,
                title: "Assess your current position",
                body: "Get an honest, data-driven picture of where your department stands across the dimensions that matter most — staffing, compliance, vendor relationships, technology, and more.",
              },
              {
                icon: <BarChart3 className="w-6 h-6" style={{ color: "#3292BE" }} />,
                title: "Find opportunities to improve",
                body: "Surface the specific areas where your team has the greatest potential for growth, with scores and trend analysis that make priorities obvious rather than debatable.",
              },
              {
                icon: <CalendarCheck className="w-6 h-6" style={{ color: "#3292BE" }} />,
                title: "Create a roadmap for action",
                body: "Turn your assessment results into a concrete improvement plan — with an expert in your corner to help translate findings into steps your department can own.",
              },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-border p-7">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#EBF5FB" }}
                >
                  {card.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {card.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: How does it work? ── */}
      <section className="bg-white border-b border-border" style={{ scrollSnapAlign: "start" }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#EBF5FB", color: "#3292BE" }}
            >
              How does it work?
            </span>
            <h2
              className="text-3xl font-bold text-foreground leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              From assessment to action in four steps
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The entire process is designed to be low-friction for your team and high-impact for your department.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="flex gap-5 bg-background rounded-2xl border border-border p-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor: "#3292BE", fontFamily: "'DM Mono', monospace" }}
                >
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Interest form ── */}
      <section ref={formSectionRef} id="get-started" className="bg-background py-20" style={{ scrollSnapAlign: "start" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
              style={{ backgroundColor: "#EBF5FB", color: "#3292BE" }}
            >
              Get started
            </span>
            <h2
              className="text-3xl font-bold text-foreground leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Register your organization
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Submit your details below. We will generate a unique assessment link for your team that you can
              distribute immediately.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {result ? (
              /* ── Success state ── */
              <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: "#EBF5FB" }}
                >
                  <Check className="w-8 h-8" style={{ color: "#3292BE" }} />
                </div>
                <h3
                  className="text-xl font-bold text-foreground mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  You are registered!
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Share the link below with your team to begin the assessment. Your organization ID is{" "}
                  <span className="font-mono font-semibold text-foreground">{result.orgId}</span>.
                </p>
                <p className="text-xs font-semibold text-foreground text-left mb-2">
                  Assessment Link
                </p>
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 mb-4">
                  <p className="flex-1 text-sm text-foreground font-mono truncate text-left">
                    {result.url}
                  </p>
                  <button
                    onClick={copyUrl}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 transition-all",
                      copied
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-border text-foreground hover:bg-secondary"
                    )}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="text-xs font-semibold text-foreground text-left mb-2">
                  Dashboard Link
                </p>
                <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3 mb-4">
                  <p className="flex-1 text-sm text-foreground font-mono truncate text-left">
                    {result.dashboardUrl}
                  </p>
                  <button
                    onClick={copyDashboardUrl}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 transition-all",
                      dashboardCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-border text-foreground hover:bg-secondary"
                    )}
                  >
                    {dashboardCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {dashboardCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => navigate(`/assess/${result.surveyKey}`)}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#3292BE" }}
                >
                  Begin Assessment <ChevronRight className="w-4 h-4" />
                </button>
                <p className="text-xs text-muted-foreground mt-3">
                  Save this link — it is unique to your organization and is how your team accesses the survey.
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <div className="bg-white rounded-2xl border border-border shadow-sm p-8">
                <div className="flex flex-col gap-5">
                  <Field
                    label="Organization"
                    fieldKey="organization"
                    placeholder="e.g. Regional Health Network"
                    icon={<Building2 className="w-3.5 h-3.5 text-muted-foreground" />}
                    value={form.organization}
                    error={errors.organization}
                    onChange={setField}
                  />

                  <div className="border-t border-border pt-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
                      Primary Contact
                    </p>
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                          label="Contact Name"
                          fieldKey="contactName"
                          placeholder="Full name"
                          icon={<Users className="w-3.5 h-3.5 text-muted-foreground" />}
                          value={form.contactName}
                          error={errors.contactName}
                          onChange={setField}
                        />
                        <Field
                          label="Job Title"
                          fieldKey="contactJobTitle"
                          placeholder="e.g. Director of HTM"
                          icon={<Briefcase className="w-3.5 h-3.5 text-muted-foreground" />}
                          value={form.contactJobTitle}
                          error={errors.contactJobTitle}
                          onChange={setField}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field
                          label="Phone Number"
                          fieldKey="contactPhone"
                          placeholder="(555) 000-0000"
                          type="tel"
                          icon={<Phone className="w-3.5 h-3.5 text-muted-foreground" />}
                          value={form.contactPhone}
                          error={errors.contactPhone}
                          onChange={setField}
                        />
                        <Field
                          label="Email Address"
                          fieldKey="contactEmail"
                          placeholder="you@organization.com"
                          type="email"
                          icon={<Mail className="w-3.5 h-3.5 text-muted-foreground" />}
                          value={form.contactEmail}
                          error={errors.contactEmail}
                          onChange={setField}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    <Field
                      label="Number of Facilities"
                      fieldKey="facilities"
                      placeholder="e.g. 3"
                      type="number"
                      icon={<Layers className="w-3.5 h-3.5 text-muted-foreground" />}
                      value={form.facilities}
                      error={errors.facilities}
                      onChange={setField}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="mt-2 w-full rounded-xl py-4 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                    style={{ backgroundColor: "#3292BE" }}
                  >
                    {submitting ? "Registering…" : "Register & Get Assessment Link"}
                    {!submitting && <ChevronRight className="w-4 h-4" />}
                  </button>

                  <p className="text-center text-xs text-muted-foreground">
                    Your information is used only to generate your unique assessment link and for follow-up by our team.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ImageWithFallback src={htmcLogo} alt="H.T.M. Consulting" className="h-7 w-auto object-contain" />
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} H.T.M. Consulting. All rights reserved.</span>
          </div>
          <span className="text-xs text-muted-foreground">HTM Compass — Strategic Improvement Assessment</span>
        </div>
      </footer>
    </div>
  );
}
