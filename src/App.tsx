// ==============================================================================
// FÁCIL CAR SHOP — APLICAÇÃO PRINCIPAL
// Stack: Vite • TypeScript • React • Tailwind CSS
// "Digite a placa, complete as fotos e anuncie seu carro."
// ==============================================================================

import * as React from 'react'
import {
  Sparkles,
  Search,
  TrendingDown,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  CarFront,
  Zap,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { VehicleCard } from '@/components/vehicle/VehicleCard'
import { VehicleWizardModal } from '@/components/vehicle/VehicleWizardModal'
import { VehiclePreviewModal } from '@/components/vehicle/VehiclePreviewModal'
import { VehicleDetailView } from '@/components/vehicle/VehicleDetailView'
import { StoreRegisterModal } from '@/components/store/StoreRegisterModal'
import { ExternalQueriesDrawer } from '@/components/monitoring/ExternalQueriesDrawer'
import { SeoHead } from '@/components/seo/SeoHead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getActiveStore } from '@/services/storeService'
import { listVehicles, deleteVehicle } from '@/services/vehicleService'
import { DashboardLayout, type UserRole } from '@/components/dashboard/DashboardLayout'
import type { Store, Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'
import { generateWebsiteSchemaJsonLd, DEFAULT_SITE_URL } from '@/utils/seo'

export function App() {
  // Estados de Negócio
  const [activeStore, setActiveStore] = React.useState<Store | null>(null)
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterQuery, setFilterQuery] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<'all' | 'below_fipe' | 'draft'>('all')

  // Modais e Navegação
  const [isWizardOpen, setIsWizardOpen] = React.useState(false)
  const [isStoreModalOpen, setIsStoreModalOpen] = React.useState(false)
  const [isMonitoringOpen, setIsMonitoringOpen] = React.useState(false)
  const [previewVehicle, setPreviewVehicle] = React.useState<Vehicle | null>(null)
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = React.useState<Vehicle | null>(null)

  // Fase 2: Cockpit de Dashboards & Perfis
  const [isDashboardView, setIsDashboardView] = React.useState(false)
  const [currentRole, setCurrentRole] = React.useState<UserRole>('LOJISTA')

  // Carregamento inicial de Loja e Veículos
  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        const store = await getActiveStore()
        setActiveStore(store)
        const vehicleList = await listVehicles(store.id)
        setVehicles(vehicleList)
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Atualização após criação de novo veículo
  function handleVehicleCreated(newVehicle: Vehicle) {
    setVehicles((prev) => [newVehicle, ...prev.filter((v) => v.id !== newVehicle.id)])
  }

  // Atualização após criação de nova loja
  function handleStoreCreated(newStore: Store) {
    setActiveStore(newStore)
  }

  // Exclusão de veículo
  async function handleDeleteVehicle(id: string) {
    if (confirm('Tem certeza que deseja remover este anúncio?')) {
      await deleteVehicle(id)
      setVehicles((prev) => prev.filter((v) => v.id !== id))
    }
  }

  // Filtragem
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        v.brand.toLowerCase().includes(filterQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
        (v.plate_masked && v.plate_masked.toLowerCase().includes(filterQuery.toLowerCase()))

      if (!matchesSearch) return false

      if (activeTab === 'below_fipe') {
        return (v.fipe_price || 0) > 0 && v.price < (v.fipe_price || 0)
      }
      if (activeTab === 'draft') {
        return v.status === 'draft'
      }

      return true
    })
  }, [vehicles, filterQuery, activeTab])

  // Estatísticas Rápidas
  const totalStockValue = vehicles.reduce((acc, v) => acc + (v.price || 0), 0)
  const vehiclesBelowFipe = vehicles.filter(
    (v) => (v.fipe_price || 0) > 0 && v.price < (v.fipe_price || 0)
  ).length

  if (!activeStore && isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando Fácil Car Shop...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navbar Superior */}
      {activeStore && (
        <Navbar
          activeStore={activeStore}
          vehicleCount={vehicles.length}
          isDashboardActive={isDashboardView}
          onToggleDashboard={() => {
            setIsDashboardView(!isDashboardView)
            setSelectedVehicleForDetail(null)
          }}
          onOpenAddVehicle={() => setIsWizardOpen(true)}
          onOpenStoreModal={() => setIsStoreModalOpen(true)}
          onOpenMonitoring={() => setIsMonitoringOpen(true)}
        />
      )}

      {/* Conteúdo Central */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {isDashboardView && activeStore ? (
          <div className="rounded-brand bg-surface p-4 text-dark sm:p-8">
          <DashboardLayout
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onBackToMarketplace={() => setIsDashboardView(false)}
            activeStore={activeStore}
            stores={[activeStore]}
            vehicles={vehicles}
            onOpenAddVehicle={() => setIsWizardOpen(true)}
            onOpenStoreModal={() => setIsStoreModalOpen(true)}
            onSelectVehicle={(v) => {
              setSelectedVehicleForDetail(v)
              setIsDashboardView(false)
            }}
          />
          </div>
        ) : selectedVehicleForDetail ? (
          <VehicleDetailView
            vehicle={selectedVehicleForDetail}
            store={activeStore || undefined}
            onBack={() => setSelectedVehicleForDetail(null)}
          />
        ) : (
          <>
            {/* SEO Head Dinâmico da Home */}
            <SeoHead
              title="Fácil Car Shop — Cadastro Inteligente de Veículos e Tabela FIPE"
              description="Anuncie seu carro em menos de 2 minutos digitando apenas a placa. Consulta instantânea à Tabela FIPE oficial da BrasilAPI e máxima proteção de dados."
              canonicalUrl={DEFAULT_SITE_URL}
              ogType="website"
              jsonLd={generateWebsiteSchemaJsonLd()}
              keywords={[
                'comprar carros',
                'vender carros pela placa',
                'tabela fipe oficial',
                'brasilapi fipe',
                'facil car shop',
                'carros seminovos',
                activeStore?.address_city || 'São Paulo',
              ]}
            />

            {/* Hero Banner — "Digite a placa, complete as fotos e anuncie seu carro" */}
            <section className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 p-6 sm:p-10 shadow-2xl">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Cadastro Inteligente Integrado à BrasilAPI</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  Digite a placa, complete as fotos e anuncie seu carro.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  O Fácil Car Shop automatiza o preenchimento de especificações técnicas pela placa e
                  calcula o preço de referência da Tabela FIPE em tempo real. Cadastro em aproximadamente 2 minutos.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center space-x-2"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Adicionar Veículo pela Placa</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsMonitoringOpen(true)}
                    className="border-slate-700 text-slate-200 hover:text-white"
                  >
                    <Zap className="w-4 h-4 mr-2 text-cyan-400" />
                    Ver Auditoria das Consultas
                  </Button>
                </div>
              </div>
            </section>

            {/* Cards de Métricas do Catálogo */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <CarFront className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Total em Estoque</span>
                  <strong className="text-2xl font-black text-white">{vehicles.length} veículos</strong>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Oportunidades Abaixo da FIPE</span>
                  <strong className="text-2xl font-black text-emerald-400">
                    {vehiclesBelowFipe} anúncios
                  </strong>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Valor Total Anunciado</span>
                  <strong className="text-2xl font-black text-white">
                    {formatCurrency(totalStockValue)}
                  </strong>
                </div>
              </div>
            </section>

            {/* Barra de Filtros e Busca */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Abas Rápidas */}
                <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'all'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todos ({vehicles.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('below_fipe')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'below_fipe'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Abaixo da FIPE ({vehiclesBelowFipe})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('draft')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'draft'
                        ? 'bg-slate-700 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rascunhos
                  </button>
                </div>

                {/* Campo de Busca */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="Buscar modelo, marca ou placa..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              {/* Grid de Veículos */}
              {filteredVehicles.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-4">
                  <CarFront className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Nenhum veículo encontrado</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {filterQuery
                        ? 'Tente ajustar os termos da sua busca.'
                        : 'Cadastre o primeiro carro da sua loja digitando a placa.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 font-semibold"
                  >
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    Cadastrar Veículo Agora
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      storeName={activeStore?.name}
                      onPreview={(veh) => setSelectedVehicleForDetail(veh)}
                      onDelete={handleDeleteVehicle}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">FÁCIL CAR SHOP</span>
            <span>—</span>
            <span>Integração Oficial BrasilAPI & Provedores de Placas</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              LGPD: Placas protegidas na visualização pública
            </span>
          </div>
        </div>
      </footer>

      {/* Modais Globais */}
      {activeStore && (
        <VehicleWizardModal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          activeStore={activeStore}
          onVehicleCreated={handleVehicleCreated}
        />
      )}

      <StoreRegisterModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        onStoreCreated={handleStoreCreated}
      />

      <ExternalQueriesDrawer
        isOpen={isMonitoringOpen}
        onClose={() => setIsMonitoringOpen(false)}
      />

      {previewVehicle && (
        <VehiclePreviewModal
          isOpen={Boolean(previewVehicle)}
          onClose={() => setPreviewVehicle(null)}
          vehicle={previewVehicle}
          store={activeStore || undefined}
          onConfirmPublish={() => setPreviewVehicle(null)}
        />
      )}
    </div>
  )
}

export default App
