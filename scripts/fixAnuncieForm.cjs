const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../classificados-carros/components/home/AnuncieForm.tsx');

const content = `"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

/**
 * Formulário "Anuncie sua loja" sobre imagem de fundo.
 * Conectado ao Supabase (fcs_dealers e fcs_stores).
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

      // 1. Cadastra o lojista
      const { data: dealerData, error: dealerError } = await supabase
        .from("fcs_dealers")
        .insert({
          company_name: nomeLoja,
          trade_name: nomeLoja,
          status: "pending_review",
        })
        .select()
        .single();

      if (dealerError) {
        console.warn("Aviso ao criar dealer:", dealerError.message);
      }

      const dealerId = dealerData?.id;

      // 2. Cadastra a loja
      if (dealerId) {
        const slug = nomeLoja
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\\u0300-\\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        await supabase.from("fcs_stores").insert({
          dealer_id: dealerId,
          name: nomeLoja,
          slug: \`\${slug}-\${Date.now().toString().slice(-4)}\`,
          phone: whatsapp,
          city: cidade || "Não informada",
          state: "SP",
          status: "pending",
        });
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
      {/* Imagem de fundo decorativa com overlay escuro */}
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

fs.writeFileSync(filePath, content, 'utf8');
console.log('AnuncieForm.tsx corrected!');
