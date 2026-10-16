/**
 * Página de resultado após checkout Mercado Pago
 * Rotas:
 * - /painel/assinatura/sucesso
 * - /painel/assinatura/erro
 * - /painel/assinatura/pendente
 */

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabaseClient'
import { Button } from '@/components/site/ui/Button'
import type { FCSSubscription, FCSPlan } from '@/types/crm'

type ResultType = 'success' | 'error' | 'pending'

interface SubscriptionData {
  subscription: FCSSubscription | null
  plan: FCSPlan | null
}

export default function SubscriptionResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const dealerId = params.get('dealer')
  const resultType = (location.pathname.split('/').pop() || 'error') as ResultType

  const [data, setData] = useState<SubscriptionData>({ subscription: null, plan: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!dealerId || !supabase) {
        setLoading(false)
        return
      }

      try {
        // Buscar assinatura mais recente
        const { data: sub } = await supabase
          .from('fcs_subscriptions')
          .select('*')
          .eq('dealer_id', dealerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (sub) {
          // Buscar plano associado
          const { data: plan } = await supabase
            .from('fcs_plans')
            .select('*')
            .eq('id', sub.plan_id)
            .single()

          setData({ subscription: sub, plan })
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dealerId])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl">⏳</div>
          <p className="mt-4 text-text/60">Processando...</p>
        </div>
      </div>
    )
  }

  // Sucesso
  if (resultType === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface to-background px-4">
        <div className="max-w-md rounded-2xl border border-primary/20 bg-white p-8 text-center shadow-xl">
          <div className="mb-6 text-6xl">✅</div>

          <h1 className="text-3xl font-bold text-text">Sucesso!</h1>
          <p className="mt-2 text-text/60">Sua assinatura foi ativada</p>

          {data.plan && (
            <div className="mt-6 rounded-lg bg-primary/5 p-4">
              <p className="text-sm text-text/60">Plano contratado:</p>
              <p className="text-xl font-bold text-text">{data.plan.name}</p>
              <p className="mt-2 text-2xl font-bold text-primary">
                R$ {data.plan.price_monthly.toFixed(2)}/mês
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <p className="text-sm text-text/60">
              Você receberá em breve um email de confirmação com os detalhes da sua assinatura.
            </p>
            <p className="text-sm text-text/60">
              📧 Email de contato será usado para notificações de pagamento.
            </p>
          </div>

          <div className="mt-8 space-y-2">
            <Button
              onClick={() => navigate('/painel')}
              className="w-full"
            >
              Ir para o Painel
            </Button>
            <Button
              onClick={() => navigate('/painel/planos')}
              className="w-full border border-border text-text hover:bg-surface"
            >
              Ver Planos
            </Button>
          </div>

          <p className="mt-6 text-xs text-text/40">
            ID da assinatura: {data.subscription?.id}
          </p>
        </div>
      </div>
    )
  }

  // Erro
  if (resultType === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface to-background px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-6 text-6xl">❌</div>

          <h1 className="text-3xl font-bold text-red-600">Erro no Pagamento</h1>
          <p className="mt-2 text-text/60">Sua assinatura não pôde ser processada</p>

          <div className="mt-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {data.subscription?.status === 'past_due'
                ? 'Houve um problema com seu pagamento. Tente novamente ou use outro método.'
                : 'Verifique seus dados de pagamento e tente novamente.'}
            </p>
          </div>

          <div className="mt-6 space-y-3 text-sm text-text/60">
            <p>🔍 Possíveis causas:</p>
            <ul className="space-y-1 text-left text-sm">
              <li>• Cartão expirado ou inválido</li>
              <li>• Saldo insuficiente</li>
              <li>• Limite de cartão excedido</li>
              <li>• Rejeição do banco</li>
            </ul>
          </div>

          <div className="mt-8 space-y-2">
            <Button
              onClick={() => navigate('/painel/planos')}
              className="w-full"
            >
              Tentar Novamente
            </Button>
            <Button
              onClick={() => navigate('/painel')}
              className="w-full border border-border text-text hover:bg-surface"
            >
              Voltar ao Painel
            </Button>
          </div>

          <p className="mt-6 text-xs text-text/40">
            Precisa de ajuda? Entre em contato com nosso suporte.
          </p>
        </div>
      </div>
    )
  }

  // Pendente
  if (resultType === 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-surface to-background px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-xl">
          <div className="mb-6 text-6xl">⏳</div>

          <h1 className="text-3xl font-bold text-amber-600">Pagamento Pendente</h1>
          <p className="mt-2 text-text/60">Seu pagamento está sendo processado</p>

          <div className="mt-6 rounded-lg bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              Você receberá uma confirmação assim que o pagamento for processado. Isso pode levar alguns
              minutos.
            </p>
          </div>

          <div className="mt-6 space-y-3 text-sm text-text/60">
            <p>📧 Enviaremos um email quando o pagamento for confirmado.</p>
            <p>💳 Não feche esta aba enquanto aguarda.</p>
          </div>

          <div className="mt-8 space-y-2">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Atualizar Status
            </Button>
            <Button
              onClick={() => navigate('/painel')}
              className="w-full border border-border text-text hover:bg-surface"
            >
              Ir para o Painel
            </Button>
          </div>

          <p className="mt-6 text-xs text-text/40">
            {data.subscription?.id && `Assinatura: ${data.subscription.id}`}
          </p>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-text/60">Resultado desconhecido</p>
        <Button onClick={() => navigate('/painel')} className="mt-4">
          Voltar
        </Button>
      </div>
    </div>
  )
}
