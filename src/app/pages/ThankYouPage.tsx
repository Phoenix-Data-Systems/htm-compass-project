import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getRecord, type SurveyRecord } from "../data";
import { CheckCircle2, BarChart3, Home, Copy, Check } from "lucide-react";
import { clsx } from "clsx";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import htmcLogo from "@/imports/HTMC_Logo_-_blue.png";

export default function ThankYouPage() {
  const { token } = useParams<{ token: string }>();
  const [record, setRecord] = useState<SurveyRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) setRecord(getRecord(token));
  }, [token]);

  const dashboardUrl = record
    ? `${window.location.origin}/results/${record.participant.hospitalSlug}`
    : null;

  function copyLink() {
    if (!dashboardUrl) return;
    navigator.clipboard.writeText(dashboardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header className="bg-background border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <ImageWithFallback
            src={htmcLogo}
            alt="H.T.M. Consulting"
            className="h-9 w-auto object-contain"
          />
          <div className="border-l border-border pl-4">
            <p className="text-sm font-medium text-foreground">SWOT Analysis</p>
            <p className="text-xs text-foreground/70">Organizational Health Check-up</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-3xl border border-border shadow-sm p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h1
              className="text-3xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Survey Complete
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Thank you for completing the SWOT Analysis. Your responses have been recorded anonymously.
            </p>

            {record && (
              <div className="mt-6 rounded-xl bg-muted p-4 text-left text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hospital</span>
                  <span className="font-medium text-foreground">{record.participant.hospital}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{record.participant.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anonymous ID</span>
                  <span className="font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {record.participant.anonymousId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium text-foreground">
                    {record.participant.submittedAt
                      ? new Date(record.participant.submittedAt).toLocaleString()
                      : "Just now"}
                  </span>
                </div>
              </div>
            )}

            {dashboardUrl && (
              <div className="mt-6">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-2">
                  Hospital Results Dashboard
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-muted p-3">
                  <code className="flex-1 text-xs text-foreground truncate" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {dashboardUrl}
                  </code>
                  <button
                    onClick={copyLink}
                    className={clsx(
                      "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      copied
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white border border-border text-foreground hover:bg-secondary"
                    )}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {dashboardUrl && (
                <Link
                  to={dashboardUrl}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold hover:bg-primary/90 transition-all"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Dashboard
                </Link>
              )}
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-white text-foreground py-3.5 text-sm font-semibold hover:bg-muted transition-all"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
