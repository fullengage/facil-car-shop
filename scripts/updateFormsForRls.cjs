const fs = require('fs');
const path = require('path');

// 1. Atualizar AnuncieForm.tsx para usar a RPC fcs_public_register_store
const anunciePath = path.resolve(__dirname, '../../classificados-carros/components/home/AnuncieForm.tsx');
const anuncieContent = `"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

/**
 * Formulário "Anuncie sua loja" sobre imagem de fundo.
 * Conectado ao Supabase via RPC segura fcs_public_register_store (compatível com RLS).
 */
export function AnuncieForm() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cidade, setCidade] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      if (!nome || !whatsapp || !nomeLoja) {
        throw new Error("Por favor, preencha todos os campos obrigatórios.");
      }

      // Chama a RPC segura do PostgreSQL criada na migração
      const { data, error } = await supabase.rpc("fcs_public_register_store", {
        p_contact_name: nome,
        p_store_name: nomeLoja,
        p_phone: whatsapp,
        p_city: cidade || "São Paulo",
      });

      if (error) {
        throw new Error(error.message);
      }

      setEnviado(true);
    } catch (err: any) {
      console.error("Erro ao cadastrar revenda:", err);
      setErro(err.message || "Erro ao enviar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="anuncie" aria-labelledby="anuncie-title" className="relative py-20 lg:py-24">
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <Image
          src="/images/hero/hero-car.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-dark/85" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5">
        <div className="mx-auto max-w-[560px] rounded-brand bg-white p-8 shadow-card sm:p-10">
          <span className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary">
            Anuncie sua loja
          </span>
          <h2 id="anuncie-title" className="mt-2 text-[26px] font-black leading-tight text-dark sm:text-[32px]">
            Cadastre sua revenda e venda mais
          </h2>

          {enviado ? (
            <div className="mt-6 rounded-brand bg-emerald-50 border border-emerald-200 p-5 text-emerald-800" role="status">
              <strong className="block font-bold">Solicitação enviada com sucesso!</strong>
              <p className="mt-1 text-[14px]">
                Nossa equipe comercial entrará em contato via WhatsApp nas próximas 2 horas para ativar sua conta.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {erro && (
                <div className="rounded-brand bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
                  {erro}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="anuncie-nome" className="block text-[13px] font-medium text-muted">
                    Seu nome
                  </label>
                  <input
                    id="anuncie-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="João Silva"
                    className="mt-1 w-full rounded-brand border border-border px-3.5 py-2.5 text-[14px] text-dark placeholder:text-muted/60 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="anuncie-loja" className="block text-[13px] font-medium text-muted">
                    Nome da loja
                  </label>
                  <input
                    id="anuncie-loja"
                    type="text"
                    required
                    value={nomeLoja}
                    onChange={(e) => setNomeLoja(e.target.value)}
                    placeholder="Auto Silva Veículos"
                    className="mt-1 w-full rounded-brand border border-border px-3.5 py-2.5 text-[14px] text-dark placeholder:text-muted/60 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="anuncie-whatsapp" className="block text-[13px] font-medium text-muted">
                    WhatsApp
                  </label>
                  <input
                    id="anuncie-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="mt-1 w-full rounded-brand border border-border px-3.5 py-2.5 text-[14px] text-dark placeholder:text-muted/60 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="anuncie-cidade" className="block text-[13px] font-medium text-muted">
                    Cidade
                  </label>
                  <input
                    id="anuncie-cidade"
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="São Paulo, SP"
                    className="mt-1 w-full rounded-brand border border-border px-3.5 py-2.5 text-[14px] text-dark placeholder:text-muted/60 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full uppercase font-bold"
              >
                {loading ? "Cadastrando..." : "Quero anunciar"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
`;
fs.writeFileSync(anunciePath, anuncieContent, 'utf8');
console.log('AnuncieForm.tsx updated to use RPC!');

// 2. Atualizar PropostaForm.tsx para gerar UUIDs no cliente sem .select()
const propostaPath = path.resolve(__dirname, '../../classificados-carros/components/vehicles/PropostaForm.tsx');
const propostaContent = `"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

/**
 * Formulário de proposta na página do veículo.
 * Compatível com RLS da vitrine pública: IDs gerados no cliente, sem .select() e sem seller_id fixo.
 */
export function PropostaForm({
  titulo,
  loja,
  veiculoId,
  lojaId,
}: {
  titulo: string;
  loja: string;
  veiculoId?: string;
  lojaId?: string;
}) {
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const campo = "h-12 w-full rounded-brand border border-border bg-white px-4 text-[15px] text-dark outline-none focus:border-primary";

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErro(null);

    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;
    const telefone = formData.get("telefone") as string;
    const valor = parseFloat(formData.get("valor") as string) || 0;

    try {
      const defaultDealerId = "00000000-0000-0000-0000-000000000001";
      const targetStoreId = lojaId || "00000000-0000-0000-0000-000000000001";

      // 1. Gera UUIDs no cliente para compatibilidade estrita com RLS (sem RETURNING/SELECT)
      const customerId = crypto.randomUUID();
      const leadId = crypto.randomUUID();
      const proposalId = crypto.randomUUID();

      // 2. Insere Cliente
      const { error: errCustomer } = await supabase.from("fcs_customers").insert({
        id: customerId,
        dealer_id: defaultDealerId,
        full_name: nome,
        phone: telefone,
        normalized_phone: telefone.replace(/\\D/g, ""),
        source: "marketplace_proposta",
        status: "active",
      });

      if (errCustomer) {
        console.warn("Aviso ao criar customer:", errCustomer.message);
      }

      // 3. Insere Lead
      const { error: errLead } = await supabase.from("fcs_leads").insert({
        id: leadId,
        dealer_id: defaultDealerId,
        store_id: targetStoreId,
        customer_id: customerId,
        vehicle_id: veiculoId || null,
        source: "Formulário de Proposta",
        source_detail: \`Interesse no \${titulo} (\${loja})\`,
        priority: "high",
        status: "open",
      });

      if (errLead) {
        console.warn("Aviso ao criar lead:", errLead.message);
      }

      // 4. Insere Proposta (sem seller_id, status 'sent')
      if (veiculoId) {
        await supabase.from("fcs_proposals").insert({
          id: proposalId,
          dealer_id: defaultDealerId,
          store_id: targetStoreId,
          lead_id: leadId,
          vehicle_id: veiculoId,
          seller_id: null,
          asking_price: valor,
          proposed_price: valor,
          notes: \`Proposta enviada pelo comprador \${nome} (\${telefone})\`,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      }

      setEnviado(true);
    } catch (err: any) {
      console.error("Erro ao registrar proposta:", err);
      setErro("Não foi possível enviar a proposta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (enviado) {
    return (
      <div role="status" className="rounded-brand bg-emerald-50 border border-emerald-200 p-5 text-emerald-800 text-[15px]">
        <strong className="block font-bold">Proposta enviada com sucesso!</strong>
        <p className="mt-1">
          A revenda <strong>{loja}</strong> recebeu sua proposta para o {titulo} e entrará em contato direto pelo seu WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3" aria-label={\`Enviar proposta para \${titulo}\`}>
      {erro && (
        <div className="rounded-brand bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">
          {erro}
        </div>
      )}
      <input required name="nome" placeholder="Seu nome" autoComplete="name" className={campo} />
      <input required type="tel" name="telefone" placeholder="WhatsApp" autoComplete="tel" className={campo} />
      <input required type="number" min={1} name="valor" placeholder="Sua proposta (R$)" className={campo} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enviando proposta..." : "Enviar proposta"}
      </Button>
    </form>
  );
}
`;
fs.writeFileSync(propostaPath, propostaContent, 'utf8');
console.log('PropostaForm.tsx updated with client-side UUIDs and no select()!');
