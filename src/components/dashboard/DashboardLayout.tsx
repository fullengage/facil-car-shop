// ==============================================================================
// SHELL DO SISTEMA — sidebar com a hierarquia de perfis + área de conteúdo
// Hierarquia: Lojista (guarda-chuva) > Admin da loja > Vendedor da loja.
// Vendedor autônomo é pessoa física e não pertence a loja nem a lojista.
// Props e troca de perfil preservados: a lógica dos painéis não muda aqui.
// ==============================================================================

import { ArrowLeft, Building2, ShieldCheck, Briefcase, UserRound, UserCog, Users } from 'lucide-react'
import type { Store as StoreType, Vehicle } from '@/types'
import { SuperAdminDashboard } from './SuperAdminDashboard'
import { DealerDashboard } from './DealerDashboard'
import { StoreAdminDashboard } from './StoreAdminDashboard'
import { SellerDashboard } from './SellerDashboard'
import { BuyerDashboard } from './BuyerDashboard'

export type UserRole =
  | 'SUPER_ADMIN'
  | 'LOJISTA'
  | 'ADMIN_LOJA'
  | 'VENDEDOR_LOJA'
  | 'VENDEDOR'
  | 'COMPRADOR'

interface DashboardLayoutProps {
  currentRole: UserRole
  onRoleChange: (role: UserRole) => void
  onBackToMarketplace: () => void
  activeStore: StoreType
  stores: StoreType[]
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
  onOpenStoreModal: () => void
  onSelectVehicle?: (vehicle: Vehicle) => void
  onEditStore?: (store: StoreType) => void
}

type Grupo = 'Plataforma' | 'Lojas' | 'Independente' | 'Comprador'

const ROLES_CONFIG: {
  role: UserRole
  label: string
  desc: string
  grupo: Grupo
  nivel: 0 | 1 | 2
  icon: typeof ShieldCheck
}[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Plataforma e MRR', grupo: 'Plataforma', nivel: 0, icon: ShieldCheck },
  { role: 'LOJISTA', label: 'Lojista', desc: 'Rede de lojas e equipe', grupo: 'Lojas', nivel: 0, icon: Building2 },
  { role: 'ADMIN_LOJA', label: 'Admin da loja', desc: 'Unidade e showroom', grupo: 'Lojas', nivel: 1, icon: UserCog },
  { role: 'VENDEDOR_LOJA', label: 'Vendedor da loja', desc: 'Leads e comissões da loja', grupo: 'Lojas', nivel: 2, icon: Briefcase },
  { role: 'VENDEDOR', label: 'Vendedor autônomo', desc: 'Pessoa física, sem loja', grupo: 'Independente', nivel: 0, icon: Users },
  { role: 'COMPRADOR', label: 'Comprador', desc: 'Favoritos e alertas', grupo: 'Comprador', nivel: 0, icon: UserRound },
]

const GRUPOS: Grupo[] = ['Plataforma', 'Lojas', 'Independente', 'Comprador']

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
  onEditStore,
}: DashboardLayoutProps) {
  const currentConfig = ROLES_CONFIG.find((r) => r.role === currentRole)!

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Sidebar: hierarquia de perfis (simulação de acesso até o login) */}
      <aside aria-label="Perfis do sistema" className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-brand bg-white p-4 shadow-soft">
          <nav className="space-y-5">
            {GRUPOS.map((grupo) => {
              const itens = ROLES_CONFIG.filter((r) => r.grupo === grupo)
              return (
                <div key={grupo}>
                  <p className="px-3 pb-2 text-[12px] font-bold uppercase tracking-[0.8px] text-text">{grupo}</p>
                  <ul className="space-y-1">
                    {itens.map((item) => {
                      const ativo = item.role === currentRole
                      const Icon = item.icon
                      return (
                        <li key={item.role} style={{ paddingLeft: item.nivel * 16 }}>
                          <button
                            type="button"
                            aria-current={ativo ? 'page' : undefined}
                            onClick={() => onRoleChange(item.role)}
                            className={`flex w-full items-center gap-3 rounded-brand px-3 py-2.5 text-left transition-colors ${
                              ativo ? 'bg-primary text-white' : 'text-dark hover:bg-surface'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="min-w-0">
                              <span className="block text-[15px] font-bold leading-tight">{item.label}</span>
                              <span className={`block truncate text-[12px] ${ativo ? 'text-white/80' : 'text-text'}`}>{item.desc}</span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </nav>
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="flex w-full items-center gap-2 rounded-brand px-3 py-2.5 text-[14px] font-medium text-text hover:bg-surface hover:text-dark"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar à vitrine
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo do perfil ativo */}
      <section aria-labelledby="perfil-ativo" className="min-w-0 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.8px] text-primary">Visão do perfil</p>
            <h2 id="perfil-ativo" className="mt-1 text-[28px] leading-[34px] text-dark md:text-[34px] md:leading-[40px]">
              {currentConfig.label}
            </h2>
            <p className="mt-1 text-[15px]">{currentConfig.desc}</p>
          </div>
          <span className="rounded-brand bg-surface px-3 py-1.5 text-[13px] font-medium text-dark">
            Simulação de acesso
          </span>
        </header>

        {currentRole === 'SUPER_ADMIN' && <SuperAdminDashboard />}

        {currentRole === 'LOJISTA' && (
          <DealerDashboard
            stores={stores}
            vehicles={vehicles}
            onOpenAddVehicle={onOpenAddVehicle}
            onOpenStoreModal={onOpenStoreModal}
            onEditStore={onEditStore}
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

        {(currentRole === 'VENDEDOR_LOJA' || currentRole === 'VENDEDOR') && (
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
      </section>
    </div>
  )
}
