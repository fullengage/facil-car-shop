"use client";

import Image from "@/components/site/Image";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/site/ui/Button";
import { supabase } from "@/services/supabaseClient";

const soDigitos = (v: string) => v.replace(/\D/g, "");

/**
 * Cadastro de loja pela vitrine (visitante anônimo).
 * Chama a função fcs_public_register_store (SECURITY DEFINER): ela cria conta, revenda,
 * assinatura trial e loja pendente. Anônimo não tem INSERT direto nessas tabelas.
 */
export function AnuncieForm() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !nomeLoja.trim() || !whatsapp.trim() || !email.trim()) {
      return setErro("Preencha seu nome, e-mail, nome da loja e WhatsApp.");
    }
    if (soDigitos(cnpj).length !== 14) {
      return setErro("Informe um CNPJ válido com 14 dígitos.");
    }
    if (!supabase) return setErro("Serviço indisponível no momento. Tente pelo WhatsApp.");

    setLoading(true);
    try {
      const { error } = await supabase.rpc("fcs_public_register_store", {
        p_email: email.trim(),
        p_full_name: nome.trim(),
        p_phone: whatsapp.trim(),
        p_trade_name: nomeLoja.trim(),
        p_store_name: nomeLoja.trim(),
        p_document_type: "cnpj",
        p_document_number: soDigitos(cnpj),
        p_city: cidade.trim(),
        p_state: uf.trim().toUpperCase(),
      });
      if (error) {
        // A função devolve mensagens claras para validação; o resto é erro genérico (não revelar se e-mail/CNPJ já existem)
        setErro(error.message?.includes("inválido") || error.message?.includes("obrigatórios")
          ? error.message
          : "Não foi possível enviar agora. Confira os dados ou fale pelo WhatsApp.");
        return;
      }
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  }

  const campo = "mt-1 w-full rounded-brand border border-border px-3.5 py-2.5 text-[14px] text-dark placeholder:text-muted/60 focus:border-primary focus:outline-none";

  return (
    <section id="anuncie" aria-labelledby="anuncie-title" className="relative py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <Image src="/images/hero/hero-car.jpg" alt="" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-dark/85" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mx-auto max-w-[560px] rounded-brand bg-white p-8 shadow-card sm:p-10">
          <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary">Anuncie sua loja</span>
          <h2 id="anuncie-title" className="mt-2 text-[26px] font-black leading-tight text-dark sm:text-[32px]">
            Cadastre sua revenda e venda mais
          </h2>

          {enviado ? (
            <div role="status" className="mt-6 rounded-brand border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <strong className="block font-bold">Solicitação enviada!</strong>
              <p className="mt-1 text-[14px]">Recebemos sua solicitação de cadastro. Aguarde a validação da loja antes de anunciar veículos. A equipe poderá entrar em contato pelos dados informados.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {erro && <div role="alert" className="rounded-brand border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{erro}</div>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-[13px] font-medium text-muted">
                  Seu nome
                  <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" className={campo} />
                </label>
                <label className="block text-[13px] font-medium text-muted">
                  E-mail
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@loja.com.br" className={campo} />
                </label>
                <label className="block text-[13px] font-medium text-muted">
                  Nome da loja
                  <input required value={nomeLoja} onChange={(e) => setNomeLoja(e.target.value)} placeholder="Auto Silva Veículos" className={campo} />
                </label>
                <label className="block text-[13px] font-medium text-muted">
                  CNPJ
                  <input required inputMode="numeric" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={campo} />
                </label>
                <label className="block text-[13px] font-medium text-muted">
                  WhatsApp
                  <input required type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-0000" className={campo} />
                </label>
                <div className="grid grid-cols-[1fr_72px] gap-3">
                  <label className="block text-[13px] font-medium text-muted">
                    Cidade
                    <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="São Paulo" className={campo} />
                  </label>
                  <label className="block text-[13px] font-medium text-muted">
                    UF
                    <input maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} placeholder="SP" className={campo} />
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full uppercase font-bold">
                {loading ? "Enviando..." : "Quero anunciar"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
