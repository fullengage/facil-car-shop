// ==============================================================================
// CARD DE VEÍCULO NA VITRINE — foto, preço, comparação com FIPE e ficha rápida
// ==============================================================================

import { Calendar, Fuel, Gauge, Settings2, MessageCircle, ArrowUpRight } from 'lucide-react'
import type { Store, Vehicle } from '@/types'
import { formatCurrency, maskPlate } from '@/utils/plateValidator'
import { compareWithFipe, FALLBACK_PHOTO, vehicleInterestMessage, whatsappUrl } from './storefrontHelpers'

export interface StorefrontVehicleCardProps {
  store: Store
  vehicle: Vehicle
  onOpen: (vehicle: Vehicle) => void
}

export function StorefrontVehicleCard({ store, vehicle, onOpen }: StorefrontVehicleCardProps) {
  const photo = vehicle.photos?.[0] || FALLBACK_PHOTO
  const fipe = compareWithFipe(vehicle)
  const price = formatCurrency(vehicle.price)
  const contactUrl = whatsappUrl(store, vehicleInterestMessage(store, vehicle, price))

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/10">
      <button type="button" onClick={() => onOpen(vehicle)} className="relative aspect-[4/3] overflow-hidden bg-slate-950 text-left">
        <img
          src={photo}
          alt={vehicle.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          {fipe.hasFipe && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${
                fipe.below ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950/85 text-amber-300'
              }`}
            >
              {fipe.below
                ? `${Math.abs(fipe.percent).toFixed(0)}% abaixo da FIPE`
                : `${fipe.percent.toFixed(0)}% acima da FIPE`}
            </span>
          )}
          <span className="ml-auto rounded bg-slate-950/85 px-2 py-0.5 font-mono text-[11px] text-slate-200">
            {vehicle.plate_masked || maskPlate(vehicle.plate)}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">{vehicle.brand}</p>
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white">{vehicle.title}</h3>
        </div>

        <ul className="grid grid-cols-2 gap-y-2 text-xs text-slate-400">
          <li className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" />{vehicle.model_year}</li>
          <li className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-slate-500" />{vehicle.mileage.toLocaleString('pt-BR')} km</li>
          <li className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5 text-slate-500" />{vehicle.transmission || 'Manual'}</li>
          <li className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-slate-500" />{vehicle.fuel_type || 'Flex'}</li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-800 pt-4">
          <div>
            <p className="text-[11px] text-slate-500">Preço à vista</p>
            <p className="text-2xl font-black tracking-tight text-white">{price}</p>
            {fipe.hasFipe && (
              <p className="text-[11px] text-slate-500">FIPE {formatCurrency(vehicle.fipe_price ?? 0)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {contactUrl && (
              <a
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Falar no WhatsApp sobre este veículo"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => onOpen(vehicle)}
              className="flex h-10 items-center gap-1 rounded-xl bg-amber-400 px-3 text-xs font-bold text-slate-950 hover:bg-amber-300"
            >
              Detalhes <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
