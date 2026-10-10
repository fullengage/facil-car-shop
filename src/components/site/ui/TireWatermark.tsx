/** Marca d'água de pneu em cinza muito claro, nas laterais de seções brancas. Decorativa (aria-hidden). */
export function TireWatermark({ side = "left", className = "" }: { side?: "left" | "right"; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 400"
      className={`pointer-events-none absolute top-0 h-full w-[200px] text-[#f0f0f0] ${side === "left" ? "left-0" : "right-0 scale-x-[-1]"} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="14"
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={i * 24 - 10} y="-10" width="18" height="420" rx="3" fill="currentColor" stroke="none" transform={`skewY(${-6 + i * 0.4})`} />
      ))}
    </svg>
  );
}
