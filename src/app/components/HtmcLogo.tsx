export function HtmcLogo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ fontFamily: "'Playfair Display', serif" }}>
      <span className="font-bold tracking-tight" style={{ color: "#3292BE", fontSize: "1.1em" }}>
        H.T.M.
      </span>
      <span className="font-semibold text-foreground" style={{ fontSize: "1.1em" }}>
        {" "}Consulting
      </span>
    </div>
  );
}
