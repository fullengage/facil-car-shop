import { CalendarDays } from "lucide-react";
import { SectionTitle } from "@/components/site/ui/SectionTitle";
import { getPosts } from "@/lib/site/data";

/**
 * Últimos posts do blog. ponytail: sem página /blog/[slug] ainda, então os cards não têm link.
 * Adicionar rotas e href quando o blog existir.
 */
export function BlogTeaser() {
  const posts = getPosts().slice(0, 3);
  return (
    <section id="blog" className="scroll-mt-28 bg-surface py-[100px]">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mb-14">
          <SectionTitle eyebrow="Blog" title="Dicas para comprar melhor" />
        </div>
        <ul className="grid gap-7 md:grid-cols-3">
          {posts.map((p) => (
            <li key={p.slug} className="reveal flex flex-col gap-4 rounded-brand bg-white p-8 shadow-soft">
              <p className="flex items-center gap-2 text-[14px]">
                <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
                <time dateTime={p.data}>{new Date(p.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</time>
              </p>
              <h3 className="text-[21px] font-bold leading-[28px] text-dark">{p.titulo}</h3>
              <p className="text-[16px] leading-[26px]">{p.resumo}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
