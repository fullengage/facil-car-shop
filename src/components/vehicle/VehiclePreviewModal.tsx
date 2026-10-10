// ==============================================================================
// MODAL DE PRÉ-VISUALIZAÇÃO COMPLETA DO ANÚNCIO (ANTES DE PUBLICAR)
// Protege a placa contra exibição pública (exibe apenas plate_masked)
// ==============================================================================

import * as React from 'react'
import {
  Calendar,
  Fuel,
  Gauge,
  ShieldCheck,
  Building2,
  MapPin,
  TrendingDown,
  CheckCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import type { Vehicle, Store } from '@/types'
import { formatCurrency, maskPlate } from '@/utils/plateValidator'

export interface VehiclePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Partial<Vehicle>
  store?: Store
  onConfirmPublish: () => void
  isPublishing?: boolean
}

export function VehiclePreviewModal({
  isOpen,
  onClose,
  vehicle,
  store,
  onConfirmPublish,
  isPublishing,
}: VehiclePreviewModalProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)
  const photos = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : []
  const currentPhoto = photos[selectedPhotoIndex] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'

  const announcedPrice = vehicle.price || 0
  const fipePrice = vehicle.fipe_price || 0
  const diff = announcedPrice - fipePrice
  const diffPercent = fipePrice > 0 ? (diff / fipePrice) * 100 : 0
  const isBelow = diff < 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pré-visualização do Anúncio Público"
      description="Veja como seu veículo aparecerá no marketplace e catálogo da loja."
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Galeria de Fotos */}
        <div className="space-y-2">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <img
              src={currentPhoto}
              alt={vehicle.title || 'Foto do veículo'}
              className="w-full h-full object-cover"
            />
            {/* Placa Mascarada em Destaque na Foto */}
            <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-md text-xs font-mono text-slate-200 flex items-center space-x-1.5 shadow-lg">
              <span className="text-[10px] text-blue-400 font-bold">PLACA:</span>
              <strong className="text-white">
                {vehicle.plate_masked || maskPlate(vehicle.plate)}
              </strong>
            </div>

            {/* Selo FIPE na Foto */}
            {fipePrice > 0 && isBelow && (
              <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{Math.abs(diffPercent).toFixed(1)}% ABAIXO DA FIPE</span>
              </div>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-14 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                    idx === selectedPhotoIndex
                      ? 'border-blue-500 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {vehicle.brand} • {vehicle.version || vehicle.model}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                {vehicle.title || `${vehicle.brand} ${vehicle.model}`}
              </h3>
            </div>

            {/* Badges de Atributos Técnicos */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" className="py-1 px-2.5">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {vehicle.model_year}
                {vehicle.manufacturing_year ? `/${vehicle.manufacturing_year}` : ''}
              </Badge>
              <Badge variant="secondary" className="py-1 px-2.5">
                <Gauge className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {vehicle.mileage?.toLocaleString('pt-BR')} km
              </Badge>
              <Badge variant="secondary" className="py-1 px-2.5">
                <Fuel className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {vehicle.fuel_type || 'Flex'}
              </Badge>
              {vehicle.color && (
                <Badge variant="secondary" className="py-1 px-2.5">
                  Cor: {vehicle.color}
                </Badge>
              )}
            </div>

            {/* Descrição */}
            {vehicle.description && (
              <div className="pt-2">
                <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Sobre o veículo
                </h5>
                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Dados da Loja */}
            {store && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{store.name}</span>
                    <span className="text-slate-400 flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5" />
                      {store.address_city} - {store.address_state}
                    </span>
                  </div>
                </div>
                <Badge variant="success">Loja Verificada</Badge>
              </div>
            )}
          </div>

          {/* Coluna Lateral: Preço e Tabela FIPE */}
          <div className="space-y-4">
            {/* Bloco de Preço */}
            <div className="rounded-xl border border-blue-900/50 bg-slate-900/90 p-4 space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Preço Anunciado</span>
              <div className="text-3xl font-black text-white">
                {formatCurrency(announcedPrice)}
              </div>

              {fipePrice > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Tabela FIPE:</span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(fipePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400">Variação:</span>
                    <span className={isBelow ? 'text-emerald-400' : 'text-cyan-400'}>
                      {isBelow
                        ? `${Math.abs(diffPercent).toFixed(1)}% abaixo`
                        : `+${diffPercent.toFixed(1)}% acima`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Aviso de Privacidade */}
            <div className="rounded-lg bg-slate-800/30 border border-slate-800 p-3 text-xs text-slate-400 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Privacidade garantida:</strong> A placa completa e dados restritos
                não serão expostos a terceiros. Apenas a placa mascarada é exibida.
              </span>
            </div>

            {/* Ações */}
            <div className="pt-2 space-y-2">
              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={onConfirmPublish}
                isLoading={isPublishing}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar e Publicar Anúncio
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isPublishing}
                className="w-full text-slate-400"
              >
                Voltar e Ajustar Dados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
