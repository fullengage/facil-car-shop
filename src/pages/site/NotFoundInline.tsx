import { Button } from "@/components/site/ui/Button";
import { Seo } from "@/components/site/Seo";

/** Conteúdo 404 usado dentro das rotas dinâmicas (veículo ou loja inexistente). */
export function NotFoundInline() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center gap-6 px-5 py-32 text-center">
      <Seo title="Página não encontrada" />
      <p className="text-[14px] font-medium uppercase tracking-[0.8px] text-primary">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p>O anúncio pode ter sido vendido ou o endereço mudou. Veja os carros disponíveis agora.</p>
      <Button href="/carros">Ver carros disponíveis</Button>
    </div>
  );
}
