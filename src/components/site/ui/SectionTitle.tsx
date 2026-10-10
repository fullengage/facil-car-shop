import type { ReactNode } from "react";

interface SectionTitleProps {
  eyebrow: string;
  title: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}

/** Eyebrow laranja com tracinho + título. Usado no topo de quase todas as seções. */
export function SectionTitle({ eyebrow, title, align = "left", tone = "dark", className = "" }: SectionTitleProps) {
  const center = align === "center";
  return (
    <div className={`reveal space-y-4 ${center ? "text-center" : ""} ${className}`}>
      <p className={`flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.8px] text-primary ${center ? "justify-center" : ""}`}>
        {center && <span className="h-px w-10 bg-primary" aria-hidden />}
        {eyebrow}
        <span className="h-px w-10 bg-primary" aria-hidden />
      </p>
      <h2 className={tone === "light" ? "text-white" : ""}>{title}</h2>
    </div>
  );
}
