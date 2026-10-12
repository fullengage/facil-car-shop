// ==============================================================================
// FÁCIL CAR SHOP — APLICAÇÃO PRINCIPAL
// Stack: Vite • TypeScript • React • Tailwind CSS
// "Digite a placa, complete as fotos e anuncie seu carro."
// ==============================================================================

import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { VehicleWizardModal } from '@/components/vehicle/VehicleWizardModal'
import { VehicleEditModal } from '@/components/vehicle/VehicleEditModal'
import { StoreRegisterModal } from '@/components/store/StoreRegisterModal'
import { StoreEditModal } from '@/components/store/StoreEditModal'
import { ExternalQueriesDrawer } from '@/components/monitoring/ExternalQueriesDrawer'
import { getActiveStore, listStores } from '@/services/storeService'
import { listVehicles } from '@/services/vehicleService'
import { DashboardLayout, type UserRole } from '@/components/dashboard/DashboardLayout'
import type { Store, Vehicle } from '@/types'
import { Pencil } from 'lucide-react'

export default function PainelPage() {
  const navigate = useNavigate()
  // Estados de Negócio
  const [activeStore, setActiveStore] = React.useState<Store | null>(null)
  const [stores, setStores] = React.useState<Store[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Modais de Criação
  const [isWizardOpen, setIsWizardOpen] = React.useState(false)
  const [isStoreModalOpen, setIsStoreModalOpen] = React.useState(false)
  const [isMonitoringOpen, setIsMonitoringOpen] = React.useState(false)

  // Modais de Edição
  const [isStoreEditOpen, setIsStoreEditOpen] = React.useState(false)
  const [editingVehicle, setEditingVehicle] = React.useState<Vehicle | null>(null)

  // Cockpit de Dashboards & Perfis
  const [currentRole, setCurrentRole] = React.useState<UserRole>('LOJISTA')

  // Carregamento inicial de Loja e Veículos
  React.useEffect(() => {
    async function init() {
      setIsLoading(true)
      try {
        const allStores = await listStores()
        setStores(allStores)
        const store = allStores[0] || (await getActiveStore())
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
    setStores((prev) => [newStore, ...prev.filter((s) => s.id !== newStore.id)])
  }

  // Atualização após edição de loja
  function handleStoreUpdated(updatedStore: Store) {
    setActiveStore(updatedStore)
    setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)))
  }

  // Atualização após edição de veículo
  function handleVehicleUpdated(updatedVehicle: Vehicle) {
    setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)))
  }

  // Atualização após exclusão de veículo
  function handleVehicleDeleted(deletedId: string) {
    setVehicles((prev) => prev.filter((v) => v.id !== deletedId))
  }

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
    <div className="mx-auto max-w-[1200px] space-y-8 px-5 py-10">
      {activeStore && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-text font-medium">
            Painel de gestão · <strong className="text-dark">{activeStore.name}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStoreEditOpen(true)}
              className="flex items-center gap-1.5 rounded-brand border border-primary bg-primary/10 px-4 py-2.5 text-[14px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              <Pencil className="h-4 w-4" /> Editar Loja
            </button>
            <button
              type="button"
              onClick={() => setIsMonitoringOpen(true)}
              className="rounded-brand border border-border bg-white px-4 py-2.5 text-[14px] font-medium text-dark hover:bg-surface"
            >
              Auditoria APIs
            </button>
            <button
              type="button"
              onClick={() => setIsStoreModalOpen(true)}
              className="rounded-brand border border-border bg-white px-4 py-2.5 text-[14px] font-medium text-dark hover:bg-surface"
            >
              Nova Loja (CNPJ)
            </button>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="rounded-brand bg-primary px-4 py-2.5 text-[14px] font-bold text-white hover:bg-dark transition-colors"
            >
              Anunciar pela Placa
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {activeStore ? (
          <div className="rounded-brand bg-surface p-4 text-dark sm:p-8">
            <DashboardLayout
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
              onBackToMarketplace={() => navigate("/")}
              activeStore={activeStore}
              stores={stores.length > 0 ? stores : [activeStore]}
              vehicles={vehicles}
              onOpenAddVehicle={() => setIsWizardOpen(true)}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
              onSelectVehicle={(veh) => setEditingVehicle(veh)}
              onEditStore={(storeToEdit) => {
                setActiveStore(storeToEdit)
                setIsStoreEditOpen(true)
              }}
            />
          </div>
        ) : null}
      </main>

      {/* Modais de Criação */}
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

      {/* Modais de Edição */}
      {activeStore && (
        <StoreEditModal
          isOpen={isStoreEditOpen}
          onClose={() => setIsStoreEditOpen(false)}
          store={activeStore}
          onStoreUpdated={handleStoreUpdated}
        />
      )}

      <VehicleEditModal
        isOpen={!!editingVehicle}
        onClose={() => setEditingVehicle(null)}
        vehicle={editingVehicle}
        onVehicleUpdated={handleVehicleUpdated}
        onVehicleDeleted={handleVehicleDeleted}
      />
    </div>
  )
}
