import { Link } from "react-router-dom";
import { Seo } from "@/components/site/Seo";

const veiculos = [
  { id: "tiago-draft-001", nome: "Jeep Renegade", ano: 2018, preco: 73000 },
  { id: "tiago-draft-002", nome: "Fiat Uno", ano: 2010, preco: 26000 },
  { id: "tiago-draft-003", nome: "Fiat Palio", ano: 2010, preco: 24900 },
  { id: "tiago-draft-004", nome: "Fiat Uno", ano: 2010, preco: 23000 },
  { id: "tiago-draft-005", nome: "Fiat Argo", ano: 2020, preco: 66900 },
  { id: "tiago-draft-006", nome: "Volkswagen Gol", ano: 2011, preco: 25500 },
  { id: "tiago-draft-007", nome: "Fiat Strada", ano: 2011, preco: 45900 },
] as const;

const preco = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(valor);

/** Protótipo NÃO PUBLICADO: sem cadastro de terceiro, sem associação com loja real, sem links de compra. */
export default function TiagoDemoPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12">
      <Seo
        title="Demonstração privada — Classificados de Tiago"
        description="Protótipo não oficial de uma vitrine automotiva, sujeito à aprovação do anunciante."
        canonical="/previews/classificados-de-tiago"
      />
      <div className="mb-8 rounded-brand border border-amber-300 bg-amber-50 p-5 text-amber-950" role="status">
        <strong className="block text-lg">DEMONSTRAÇÃO NÃO OFICIAL — NÃO PUBLICAR</strong>
        <p className="mt-2 text-sm">Esta página é apenas uma simulação. O anunciante não se cadastrou, não contratou, não pagou e não autorizou a publicação dos anúncios. Preços e disponibilidade precisam ser confirmados.</p>
      </div>
      <p className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">Vitrine demonstrativa · Novo Horizonte, SP</p>
      <h1 className="text-4xl font-black text-dark">Classificados de Tiago</h1>
      <p className="mt-4 text-lg">Exemplo de loja no Plano Básico: até 10 veículos por R$ 59,90/mês, sujeito à confirmação comercial.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-brand bg-surface p-5"><p className="text-3xl font-bold">7</p><p>Veículos identificados na imagem</p></div>
        <div className="rounded-brand bg-surface p-5"><p className="text-3xl font-bold">10</p><p>Capacidade simulada do plano</p></div>
        <div className="rounded-brand bg-surface p-5"><p className="text-3xl font-bold">3</p><p>Vagas disponíveis para mais anúncios</p></div>
      </div>
      <h2 className="mt-12 text-2xl font-bold text-dark">Veículos para conferência</h2>
      <p className="mt-2 text-sm">Dados transcritos da captura do Facebook Marketplace de 11/10/2026. Fotos, quilometragem, versão e disponibilidade não foram validadas.</p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {veiculos.map((v) => (
          <li key={v.id} className="overflow-hidden rounded-brand border border-border bg-white p-6">
            <div className="mb-5 flex aspect-[16/9] items-center justify-center rounded-brand bg-surface text-sm text-muted">Imagem aguardando autorização</div>
            <h3 className="text-xl font-bold text-dark">{v.nome} {v.ano}</h3>
            <p className="mt-2 text-2xl font-black text-primary">{preco(v.preco)}</p>
            <p className="mt-2 text-xs text-muted">Anúncio em revisão · não disponível para compra aqui</p>
          </li>
        ))}
      </ul>
      <div className="mt-12 rounded-brand border border-border p-6">
        <h2 className="text-xl font-bold">Próximas etapas</h2>
        <p className="mt-2">Confirmar com Tiago a titularidade, as fotos, os veículos atuais e a autorização. Somente depois: cadastro autêntico, contratação do plano e ativação mediante conferência do PIX.</p>
        <Link to="/" className="mt-4 inline-block font-bold text-primary">Voltar ao início</Link>
      </div>
    </div>
  );
}
