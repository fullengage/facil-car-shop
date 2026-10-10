// ==============================================================================
// CARD DE COMPARAÇÃO FIPE & PREÇO ANUNCIADO
// Exibe dados oficiais da FIPE e compara com o preço de venda do lojista
// ==============================================================================

import {
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Fuel,
  Hash,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/plateValidator'

export interface FipeComparisonCardProps {
  brand: string
  model: string
  modelYear?: number
  fuelType?: string
  fipeCode?: string
  fipePrice: number
  fipeReferenceMonth?: string
  announcedPrice: number
}

export function FipeComparisonCard({
  brand,
  model,
  modelYear,
  fuelType,
  fipeCode,
  fipePrice,
  fipeReferenceMonth,
  announcedPrice,
}: FipeComparisonCardProps) {
  // Cálculo da variação
  const diffValue = announcedPrice - fipePrice
  const diffPercent = fipePrice > 0 ? (diffValue / fipePrice) * 100 : 0
  const isBelow = diffValue < 0
  const isExact = Math.abs(diffValue) < 1

  return (
    <Card className="border-blue-900/40 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-blue-950/30 overflow-hidden shadow-xl">
      <div className="bg-blue-600/10 border-b border-blue-500/20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            Referência Oficial Tabela FIPE (BrasilAPI)
          </span>
        </div>
        {fipeReferenceMonth && (
          <span className="text-[11px] text-slate-400 font-mono">
            Mês: {fipeReferenceMonth}
          </span>
        )}
      </div>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Veículo Selecionado */}
        <div>
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            {brand}
          </div>
          <h4 className="text-base sm:text-lg font-bold text-white line-clamp-2">
            {model}
          </h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {modelYear && (
              <Badge variant="secondary" className="text-[11px]">
                <Calendar className="w-3 h-3 mr-1" />
                Ano {modelYear}
              </Badge>
            )}
            {fuelType && (
              <Badge variant="secondary" className="text-[11px]">
                <Fuel className="w-3 h-3 mr-1" />
                {fuelType}
              </Badge>
            )}
            {fipeCode && (
              <Badge variant="secondary" className="text-[11px] font-mono">
                <Hash className="w-3 h-3 mr-1" />
                FIPE: {fipeCode}
              </Badge>
            )}
          </div>
        </div>

        {/* Comparativo de Preços */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          {/* Valor FIPE Oficial */}
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
            <span className="text-xs text-slate-400 block font-medium">
              Valor de Referência FIPE
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-300">
              {formatCurrency(fipePrice)}
            </span>
          </div>

          {/* Preço de Venda Definido */}
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
            <span className="text-xs text-slate-400 block font-medium">
              Preço Anunciado (Venda)
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {announcedPrice > 0 ? formatCurrency(announcedPrice) : 'A definir'}
            </span>
          </div>
        </div>

        {/* Indicador de Ágio / Deságio */}
        {fipePrice > 0 && announcedPrice > 0 && (
          <div className="rounded-xl border p-3 flex items-center justify-between transition-all bg-slate-900/90 border-slate-800">
            <div className="flex items-center space-x-2.5">
              {isBelow ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
              ) : isExact ? (
                <div className="w-8 h-8 rounded-lg bg-slate-700/40 text-slate-300 flex items-center justify-center shrink-0">
                  <Minus className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              )}

              <div>
                <span className="text-xs font-semibold block text-slate-200">
                  {isBelow
                    ? 'Veículo anunciado abaixo da FIPE'
                    : isExact
                    ? 'Preço alinhado com a FIPE'
                    : 'Veículo com margem acima da FIPE'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isBelow
                    ? `Economia de ${formatCurrency(Math.abs(diffValue))} para o cliente`
                    : isExact
                    ? 'Preço tabelado oficial'
                    : `Diferença de +${formatCurrency(diffValue)} sobre a tabela`}
                </span>
              </div>
            </div>

            <Badge
              variant={isBelow ? 'success' : isExact ? 'secondary' : 'info'}
              className="text-xs font-bold px-2.5 py-1"
            >
              {isBelow
                ? `${Math.abs(diffPercent).toFixed(1)}% abaixo`
                : isExact
                ? '0.0%'
                : `+${diffPercent.toFixed(1)}%`}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
