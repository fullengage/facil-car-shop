import { Clock, Mail, MapPin } from "lucide-react";

/** Barra escura no topo: contato e horário à esquerda, redes à direita. */
export function TopBar() {
  return (
    <div className="bg-dark text-[14px] text-white/80">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2.5">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" aria-hidden />
            contato@facilcarshop.exemplo.com.br
          </li>
          <li className="hidden items-center gap-2 sm:flex">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            Atendemos 5 cidades
          </li>
          <li className="hidden items-center gap-2 md:flex">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            Seg a sáb · 9h às 18h
          </li>
        </ul>
        <ul className="flex items-center gap-4 text-[13px] font-medium uppercase tracking-wide">
          <li><a href="#" aria-label="Instagram" className="hover:text-primary">Instagram</a></li>
          <li><a href="#" aria-label="Facebook" className="hover:text-primary">Facebook</a></li>
          <li><a href="#" aria-label="YouTube" className="hover:text-primary">YouTube</a></li>
        </ul>
      </div>
    </div>
  );
}
