import * as React from 'react'
import {
  Car,
  DollarSign,
  Gauge,
  CheckCircle2,
  AlertCircle,
  Save,
  Trash2,
  Plus,
  X,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { updateVehicle, deleteVehicle } from '@/services/vehicleService'
import type { Vehicle, VehicleStatus } from '@/types'

export interface VehicleEditModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  onVehicleUpdated: (updatedVehicle: Vehicle) => void
  onVehicleDeleted?: (deletedVehicleId: string) => void
}

export function VehicleEditModal({
  isOpen,
  onClose,
  vehicle,
  onVehicleUpdated,
  onVehicleDeleted,
}: VehicleEditModalProps) {
  if (!vehicle) return null

  const [title, setTitle] = React.useState(vehicle.title || '')
  const [price, setPrice] = React.useState(vehicle.price ? String(vehicle.price) : '')
  const [fipePrice, setFipePrice] = React.useState(vehicle.fipe_price ? String(vehicle.fipe_price) : '')
  const [mileage, setMileage] = React.useState(vehicle.mileage !== null && vehicle.mileage !== undefined ? String(vehicle.mileage) : '')
  const [modelYear, setModelYear] = React.useState(vehicle.model_year ? String(vehicle.model_year) : '')
  const [manufacturingYear, setManufacturingYear] = React.useState(vehicle.manufacturing_year ? String(vehicle.manufacturing_year) : '')
  const [color, setColor] = React.useState(vehicle.color || '')
  const [fuelType, setFuelType] = React.useState(vehicle.fuel_type || 'Flex')
  const [transmission, setTransmission] = React.useState(vehicle.transmission || 'Automático')
  const [description, setDescription] = React.useState(vehicle.description || '')
  const [status, setStatus] = React.useState<VehicleStatus>(vehicle.status || 'published')
  const [photos, setPhotos] = React.useState<string[]>(Array.isArray(vehicle.photos) ? vehicle.photos : [])
  const [newPhotoUrl, setNewPhotoUrl] = React.useState('')

  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null)

  React.useEffect(() => {
    if (vehicle) {
      setTitle(vehicle.title || '')
      setPrice(vehicle.price ? String(vehicle.price) : '')
      setFipePrice(vehicle.fipe_price ? String(vehicle.fipe_price) : '')
      setMileage(vehicle.mileage !== null && vehicle.mileage !== undefined ? String(vehicle.mileage) : '')
      setModelYear(vehicle.model_year ? String(vehicle.model_year) : '')
      setManufacturingYear(vehicle.manufacturing_year ? String(vehicle.manufacturing_year) : '')
      setColor(vehicle.color || '')
      setFuelType(vehicle.fuel_type || 'Flex')
      setTransmission(vehicle.transmission || 'Automático')
      setDescription(vehicle.description || '')
      setStatus(vehicle.status || 'published')
      setPhotos(Array.isArray(vehicle.photos) ? vehicle.photos : [])
      setNewPhotoUrl('')
      setConfirmDelete(false)
      setFeedback(null)
    }
  }, [vehicle, isOpen])

  function handleAddPhoto() {
    if (!newPhotoUrl.trim()) return
    setPhotos((prev) => [...prev, newPhotoUrl.trim()])
    setNewPhotoUrl('')
  }

  function handleRemovePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'O título do anúncio é obrigatório.' })
      return
    }

    const numPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
    if (isNaN(numPrice) || numPrice <= 0) {
      setFeedback({ type: 'error', message: 'Informe um preço válido.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const numFipe = fipePrice ? parseFloat(fipePrice.replace(/[^\d.,]/g, '').replace(',', '.')) : vehicle!.fipe_price
      const numKm = mileage !== '' ? parseInt(mileage.replace(/\D/g, ''), 10) : undefined
      const numAnoMod = modelYear ? parseInt(modelYear, 10) : vehicle!.model_year
      const numAnoFab = manufacturingYear ? parseInt(manufacturingYear, 10) : vehicle!.manufacturing_year

      const updated = await updateVehicle(vehicle!.id, {
        title,
        price: numPrice,
        fipe_price: numFipe,
        mileage: numKm,
        model_year: numAnoMod,
        manufacturing_year: numAnoFab,
        color,
        fuel_type: fuelType,
        transmission,
        description,
        status,
        photos,
      })

      if (updated) {
        setFeedback({ type: 'success', message: 'Veículo atualizado com sucesso!' })
        onVehicleUpdated(updated)
        setTimeout(() => {
          onClose()
        }, 800)
      } else {
        setFeedback({ type: 'error', message: 'Falha ao salvar veículo.' })
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao conectar ao servidor.' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setIsDeleting(true)
    try {
      await deleteVehicle(vehicle!.id)
      onVehicleDeleted?.(vehicle!.id)
      onClose()
    } catch {
      setFeedback({ type: 'error', message: 'Não foi possível excluir o veículo.' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Veículo: ${vehicle.title}`}>
      <form onSubmit={handleSave} className="space-y-6">
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Informações Principais */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Car className="h-4 w-4" /> Dados do Veículo
          </h3>

          <div>
            <label className="mb-1 block text-xs font-bold text-dark">Título do Anúncio *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Honda Civic EXL 2.0 Flex Aut. 2021"
              required
              className="bg-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Preço de Venda (R$) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="129900"
                  required
                  className="bg-white pl-9 font-bold text-dark"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Preço Tabela FIPE (R$)</label>
              <Input
                value={fipePrice}
                onChange={(e) => setFipePrice(e.target.value)}
                placeholder="132000"
                className="bg-white text-muted"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Status do Anúncio</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none"
              >
                <option value="published">Publicado (Visível no site)</option>
                <option value="draft">Rascunho (Oculto)</option>
                <option value="sold">Vendido</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Quilometragem (KM)</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="45000"
                  className="bg-white pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Ano Modelo</label>
              <Input
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                placeholder="2022"
                className="bg-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none"
              >
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel">Diesel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Câmbio</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none"
              >
                <option value="Automático">Automático</option>
                <option value="Manual">Manual</option>
                <option value="CVT">CVT</option>
                <option value="Automatizado">Automatizado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2 border-t border-border pt-4">
          <label className="block text-xs font-bold text-dark flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-primary" /> Descrição do Anúncio
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalhes opcionais, estado dos pneus, revisões na concessionária, laudo cautelar aprovado..."
            className="w-full rounded-md border border-border bg-white p-3 text-sm text-dark focus:border-primary focus:outline-none"
          />
        </div>

        {/* Gerenciamento de Fotos */}
        <div className="space-y-3 border-t border-border pt-4">
          <label className="block text-xs font-bold text-dark">Fotos do Anúncio ({photos.length})</label>
          
          <div className="flex gap-2">
            <Input
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Cole a URL de uma foto (https://...)"
              className="bg-white flex-1 text-xs"
            />
            <Button type="button" variant="outline" onClick={handleAddPhoto} className="shrink-0 text-xs">
              <Plus className="h-4 w-4 mr-1" /> Adicionar Foto
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-surface">
                  <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Remover foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé: Salvar e Excluir */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className={`text-xs ${confirmDelete ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {confirmDelete ? 'Confirmar Exclusão do Veículo?' : 'Excluir Veículo'}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isDeleting} className="bg-primary hover:bg-primary-hover text-white font-bold">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
