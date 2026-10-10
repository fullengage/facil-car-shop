import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children: ReactNode;
}

/**
 * Link compatível com a API do Next (prop href).
 * Caminhos internos usam o roteador (sem recarregar a página); externos, mailto e tel usam <a>.
 */
export default function Link({ href, children, ...rest }: LinkProps) {
  const interno = href.startsWith("/");
  if (interno) {
    return (
      <RouterLink to={href} {...rest}>
        {children}
      </RouterLink>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
