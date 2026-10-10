const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../classificados-carros/components/vehicles/PropostaForm.tsx');

const content = `"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

/**
 * Formulário de proposta na página do veículo.
 * Conectado ao Supabase (fcs_customers, fcs_leads e fcs_proposals).
 */
export function PropostaForm({ titulo, loja, veiculoId, lojaId }: { titulo: string; loja: string; veiculoId?: string; lojaId?: string }) {
  const [enviado, setEnviado] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const campo = "h-12 w-full rounded-brand border border-border bg-white px-4 text-[15px] text-dark outline-none focus:border-primary";

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;
    const telefone = formData.get("telefone") as string;
    const valor = parseFloat(formData.get("valor") as string) || 0;

    if (supabase) {
      try {
        const defaultDealerId = "00000000-0000-0000-0000-000000000001";

        // 1. Cadastrar cliente
        const { data: customer } = await supabase.from("fcs_customers").insert({
          dealer_id: defaultDealerId,
          full_name: nome,
          phone: telefone,
          normalized_phone: telefone.replace(/\\D/g, ""),
          source: "marketplace_proposta",
        }).select().single();

        if (customer) {
          // 2. Obter etapa inicial do Kanban (novo_lead)
          const { data: stage } = await supabase.from("fcs_pipeline_stages").select("id").eq("stage_key", "novo_lead").maybeSingle();

          // 3. Criar Lead
          const { data: lead } = await supabase.from("fcs_leads").insert({
            dealer_id: defaultDealerId,
            store_id: lojaId || "00000000-0000-0000-0000-000000000001",
            customer_id: customer.id,
            vehicle_id: veiculoId || null,
            stage_id: stage?.id || null,
            source: "Formulário de Proposta",
            source_detail: \`Interesse no \${titulo} (\${loja})\`,
            priority: "high",
            status: "open",
          }).select().single();

          if (lead) {
            // 4. Criar Proposta
            await supabase.from("fcs_proposals").insert({
              dealer_id: defaultDealerId,
              store_id: lojaId || "00000000-0000-0000-0000-000000000001",
              lead_id: lead.id,
              vehicle_id: veiculoId || "00000000-0000-0000-0000-000000000001",
              seller_id: "00000000-0000-0000-0000-000000000002",
              asking_price: valor,
              proposed_price: valor,
              notes: \`Proposta enviada pelo comprador \${nome} (\${telefone})\`,
              status: "sent",
              sent_at: new Date().toISOString(),
            });

            // 5. Registrar Evento
            await supabase.from("fcs_lead_events").insert({
              lead_id: lead.id,
              event_type: "proposal_created",
              new_value: { valor, cliente: nome },
            });
          }
        }
      } catch (err) {
        console.error("Erro ao registrar proposta no Supabase:", err);
      }
    }

    setEnviado(true);
    setIsSubmitting(false);
  }

  if (enviado) {
    return (
      <p role="status" className="rounded-brand bg-surface p-5 text-[15px] text-dark">
        Proposta enviada com sucesso para a revenda {loja}. Você receberá o retorno direto no seu WhatsApp em breve!
      </p>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3" aria-label={\`Enviar proposta para \${titulo}\`}>
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

fs.writeFileSync(targetPath, content, 'utf8');
console.log('PropostaForm.tsx updated successfully');
