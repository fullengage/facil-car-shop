const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../classificados-carros/components/layout/Header.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldNav = `const NAV = [
  { label: "Comprar", href: "/carros" },
  { label: "Lojas", href: "/lojas" },
  { label: "Marcas", href: "/#marcas" },
  { label: "Blog", href: "/#blog" },
  { label: "Contato", href: "/#anuncie" },
];`;

const newNav = `const NAV = [
  { label: "Comprar", href: "/carros" },
  { label: "Lojas", href: "/lojas" },
  { label: "Marcas", href: "/#marcas" },
  { label: "Blog", href: "/#blog" },
  { label: "Contato", href: "/#anuncie" },
  { label: "Painel / CRM", href: "/painel" },
];`;

content = content.replace(oldNav, newNav);

const oldBtn = `<div className="flex items-center gap-3">
          <Link
            href="/#anuncie"
            className="hidden rounded-brand bg-primary px-6 py-3.5 text-[15px] font-medium uppercase tracking-[0.6px] text-white transition-colors hover:bg-dark sm:inline-flex"
          >
            Anunciar
          </Link>`;

const newBtn = `<div className="flex items-center gap-3">
          <Link
            href="/painel"
            className="hidden rounded-brand border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 md:inline-flex"
          >
            Cockpit CRM
          </Link>
          <Link
            href="/#anuncie"
            className="hidden rounded-brand bg-primary px-6 py-3.5 text-[15px] font-medium uppercase tracking-[0.6px] text-white transition-colors hover:bg-dark sm:inline-flex"
          >
            Anunciar
          </Link>`;

content = content.replace(oldBtn, newBtn);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Header.tsx updated with link to /painel');
