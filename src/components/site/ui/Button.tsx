import Link from "@/components/site/Link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "dark" | "outline" | "light" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-dark",
  dark: "bg-dark text-white hover:bg-primary",
  outline: "border border-primary text-primary hover:bg-primary hover:text-white",
  light: "bg-white text-dark hover:bg-dark hover:text-white",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-[27px] py-[19px] text-[17px]",
};

export interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  type?: "button" | "submit";
  className?: string;
  onClick?: (e?: any) => void;
  disabled?: boolean;
}

/** Botão da marca: radius 5px, caixa alta, seta opcional à direita. Vira <a> quando recebe href. */
export function Button({
  children,
  href,
  variant = "primary",
  size = "lg",
  arrow = false,
  type = "button",
  className = "",
  onClick,
  disabled,
}: ButtonProps) {
  const sizeClass = sizes[size] || sizes.lg;
  const base = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-brand font-medium tracking-[0.6px] transition-colors duration-200 disabled:opacity-50 ${variants[variant] || variants.primary} ${sizeClass} ${className}`;
  
  const content = (
    <>
      {children}
      {arrow && <ArrowRight className="h-4 w-4" aria-hidden />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {content}
    </button>
  );
}
