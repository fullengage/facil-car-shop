// ==============================================================================
// BARRA DE NAVEGAÇÃO PRINCIPAL — FÁCIL CAR SHOP
// ==============================================================================

import {
  PlusCircle,
  Building2,
  Activity,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { isSupabaseConfigured } from '@/services/supabaseClient'
import type { Store } from '@/types'

export interface NavbarProps {
  activeStore: Store
  vehicleCount?: number
  isDashboardActive?: boolean
  onToggleDashboard?: () => void
  onOpenAddVehicle: () => void
  onOpenStoreModal: () => void
  onOpenMonitoring: () => void
}

export function Navbar({
  activeStore,
  isDashboardActive = false,
  onToggleDashboard,
  onOpenAddVehicle,
  onOpenStoreModal,
  onOpenMonitoring,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo e Identidade */}
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-white px-2.5 py-1.5">
            <img src="/logo-facil-car-shop.png" alt="Fácil Car Shop" className="h-8 w-auto" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="text-[10px] py-0 px-1.5 hidden sm:inline-flex">
                BrasilAPI • FIPE
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span className="flex items-center text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                {isSupabaseConfigured ? 'Supabase fcs_ Conectado' : 'Modo Demonstração Local'}
              </span>
              <span>•</span>
              <span className="truncate max-w-[140px] text-slate-300 font-medium">
                {activeStore.name}
              </span>
            </div>
          </div>
        </div>

        {/* Ações e Atalhos */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Monitor de Consultas */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenMonitoring}
            className="text-xs border-slate-800 text-slate-300 hover:text-white"
            title="Auditoria de Consultas Externas"
          >
            <Activity className="w-4 h-4 sm:mr-1.5 text-blue-400" />
            <span className="hidden sm:inline">Auditoria APIs</span>
          </Button>

          {/* Cadastro de Loja */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenStoreModal}
            className="text-xs border-slate-800 text-slate-300 hover:text-white"
          >
            <Building2 className="w-4 h-4 sm:mr-1.5 text-emerald-400" />
            <span className="hidden sm:inline">Nova Loja (CNPJ)</span>
          </Button>

          {/* Alternar entre Vitrine e Cockpit Dashboards & CRM */}
          {onToggleDashboard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleDashboard}
              className={`text-xs font-bold border-slate-700 ${
                isDashboardActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-900 text-slate-200 hover:text-white hover:border-slate-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:mr-1.5 text-cyan-400" />
              <span className="hidden sm:inline">
                {isDashboardActive ? 'Ver Vitrine Pública' : 'Cockpit CRM (5 Dashboards)'}
              </span>
              <span className="sm:hidden">CRM</span>
            </Button>
          )}

          {/* Botão de Destaque: Adicionar Veículo por Placa */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onOpenAddVehicle}
            className="text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            <span>Anunciar pela Placa</span>
          </Button>
        </div>
      </div>
    </header>

  )
}
