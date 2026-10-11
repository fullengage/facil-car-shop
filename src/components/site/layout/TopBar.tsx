import { Clock, Mail, MapPin } from "lucide-react";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33zM9.75 15.02V8.5l5.75 3.26z" />
    </svg>
  );
}

/** Barra escura no topo: contato e horário à esquerda, redes à direita. */
export function TopBar() {
  return (
    <div className="bg-dark text-[14px] text-white/80">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" aria-hidden />
            <a href="mailto:contato@facilcarshop.com.br" className="hover:text-primary transition-colors">
              contato@facilcarshop.com.br
            </a>
          </li>
          <li className="hidden items-center gap-2 sm:flex">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            <span>Encontre seu próximo carro sem sair da sua região.</span>
          </li>
          <li className="hidden items-center gap-2 md:flex">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            <span>Suporte de Seg a sáb · 9h às 18h</span>
          </li>
        </ul>
        <ul className="flex items-center gap-2.5">
          <li>
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <InstagramIcon className="h-3.5 w-3.5" />
            </a>
          </li>
          <li>
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <FacebookIcon className="h-3.5 w-3.5" />
            </a>
          </li>
          <li>
            <a
              href="https://www.facilcarshop.com.br/#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-primary hover:text-white"
            >
              <YoutubeIcon className="h-3.5 w-3.5" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
