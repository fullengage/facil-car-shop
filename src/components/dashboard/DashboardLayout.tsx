// ==============================================================================
// DASHBOARD CONTAINER & SELETOR DE PERFIS — FÁCIL CAR SHOP
// Orquestrador dos 5 Perfis com Transição Fluida e Isolamento de Contexto
// ==============================================================================

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Store, Vehicle } from '@/types'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { DealerDashboard } from './DealerDashboard'
import { StoreAdminDashboard } from './StoreAdminDashboard'
import { SellerDashboard } from './SellerDashboard'
import { BuyerDashboard } from './BuyerDashboard'

export type UserRole =
  | 'SUPER_ADMIN'
  | 'LOJISTA'
  | 'ADMIN_LOJA'
  | 'VENDEDOR'
  | 'COMPRADOR'

interface DashboardLayoutProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  onBackToMarketplace: () => void
  activeStore: Store
  stores: Store[]
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
  onOpenStoreModal: () => void
  onSelectVehicle?: (vehicle: Vehicle) => void
}

const ROLES_CONFIG: {
  role: UserRole
  label: string
  desc: string
  color: string
  badgeColor: string
}[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    desc: 'Visão Geral da Plataforma & MRR',
    color: 'border-purple-500 text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  {
    role: 'LOJISTA',
    label: 'Lojista',
    desc: 'Gestão Multi-Loja & Equipe',
    color: 'border-blue-500 text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  {
    role: 'ADMIN_LOJA',
    label: 'Admin Loja',
    desc: 'Cockpit da Unidade & Showroom',
    color: 'border-emerald-500 text-emerald-400',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'VENDEDOR',
    label: 'Vendedor',
    desc: 'CRM, WhatsApp & Comissões',
    color: 'border-cyan-500 text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    role: 'COMPRADOR',
    label: 'Comprador',
    desc: 'Área do Cliente & Favoritos',
    color: 'border-pink-500 text-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
]

export function DashboardLayout({
  currentRole,
  onRoleChange,
  onBackToMarketplace,
  activeStore,
  stores,
  vehicles,
  onOpenAddVehicle,
  onOpenStoreModal,
  onSelectVehicle,
}: DashboardLayoutProps) {
  const currentConfig = ROLES_CONFIG.find((r) => r.role === currentRole)!

  return (
    <div className="space-y-6">
      {/* Barra de Troca Rápida de Perfil & Navegação */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToMarketplace}
              className="border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Voltar à Vitrine</span>
            </Button>

            <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Simular Perfil:
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${currentConfig.badgeColor}`}>
                {currentConfig.label}
              </span>
            </div>
          </div>


          {/* Seletor dos 5 Perfis com botões táteis */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ROLES_CONFIG.map((item) => {
              const isSelected = item.role === currentRole
              return (
                <button
                  key={item.role}
                  onClick={() => onRoleChange(item.role)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-center border ${
                    isSelected
                      ? `${item.badgeColor} shadow-lg scale-[1.02]`
                      : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-black truncate">{item.label}</span>
                  <span className="text-[10px] opacity-75 truncate">{item.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Renderização do Painel Específico do Perfil Ativo */}
      <div className="bg-slate-950/40 rounded-2xl">
        {currentRole === 'SUPER_ADMIN' && <SuperAdminDashboard />}

        {currentRole === 'LOJISTA' && (
          <DealerDashboard
            stores={stores}
            vehicles={vehicles}
            onOpenAddVehicle={onOpenAddVehicle}
            onOpenStoreModal={onOpenStoreModal}
          />
        )}

        {currentRole === 'ADMIN_LOJA' && (
          <StoreAdminDashboard
            activeStore={activeStore}
            vehicles={vehicles}
            onOpenAddVehicle={onOpenAddVehicle}
            onSelectVehicle={onSelectVehicle}
          />
        )}

        {currentRole === 'VENDEDOR' && (
          <SellerDashboard
            vehicles={vehicles}
            onOpenAddVehicle={onOpenAddVehicle}
          />
        )}

        {currentRole === 'COMPRADOR' && (
          <BuyerDashboard
            vehicles={vehicles}
            onSelectVehicle={onSelectVehicle}
          />
        )}
      </div>
    </div>
  )
}
