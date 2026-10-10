"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/site/ui/Button";
import { supabase } from "@/services/supabaseClient";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PropostaFormProps {
  titulo: string;
  loja: string;
  /** UUID real de fcs_vehicles (obrigatório para registrar o lead) */
  veiculoId?: string;
  /** UUID real de fcs_stores (obrigatório para registrar o lead) */
  lojaId?: string;
}

/**
 * Proposta da vitrine (visitante anônimo).
 * Regras do RLS: sem .select() após insert, IDs gerados no cliente, sem leitura de
 * etapas do funil nem de eventos. Vendedor e etapa são definidos depois, no painel.
 */
export function PropostaForm({ titulo, loja, veiculoId, lojaId }: PropostaFormProps) {
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const campo = "h-12 w-full rounded-brand border border-border bg-white px-4 text-[15px] text-dark outline-none focus:border-primary";

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!supabase) return setErro("Serviço indisponível no momento. Tente pelo WhatsApp.");
    if (!lojaId || !UUID.test(lojaId) || !veiculoId || !UUID.test(veiculoId)) {
      return setErro("Este anúncio ainda não aceita propostas online. Fale com a loja pelo WhatsApp.");
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const nome = String(formData.get("nome") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const valor = Number(formData.get("valor")) || 0;

    try {
      // Dono da loja (leitura permitida: loja aprovada é pública)
      const { data: store, error: storeError } = await supabase
        .from("fcs_stores")
        .select("dealer_id")
        .eq("id", lojaId)
        .maybeSingle();
      if (storeError || !store) throw new Error("Loja não encontrada.");

      // IDs gerados aqui: o INSERT não precisa de SELECT (RETURNING) para o visitante
      const customerId = crypto.randomUUID();
      const leadId = crypto.randomUUID();

      const { error: customerError } = await supabase.from("fcs_customers").insert({
        id: customerId,
        dealer_id: store.dealer_id,
        full_name: nome,
        phone: telefone,
        normalized_phone: telefone.replace(/\D/g, ""),
        source: "marketplace_proposta",
      });
      if (customerError) throw customerError;

      const { error: leadError } = await supabase.from("fcs_leads").insert({
        id: leadId,
        dealer_id: store.dealer_id,
        store_id: lojaId,
        customer_id: customerId,
        vehicle_id: veiculoId,
        source: "Formulário de Proposta",
        source_detail: `Interesse no ${titulo} (${loja})`,
        priority: "high",
        status: "open",
      });
      if (leadError) throw leadError;

      if (valor > 0) {
        // seller_id fica vazio até o admin da loja atribuir (depende da migração que torna a coluna anulável)
        const { error: proposalError } = await supabase.from("fcs_proposals").insert({
          dealer_id: store.dealer_id,
          store_id: lojaId,
          lead_id: leadId,
          vehicle_id: veiculoId,
          asking_price: valor,
          proposed_price: valor,
          notes: `Proposta enviada pelo comprador ${nome} (${telefone})`,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        if (proposalError) throw proposalError;
      }

      setEnviado(true);
    } catch (err) {
      console.error("Erro ao registrar proposta:", err);
      setErro("Não foi possível enviar sua proposta agora. Tente novamente ou fale pelo WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (enviado) {
    return (
      <p role="status" className="rounded-brand bg-surface p-5 text-[15px] text-dark">
        Proposta enviada para a {loja}. Você receberá o retorno no seu WhatsApp em breve.
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3" aria-label={`Enviar proposta para ${titulo}`}>
      {erro && <p role="alert" className="rounded-brand bg-red-50 p-3 text-[14px] text-red-700">{erro}</p>}
      <input required name="nome" placeholder="Seu nome" autoComplete="name" className={campo} />
      <input required type="tel" name="telefone" placeholder="WhatsApp" autoComplete="tel" className={campo} />
      <input required type="number" min={1} name="valor" placeholder="Sua proposta (R$)" className={campo} />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enviando proposta..." : "Enviar proposta"}
      </Button>
    </form>
  );
}
