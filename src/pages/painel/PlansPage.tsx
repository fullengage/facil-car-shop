/**
 * Página de Planos no Painel — Visualizar e contratar assinaturas
 * Rota: /painel/planos
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabaseClient'
import { PlanSelector } from '@/components/painel/PlanSelector'
import type { FCSDealer } from '@/types/crm'

export default function PlansPage() {
  const [dealer, setDealer] = useState<FCSDealer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDealer() {
      try {
        if (!supabase) throw new Error('Supabase não configurado')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Não autenticado')

        const { data } = await supabase
          .from('fcs_dealers')
          .select('*')
          .eq('owner_user_id', user.id)
          .single()

        setDealer(data)
      } catch (err) {
        console.error('Erro ao carregar dealer:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDealer()
  }, [])

  if (loading || !dealer) {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="text-text/60">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text">Planos de Assinatura</h1>
        <p className="mt-2 text-text/60">Escolha o plano que melhor se adequa ao seu negócio</p>
      </div>

      {/* PlanSelector */}
      <PlanSelector
        dealerId={dealer.id}
        dealerEmail={dealer.email || ''}
      />

      {/* FAQ */}
      <div className="space-y-4 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-bold text-text">Perguntas Frequentes</h2>

        <div className="space-y-4">
          <details className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-primary">
              Como funciona o pagamento?
            </summary>
            <p className="mt-3 text-sm text-text/60">
              O pagamento é processado de forma segura pelo Mercado Pago. Você pode pagar com cartão de
              crédito, débito ou boleto. A cobrança ocorre automaticamente todo mês no mesmo dia da
              assinatura.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-primary">
              Posso cancelar minha assinatura?
            </summary>
            <p className="mt-3 text-sm text-text/60">
              Sim, você pode cancelar a qualquer momento acessando Configurações → Assinatura. O
              cancelamento entra em efeito imediatamente e você não será cobrado novamente.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-primary">
              E se eu precisar de um plano customizado?
            </summary>
            <p className="mt-3 text-sm text-text/60">
              Entre em contato com nosso time de vendas para discutir planos personalizados com limites
              superiores de veículos, lojas e vendedores.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-primary">
              Há período de teste gratuito?
            </summary>
            <p className="mt-3 text-sm text-text/60">
              Novos dealers recebem 7 dias de trial gratuito no Plano Starter. Após o período, é
              necessário contratar um plano para continuar usando a plataforma.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-semibold text-text hover:text-primary">
              Como faço upgrade de plano?
            </summary>
            <p className="mt-3 text-sm text-text/60">
              Você pode fazer upgrade selecionando um novo plano nesta página. A mudança entra em
              efeito imediatamente e o valor será ajustado proporcionalmente.
            </p>
          </details>
        </div>
      </div>

      {/* Support */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <h3 className="font-bold text-text">Precisa de ajuda?</h3>
        <p className="mt-2 text-sm text-text/60">
          Entre em contato com nosso suporte por email ou WhatsApp
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <a
            href="https://wa.me/5511999999999"
            className="inline-block rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            💬 WhatsApp
          </a>
          <a
            href="mailto:suporte@facilcarshop.com.br"
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/80"
          >
            ✉️ Email
          </a>
        </div>
      </div>
    </div>
  )
}
