// ==============================================================================
// DASHBOARD SUPER ADMIN — FÁCIL CAR SHOP
// Gestão Global de Lojistas, Assinaturas, MRR e Moderação
// ==============================================================================

import * as React from 'react'
import {
  ShieldAlert,
  Building2,
  CarFront,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Ban,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  getSuperAdminMetrics,
  listAllDealers,
  listAllPlans,
  updateDealerStatus,
  type SuperAdminMetrics,
} from '@/services/crmService'
import type { FCSDealer, FCSPlan } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'

export function SuperAdminDashboard() {
  const [metrics, setMetrics] = React.useState<SuperAdminMetrics | null>(null)
  const [dealers, setDealers] = React.useState<FCSDealer[]>([])
  const [plans, setPlans] = React.useState<FCSPlan[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [statusSaving, setStatusSaving] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [m, d, p] = await Promise.all([
        getSuperAdminMetrics(),
        listAllDealers(),
        listAllPlans(),
      ])
      setMetrics(m)
      setDealers(d)
      setPlans(p)
    } catch (error) {
      console.error('Erro ao carregar dados Super Admin:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (
    dealerId: string,
    newStatus: 'active' | 'suspended' | 'pending'
  ) => {
    setActionError(null)
    setStatusSaving(dealerId)
    const success = await updateDealerStatus(dealerId, newStatus)
    setStatusSaving(null)
    if (!success) setActionError('Não foi possível alterar a revenda. Confirme suas permissões e tente novamente.')
    if (success) {
      setDealers((prev) =>
        prev.map((d) => (d.id === dealerId ? { ...d, status: newStatus } : d))
      )
    }
  }

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Carregando indicadores do Super Admin...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary bg-steel/10 px-3 py-1 text-xs font-semibold text-steel mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-steel" />
            <span>Perfil: SUPER_ADMIN da Plataforma</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-dark">
            Painel Geral da Plataforma
          </h2>
          <p className="text-sm text-text">
            Controle de lojistas, planos, MRR recorrente, receita e moderação de anúncios.
          </p>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text">Receita Recorrente (MRR)</span>
            <div className="w-8 h-8 rounded-lg bg-steel/10 text-steel flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-steel">
            {formatCurrency(metrics.mrrTotal)}
          </p>
          <span className="text-xs text-text mt-1 block">
            {metrics.activeSubscriptions} assinaturas ativas
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text">Lojistas Cadastrados</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-dark">{metrics.totalDealers}</p>
          <span className="text-xs text-steel mt-1 block">
            {metrics.activeDealers} ativos • {metrics.pendingDealers} pendentes
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text">Estoque Geral</span>
            <div className="w-8 h-8 rounded-lg bg-steel/10 text-steel flex items-center justify-center">
              <CarFront className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-dark">{metrics.totalVehicles} carros</p>
          <span className="text-xs text-text mt-1 block">
            Em {metrics.totalStores} lojas ativas
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text">Leads & Oportunidades</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-dark">{metrics.totalLeads}</p>
          <span className="text-xs text-primary mt-1 block">Gerados no ecossistema</span>
        </div>
      </div>

      {/* Fila de ações do operador, baseada apenas em registros carregados */}
      <section className="rounded-2xl border border-border bg-white p-5" aria-label="Pendências operacionais">
        <h3 className="font-bold text-dark text-lg">Ações pendentes de hoje</h3>
        <p className="mt-1 text-sm text-text">Priorize aprovações e pendências reais. Pagamentos precisam de conferência independente no banco.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface p-4"><p className="text-sm text-text">Revendas para aprovar</p><p className="text-2xl font-bold text-dark">{dealers.filter(d => d.status === 'pending').length}</p></div>
          <div className="rounded-xl bg-surface p-4"><p className="text-sm text-text">Revendas suspensas</p><p className="text-2xl font-bold text-dark">{dealers.filter(d => d.status === 'suspended').length}</p></div>
          <div className="rounded-xl bg-surface p-4"><p className="text-sm text-text">Cobranças PIX</p><p className="mt-2 text-sm font-semibold text-dark">Conferência ainda não integrada</p></div>
        </div>
        {actionError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      </section>
      {/* Tabela de Lojistas e Ações de Moderação */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-dark text-base">Lojistas & Concessionárias</h3>
            <p className="text-xs text-text">
              Aprovação, suspensão e controle de permissões de empresas.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-text text-xs uppercase border-b border-border">
              <tr>
                <th className="p-3.5">Empresa / Nome Fantasia</th>
                <th className="p-3.5">CNPJ / CPF</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Assinatura</th>
                <th className="p-3.5 text-right">Ações de Moderação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {dealers.map((dealer) => (
                <tr key={dealer.id} className="hover:bg-surface transition-colors">
                  <td className="p-3.5">
                    <p className="font-bold text-dark">{dealer.trade_name}</p>
                    <p className="text-xs text-text">{dealer.legal_name}</p>
                  </td>
                  <td className="p-3.5 font-mono text-xs text-dark">
                    {dealer.document_number}
                  </td>
                  <td className="p-3.5">
                    {dealer.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-steel/10 text-steel border border-primary">
                        Ativo
                      </span>
                    )}
                    {dealer.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-primary border border-primary">
                        Aguardando Aprovação
                      </span>
                    )}
                    {dealer.status === 'suspended' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        Suspenso
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="text-xs font-medium text-dark uppercase">
                      {dealer.subscription_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {dealer.status !== 'active' ? (
                        <Button
                          size="sm"
                          disabled={statusSaving === dealer.id}
                          onClick={() => handleStatusChange(dealer.id, 'active')}
                          className="h-8 bg-steel hover:bg-dark text-white text-xs font-bold"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Aprovar Lojista
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={statusSaving === dealer.id}
                          onClick={() => handleStatusChange(dealer.id, 'suspended')}
                          className="h-8 border-red-900/60 text-red-400 hover:bg-red-500/10 text-xs"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          Suspender
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planos Disponíveis na Plataforma */}
      <div className="rounded-2xl border border-border bg-white p-4">
        <h3 className="font-bold text-dark text-base mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-steel" />
          <span>Planos Comerciais Disponíveis</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-surface border border-border rounded-xl p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-dark text-sm">{plan.name}</h4>
                  <p className="text-xs text-text">{plan.description}</p>
                </div>
                <span className="text-sm font-black text-steel">
                  {formatCurrency(plan.price_monthly)}/mês
                </span>
              </div>
              <div className="text-xs text-text space-y-1 pt-2 border-t border-border">
                <p>• Limite de até {plan.vehicle_limit} carros anunciados</p>
                <p>• Até {plan.store_limit} unidades de loja</p>
                <p>• Até {plan.seller_limit} vendedores autorizados</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
