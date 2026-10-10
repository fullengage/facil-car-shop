// ==============================================================================
// CARD DE VEÍCULO NO CATÁLOGO / MARKETPLACE
// Exibe placa mascarada, valores comparativos FIPE e detalhes de venda
// ==============================================================================


import {
  Calendar,
  Gauge,
  Fuel,
  TrendingDown,
  Building2,
  Eye,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Vehicle } from '@/types'
import { formatCurrency, maskPlate } from '@/utils/plateValidator'

export interface VehicleCardProps {
  vehicle: Vehicle
  storeName?: string
  onPreview: (vehicle: Vehicle) => void
  onDelete?: (id: string) => void
}

export function VehicleCard({
  vehicle,
  storeName,
  onPreview,
  onDelete,
}: VehicleCardProps) {
  const photo =
    vehicle.photos && vehicle.photos.length > 0
      ? vehicle.photos[0]
      : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=70'

  const announcedPrice = vehicle.price
  const fipePrice = vehicle.fipe_price || 0
  const diff = announcedPrice - fipePrice
  const diffPercent = fipePrice > 0 ? (diff / fipePrice) * 100 : 0
  const isBelowFipe = diff < 0

  return (
    <Card className="overflow-hidden group hover:border-slate-700 transition-all duration-300 flex flex-col h-full bg-slate-900/70 border-slate-800">
      {/* Imagem de Capa com Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={photo}
          alt={vehicle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Placa Mascarada de Proteção */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-2 py-0.5 rounded text-[11px] font-mono text-slate-200 shadow">
          {vehicle.plate_masked || maskPlate(vehicle.plate)}
        </div>

        {/* Badge de Oportunidade FIPE */}
        {fipePrice > 0 && isBelowFipe && (
          <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1">
            <TrendingDown className="w-3 h-3" />
            <span>{Math.abs(diffPercent).toFixed(1)}% abaixo da FIPE</span>
          </div>
        )}

        {/* Tag de Status */}
        <div className="absolute bottom-2.5 left-2.5">
          <Badge
            variant={vehicle.status === 'published' ? 'success' : 'secondary'}
            className="text-[10px] uppercase font-bold py-0.5"
          >
            {vehicle.status === 'published' ? 'Anunciado' : 'Rascunho'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col justify-between flex-1 space-y-3">
        <div>
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
            {vehicle.brand}
          </span>
          <h4 className="text-base font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
            {vehicle.title}
          </h4>

          {/* Atributos */}
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-2">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {vehicle.model_year}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Gauge className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {vehicle.mileage.toLocaleString('pt-BR')} km
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Fuel className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {vehicle.fuel_type || 'Flex'}
            </span>
          </div>
        </div>

        {/* Preço e Comparativo FIPE */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {formatCurrency(announcedPrice)}
            </span>
            {fipePrice > 0 && (
              <span className="text-[11px] text-slate-400 font-mono">
                FIPE: {formatCurrency(fipePrice)}
              </span>
            )}
          </div>

          {storeName && (
            <div className="flex items-center text-[11px] text-slate-400 mt-1.5">
              <Building2 className="w-3 h-3 mr-1 text-slate-500" />
              <span className="truncate">{storeName}</span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPreview(vehicle)}
            className="flex-1 text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-blue-400" />
            Visualizar
          </Button>

          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(vehicle.id)}
              className="text-slate-400 hover:text-red-400 px-2"
              title="Remover veículo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
