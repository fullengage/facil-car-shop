/**
 * Seletor de Planos de Assinatura com Mercado Pago
 * Exibe planos disponíveis e permite contratar
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabaseClient'
import { Button } from '@/components/site/ui/Button'
import type { FCSPlan, FCSSubscription } from '@/types/crm'

interface PlanSelectorProps {
  dealerId: string
  dealerEmail: string
}

export function PlanSelector({ dealerId, dealerEmail }: PlanSelectorProps) {
  const [plans, setPlans] = useState<FCSPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<FCSSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Carregar planos disponíveis
  useEffect(() => {
    async function loadPlans() {
      try {
        if (!supabase) throw new Error('Supabase não configurado')

        const { data, error: plansError } = await supabase
          .from('fcs_plans')
          .select('*')
          .eq('is_active', true)
          .order('price_monthly')

        if (plansError) throw plansError
        setPlans(data || [])
      } catch (err) {
        console.error('Erro ao carregar planos:', err)
        setError('Não foi possível carregar os planos')
      }
    }

    loadPlans()
  }, [])

  // 2. Carregar assinatura atual
  useEffect(() => {
    async function loadSubscription() {
      try {
        if (!supabase) throw new Error('Supabase não configurado')

        const { data, error: subError } = await supabase
          .from('fcs_subscriptions')
          .select('*')
          .eq('dealer_id', dealerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (subError && subError.code !== 'PGRST116') throw subError
        setCurrentSubscription(data || null)
      } catch (err) {
        console.error('Erro ao carregar assinatura:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [dealerId])

  // 3. Criar assinatura
  async function handleSelectPlan(planId: string) {
    if (currentSubscription?.status === 'active') {
      setError('Você já possui uma assinatura ativa. Cancele-a primeiro.')
      return
    }

    setIsCreatingSubscription(true)
    setError(null)

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId,
          planId,
          payerEmail: dealerEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar assinatura')
      }

      if (data.success && data.subscription.checkoutUrl) {
        // Redirecionar para checkout do Mercado Pago
        window.location.href = data.subscription.checkoutUrl
      } else {
        throw new Error('URL de checkout não disponível')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMsg)
      console.error('Erro ao criar assinatura:', err)
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin text-2xl">⏳</div>
          <p className="mt-2 text-text/60">Carregando planos...</p>
        </div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-text/60">Nenhum plano disponível no momento.</p>
      </div>
    )
  }

  const getCurrentPlan = (plans: FCSPlan[]) => {
    if (!currentSubscription) return null
    return plans.find(p => p.id === currentSubscription.plan_id)
  }

  const currentPlan = getCurrentPlan(plans)

  return (
    <div className="space-y-6">
      {/* Status atual */}
      {currentSubscription && currentPlan && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text/60">Plano Atual</p>
              <p className="text-lg font-semibold text-text">{currentPlan.name}</p>
              <p className="text-sm text-text/60">
                {currentSubscription.status === 'active' ? '✅ Ativo' : `⏳ ${currentSubscription.status}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                R$ {currentPlan.price_monthly.toFixed(2)}
              </p>
              <p className="text-xs text-text/60">/mês</p>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Grid de planos */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(plan => {
          const isCurrentPlan = currentPlan?.id === plan.id
          const isActive = currentSubscription?.status === 'active' && isCurrentPlan

          return (
            <div
              key={plan.id}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                isCurrentPlan
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-surface hover:border-primary/50'
              }`}
            >
              {/* Badge de plano atual */}
              {isActive && (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Atual
                </div>
              )}

              {/* Nome e descrição */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-text">{plan.name}</h3>
                <p className="mt-1 text-sm text-text/60">{plan.description}</p>
              </div>

              {/* Preço */}
              <div className="mb-6">
                <p className="text-3xl font-bold text-primary">R$ {plan.price_monthly.toFixed(2)}</p>
                <p className="text-sm text-text/60">/mês, cobrado anualmente</p>
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <ul className="mb-6 space-y-2 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-text/70">
                      <span className="mt-0.5 text-primary">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Limites */}
              <div className="mb-6 space-y-1 border-t border-border pt-4 text-sm">
                <p className="text-text/60">
                  <strong className="text-text">{plan.vehicle_limit}</strong> veículos
                </p>
                <p className="text-text/60">
                  <strong className="text-text">{plan.store_limit}</strong> loja(s)
                </p>
                <p className="text-text/60">
                  <strong className="text-text">{plan.seller_limit}</strong> vendedor(es)
                </p>
              </div>

              {/* Botão */}
              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isActive || isCreatingSubscription}
                className={`w-full ${
                  isCurrentPlan ? 'bg-primary text-white' : 'bg-secondary text-text'
                }`}
              >
                {isActive
                  ? 'Plano Ativo'
                  : isCreatingSubscription
                    ? 'Processando...'
                    : 'Contratar'}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="rounded-lg bg-surface p-4 text-sm text-text/60">
        <p>
          💳 <strong>Pagamento seguro:</strong> Processado via Mercado Pago. Nenhum cartão é armazenado
          em nossos servidores.
        </p>
      </div>
    </div>
  )
}
