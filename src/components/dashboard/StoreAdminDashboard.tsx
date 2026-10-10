// ==============================================================================
// DASHBOARD DO ADMINISTRADOR DE LOJA — FÁCIL CAR SHOP
// Gestão Operacional de Unidade, Estoque, Vendedores e CRM
// ==============================================================================

import * as React from 'react'
import {
  CarFront,
  PlusCircle,
  Target,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Store, Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'
import { CrmKanbanBoard } from './CrmKanbanBoard'


interface StoreAdminDashboardProps {
  activeStore: Store
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
  onSelectVehicle?: (vehicle: Vehicle) => void
}

export function StoreAdminDashboard({
  activeStore,
  vehicles,
  onOpenAddVehicle,
  onSelectVehicle,
}: StoreAdminDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'crm' | 'stock' | 'team'>('crm')
  const [stockSearch, setStockSearch] = React.useState('')

  const storeVehicles = vehicles.filter(
    (v) => !v.store_id || v.store_id === activeStore.id
  )

  const filteredStock = storeVehicles.filter(
    (v) =>
      v.title.toLowerCase().includes(stockSearch.toLowerCase()) ||
      v.brand.toLowerCase().includes(stockSearch.toLowerCase()) ||
      (v.plate_masked && v.plate_masked.toLowerCase().includes(stockSearch.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header do Administrador de Loja */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary bg-steel/10 px-3 py-1 text-xs font-semibold text-steel mb-2">
            <Target className="w-3.5 h-3.5 text-steel" />
            <span>Perfil: ADMIN_LOJA • {activeStore.name}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-dark">
            Cockpit Operacional da Loja
          </h2>
          <p className="text-sm text-text">
            Gerenciamento do showroom, estoque ativo, atendimento aos leads e metas de fechamento.
          </p>
        </div>

        <Button
          onClick={onOpenAddVehicle}
          className="bg-primary hover:bg-primary-hover text-white font-bold"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Anunciar pela Placa
        </Button>
      </div>

      {/* Cards de Métricas Operacionais da Loja */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <span className="text-xs font-medium text-text block mb-1">Carros em Showroom</span>
          <p className="text-2xl font-black text-dark">{storeVehicles.length} veículos</p>
          <span className="text-xs text-steel mt-1 block">Prontos para venda</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <span className="text-xs font-medium text-text block mb-1">Consultores Ativos</span>
          <p className="text-2xl font-black text-primary">2 vendedores</p>
          <span className="text-xs text-text mt-1 block">Plantão presencial & WhatsApp</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <span className="text-xs font-medium text-text block mb-1">Meta do Mês</span>
          <p className="text-2xl font-black text-steel">8 / 12 vendas</p>
          <span className="text-xs text-steel mt-1 block">67% da meta atingida</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'crm'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          CRM & Funil da Loja
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'stock'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          Gestão do Estoque ({storeVehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'team'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          Vendedores da Loja
        </button>
      </div>

      {activeTab === 'crm' && (
        <div className="space-y-4">
          <CrmKanbanBoard storeId={activeStore.id} />
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex items-center max-w-sm">
            <Input
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder="Filtrar por marca, modelo ou placa..."
              className="bg-surface border-border text-sm h-9"
            />
          </div>

          <div className="rounded-2xl border border-border bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-text text-xs uppercase border-b border-border">
                <tr>
                  <th className="p-3.5">Veículo</th>
                  <th className="p-3.5">Ano / Modelo</th>
                  <th className="p-3.5">Placa</th>
                  <th className="p-3.5">Preço Anunciado</th>
                  <th className="p-3.5">Referência FIPE</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStock.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => onSelectVehicle?.(v)}
                    className="hover:bg-surface cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-dark flex items-center space-x-2">
                      <CarFront className="w-4 h-4 text-primary shrink-0" />
                      <span>{v.title}</span>
                    </td>
                    <td className="p-3.5 text-dark text-xs">
                      {v.model_year} • {v.fuel_type || 'Flex'}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-text">
                      {v.plate_masked || 'Protegida'}
                    </td>
                    <td className="p-3.5 font-bold text-steel">
                      {formatCurrency(v.price)}
                    </td>
                    <td className="p-3.5 text-text text-xs">
                      {v.fipe_price ? formatCurrency(v.fipe_price) : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-steel/10 text-steel">
                        {v.status === 'published' ? 'Publicado' : v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <h3 className="font-bold text-dark text-base">Vendedores com Acesso a Esta Loja</h3>
          <div className="space-y-3">
            <div className="p-3 bg-surface border border-border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-dark text-sm">Carlos Eduardo Mendes</p>
                <p className="text-xs text-text">Telefone: (11) 98765-4321</p>
              </div>
              <span className="text-xs font-bold text-primary">14 leads em carteira</span>
            </div>
            <div className="p-3 bg-surface border border-border rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold text-dark text-sm">Ana Paula Rocha</p>
                <p className="text-xs text-text">Telefone: (11) 98123-4567</p>
              </div>
              <span className="text-xs font-bold text-primary">9 leads em carteira</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
