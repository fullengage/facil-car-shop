// ==============================================================================
// DASHBOARD DO LOJISTA — FÁCIL CAR SHOP
// Gestão Consolidada de Lojas, Equipe de Vendas, Estoque e Limites do Plano
// ==============================================================================

import * as React from 'react'
import {
  Building2,
  PlusCircle,
  Store as StoreIcon,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Store, Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'
import { CrmKanbanBoard } from './CrmKanbanBoard'


interface DealerDashboardProps {
  stores: Store[]
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
  onOpenStoreModal: () => void
}

export function DealerDashboard({
  stores,
  vehicles,
  onOpenAddVehicle,
  onOpenStoreModal,
}: DealerDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'crm' | 'stores' | 'team'>('overview')

  // Cálculos Consolidados
  const totalStockValue = vehicles.reduce((acc, v) => acc + (v.price || 0), 0)
  const totalVehiclesCount = vehicles.length
  const limitVehicles = 70 // Limite do plano Pro Cockpit
  const usagePercent = Math.min(100, Math.round((totalVehiclesCount / limitVehicles) * 100))

  return (
    <div className="space-y-6">
      {/* Header do Lojista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-2">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Perfil: LOJISTA • Visão Consolidada da Rede</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Cockpit de Gestão Automotiva
          </h2>
          <p className="text-sm text-slate-400">
            Acompanhe o desempenho consolidado de todas as unidades, estoque, equipe e funil de vendas.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={onOpenStoreModal}
            variant="outline"
            className="border-slate-700 text-slate-200"
          >
            <StoreIcon className="w-4 h-4 mr-2 text-cyan-400" />
            Nova Unidade
          </Button>
          <Button
            onClick={onOpenAddVehicle}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Cadastrar Carro
          </Button>
        </div>
      </div>

      {/* Navegação por Abas do Lojista */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Visão Geral & Indicadores
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'crm'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          CRM & Funil Consolidado
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'stores'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Lojas ({stores.length})
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'team'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          Equipe de Vendedores (3)
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Métricas do Lojista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Valor Total do Estoque
              </span>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(totalStockValue)}
              </p>
              <span className="text-xs text-slate-500 mt-1 block">Patrimônio anunciado</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Veículos Anunciados
              </span>
              <p className="text-2xl font-black text-white">{totalVehiclesCount} carros</p>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {usagePercent}% do limite do plano ({totalVehiclesCount}/{limitVehicles})
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Unidades Operacionais
              </span>
              <p className="text-2xl font-black text-cyan-400">{stores.length} lojas</p>
              <span className="text-xs text-slate-500 mt-1 block">Todas integradas ao CRM</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-xs font-medium text-slate-400 block mb-1">
                Plano Contratado
              </span>
              <p className="text-xl font-black text-purple-400 flex items-center space-x-1">
                <ShieldCheck className="w-5 h-5" />
                <span>Pro Cockpit</span>
              </p>
              <span className="text-xs text-emerald-400 mt-1 block">Assinatura Ativa</span>
            </div>
          </div>

          {/* Lista Resumida de Unidades */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <h3 className="font-bold text-white text-base">Unidades da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{st.name}</h4>
                    <p className="text-xs text-slate-400">
                      {st.address_city} - {st.address_state}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{st.cnpj || 'CNPJ verificado'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400 block">
                      {vehicles.filter((v) => v.store_id === st.id).length || vehicles.length} carros
                    </span>
                    <span className="text-[11px] text-emerald-400">Ativa</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
            Visualizando o pipeline de leads de todas as lojas. Mova os cards entre as colunas para atualizar as etapas.
          </div>
          <CrmKanbanBoard />
        </div>
      )}

      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((s) => (
              <div key={s.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-lg">{s.name}</h4>
                    <p className="text-xs text-slate-400">{s.corporate_name}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Aprovada
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>📍 {s.address_street}, {s.address_number} - {s.address_city}/{s.address_state}</p>
                  <p>📞 {s.phone || '(11) 98888-7777'}</p>
                  <p>🌐 Vitrine: /loja/{s.slug || 'matriz'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="font-bold text-white text-base">Vendedores & Consultores Vinculados</h3>
          <div className="divide-y divide-slate-800/80">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Carlos Eduardo Mendes</p>
                <p className="text-xs text-slate-400">carlos.vendas@autofacil.com.br • Loja Matriz</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Vendedor Ativo (14 leads)
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Ana Paula Rocha</p>
                <p className="text-xs text-slate-400">ana.rocha@autofacil.com.br • Loja Matriz</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Vendedora Ativa (9 leads)
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Lucas Silva</p>
                <p className="text-xs text-slate-400">lucas.silva@autofacil.com.br • Unidade 2</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Vendedor Ativo (5 leads)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
