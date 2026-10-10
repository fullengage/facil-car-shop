// ==============================================================================
// DETALHE DO VEÍCULO NA VITRINE — galeria, ficha técnica, FIPE e contato
// ==============================================================================

import * as React from 'react'
import { MessageCircle, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import type { Store, Vehicle } from '@/types'
import { formatCurrency, maskPlate } from '@/utils/plateValidator'
import { compareWithFipe, FALLBACK_PHOTO, vehicleInterestMessage, whatsappUrl } from './storefrontHelpers'

export interface VehicleDetailModalProps {
  store: Store
  vehicle: Vehicle | null
  onClose: () => void
}

export function VehicleDetailModal({ store, vehicle, onClose }: VehicleDetailModalProps) {
  const [photoIndex, setPhotoIndex] = React.useState(0)

  // Volta para a primeira foto ao trocar de veículo
  React.useEffect(() => setPhotoIndex(0), [vehicle?.id])

  if (!vehicle) return null

  const photos = vehicle.photos?.length ? vehicle.photos : [FALLBACK_PHOTO]
  const price = formatCurrency(vehicle.price)
  const fipe = compareWithFipe(vehicle)
  const contactUrl = whatsappUrl(store, vehicleInterestMessage(store, vehicle, price))

  const specs: [string, string][] = [
    ['Ano modelo', String(vehicle.model_year)],
    ['Quilometragem', `${vehicle.mileage.toLocaleString('pt-BR')} km`],
    ['Câmbio', vehicle.transmission || 'Manual'],
    ['Combustível', vehicle.fuel_type || 'Flex'],
    ['Cor', vehicle.color || 'Não informada'],
    ['Placa', vehicle.plate_masked || maskPlate(vehicle.plate)],
  ]

  return (
    <Modal isOpen onClose={onClose} title={vehicle.title} maxWidth="4xl">
      <div className="grid gap-6 md:grid-cols-5">
        {/* Galeria */}
        <div className="space-y-3 md:col-span-3">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-950">
            <img src={photos[photoIndex]} alt={vehicle.title} className="h-full w-full object-cover" />
          </div>
          {photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  aria-label={`Foto ${i + 1}`}
                  className={`aspect-[4/3] overflow-hidden rounded-lg border-2 ${
                    i === photoIndex ? 'border-amber-400' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preço, FIPE e contato */}
        <div className="space-y-5 md:col-span-2">
          <div>
            <p className="text-xs text-slate-500">Preço à vista</p>
            <p className="text-3xl font-black tracking-tight text-white">{price}</p>
          </div>

          {fipe.hasFipe && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                fipe.below
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
              }`}
            >
              <p className="flex items-center gap-2 font-bold">
                {fipe.below ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                {fipe.below ? 'Abaixo da Tabela FIPE' : 'Acima da Tabela FIPE'}
              </p>
              <p className="mt-1 text-xs opacity-80">
                FIPE {formatCurrency(vehicle.fipe_price ?? 0)}
                {vehicle.fipe_reference_month ? ` · ${vehicle.fipe_reference_month}` : ''}
                {' · '}
                {formatCurrency(Math.abs(fipe.diff))} de {fipe.below ? 'economia' : 'diferença'}
              </p>
            </div>
          )}

          <a
            href={contactUrl ?? undefined}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!contactUrl}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white ${
              contactUrl ? 'bg-emerald-600 hover:bg-emerald-500' : 'pointer-events-none bg-slate-700'
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            Falar com a loja no WhatsApp
          </a>

          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            A placa completa não é exibida. Confirme os detalhes presencialmente antes de fechar negócio.
          </p>
        </div>

        {/* Ficha técnica */}
        <div className="md:col-span-3">
          <h4 className="mb-3 text-sm font-bold text-white">Ficha técnica</h4>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-800 pb-2">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {vehicle.description && (
          <div className="md:col-span-2">
            <h4 className="mb-3 text-sm font-bold text-white">Sobre o veículo</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">{vehicle.description}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
