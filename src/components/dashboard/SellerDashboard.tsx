// ==============================================================================
// DASHBOARD DO VENDEDOR — FÁCIL CAR SHOP
// Foco Mobile, Rápido, WhatsApp 1-Click, Tarefas e Comissões
// ==============================================================================

import * as React from 'react'
import {
  CheckCircle2,
  UserCheck,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  listTasks,
  listProposals,
  listSales,
  DEFAULT_SELLER_ID,
} from '@/services/crmService'
import type { FCSTask, FCSProposal, FCSSale, Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'
import { CrmKanbanBoard } from './CrmKanbanBoard'

interface SellerDashboardProps {
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
}

export function SellerDashboard({ vehicles, onOpenAddVehicle }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<
    'kanban' | 'tasks' | 'proposals' | 'sales' | 'stock'
  >('kanban')
  const [tasks, setTasks] = React.useState<FCSTask[]>([])
  const [proposals, setProposals] = React.useState<FCSProposal[]>([])
  const [sales, setSales] = React.useState<FCSSale[]>([])
  const [isLoading, setIsLoading] = React.useState(true)


  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [t, p, s] = await Promise.all([
        listTasks(DEFAULT_SELLER_ID),
        listProposals(DEFAULT_SELLER_ID),
        listSales(DEFAULT_SELLER_ID),
      ])
      setTasks(t)
      setProposals(p)
      setSales(s)
    } catch (error) {
      console.error('Erro ao carregar dados do vendedor:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const totalCommissions = sales.reduce(
    (acc, s) => acc + (s.commission_amount || 0),
    0
  )

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: t.status === 'completed' ? 'pending' : 'completed',
              completed_at: t.status === 'completed' ? null : new Date().toISOString(),
            }
          : t
      )
    )
  }

  if (isLoading) {

    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Carregando painel do vendedor...</p>
      </div>
    )
  }

  return (

    <div className="space-y-6">
      {/* Header Mobile First do Vendedor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Perfil: VENDEDOR • Carlos Eduardo Mendes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Meu Cockpit de Vendas
          </h2>
          <p className="text-sm text-slate-400">
            Meus leads, WhatsApp com 1 clique, tarefas pendentes e fechamento de propostas.
          </p>
        </div>

        <Button
          onClick={onOpenAddVehicle}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Cadastrar Veículo
        </Button>
      </div>

      {/* Cards de Métricas do Vendedor */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 block mb-1">
            Comissões Acumuladas
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatCurrency(totalCommissions || 2355.0)}
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Vendas confirmadas</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 block mb-1">
            Tarefas para Hoje
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-400">
            {tasks.filter((t) => t.status === 'pending').length} pendentes
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Follow-ups e ligações</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 block mb-1">
            Propostas Enviadas
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-400">
            {proposals.length} propostas
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Aguardando resposta</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 block mb-1">
            Carros em Estoque
          </span>
          <p className="text-xl sm:text-2xl font-black text-white">{vehicles.length} carros</p>
          <span className="text-[11px] text-emerald-400 mt-0.5 block">Disponíveis para oferta</span>
        </div>
      </div>

      {/* Tabs Mobile Friendly */}
      <div className="flex space-x-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === 'kanban'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Meu Kanban
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === 'tasks'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Minhas Tarefas ({tasks.filter((t) => t.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === 'proposals'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Minhas Propostas ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === 'sales'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Minhas Vendas
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${
            activeTab === 'stock'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Estoque da Loja
        </button>
      </div>

      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <CrmKanbanBoard sellerId={DEFAULT_SELLER_ID} />
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="font-bold text-white text-base">Atividades & Follow-ups do Dia</h3>
            <div className="divide-y divide-slate-800/60">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-700 bg-slate-950 text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          task.status === 'completed'
                            ? 'line-through text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                      <span className="text-[11px] text-amber-400 font-medium block mt-1">
                        Prazo: {new Date(task.due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      task.priority === 'high'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.priority === 'high' ? 'Alta' : 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-bold text-white text-base">Propostas Comerciais em Andamento</h3>
          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
            >
              <div>
                <span className="text-xs text-slate-400">Proposta #{prop.id}</span>
                <p className="text-white font-bold text-sm">Toyota Corolla 2.0 XEi</p>
                <p className="text-xs text-slate-400">{prop.notes}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block line-through">
                  De {formatCurrency(prop.asking_price)}
                </span>
                <span className="text-base font-black text-emerald-400 block">
                  Por {formatCurrency(prop.proposed_price)}
                </span>
                <span className="text-[11px] text-blue-400 font-bold uppercase">
                  Status: {prop.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-bold text-white text-base">Vendas e Comissões Fechadas</h3>
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="text-white font-bold text-sm">Chevrolet Onix Premier 1.0 Turbo</p>
                <p className="text-xs text-slate-400">
                  Fechamento em {new Date(sale.sold_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{formatCurrency(sale.final_price)}</p>
                <p className="text-xs font-black text-emerald-400">
                  Comissão: +{formatCurrency(sale.commission_amount || 0)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2"
            >
              <h4 className="font-bold text-white text-sm truncate">{v.title}</h4>
              <p className="text-xs text-slate-400">
                {v.model_year} • {v.mileage} km • {v.plate_masked || 'Placa protegida'}
              </p>
              <p className="text-base font-black text-emerald-400">{formatCurrency(v.price)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
