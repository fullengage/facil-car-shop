// ==============================================================================
// COMPONENTE VISUAL — PLACA VEICULAR BRASILEIRA (MERCOSUL & PADRÃO ANTIGO)
// ==============================================================================

import * as React from 'react'
import { Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  cleanPlate,
  formatPlate,
  isMercosulPlate,
  isValidBrazilianPlate,
} from '@/utils/plateValidator'

export interface PlateInputProps {
  value: string
  onChange: (plate: string) => void
  onLookup: (plate: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function PlateInput({
  value,
  onChange,
  onLookup,
  isLoading,
  disabled,
}: PlateInputProps) {
  const cleaned = cleanPlate(value)
  const isValid = isValidBrazilianPlate(cleaned)
  const isMercosul = isMercosulPlate(cleaned)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase()
    const sanitized = cleanPlate(raw)
    if (sanitized.length <= 7) {
      onChange(sanitized)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && isValid && !isLoading) {
      e.preventDefault()
      onLookup(cleaned)
    }
  }

  function handleQuickSelect(samplePlate: string) {
    onChange(samplePlate)
    onLookup(samplePlate)
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Placa com Design Realista Mercosul / Antigo */}
      <div className="relative w-full max-w-sm rounded-xl border-4 border-slate-900 bg-white shadow-2xl p-1 transition-all overflow-hidden group hover:border-blue-700">
        {/* Faixa Superior Mercosul */}
        <div className="bg-[#003399] text-white px-3 py-1 flex items-center justify-between rounded-t-md text-xs font-bold tracking-widest select-none">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-yellow-300">★ ★ ★ ★</span>
            <span className="text-[11px] tracking-normal font-black">MERCOSUL</span>
          </div>
          <span className="text-[13px] tracking-widest font-black">BRASIL</span>
          <div className="w-4 h-3 bg-[#009b3a] rounded-sm flex items-center justify-center relative overflow-hidden">
            <div className="w-2.5 h-2 bg-[#fedf00] rotate-45 transform flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#002776]" />
            </div>
          </div>
        </div>

        {/* Campo Central da Placa */}
        <div className="bg-slate-50 py-3 px-4 flex items-center justify-center relative">
          <input
            type="text"
            value={formatPlate(cleaned)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="ABC1D23"
            maxLength={8}
            disabled={disabled || isLoading}
            className="w-full text-center text-4xl sm:text-5xl font-mono font-extrabold tracking-wider text-slate-950 bg-transparent border-none outline-none focus:ring-0 uppercase placeholder:text-slate-300"
          />
        </div>

        {/* Rodapé Interno com Selo */}
        <div className="bg-slate-100 border-t border-slate-200 px-3 py-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>BR • DETRAN</span>
          <span className="font-semibold text-slate-600">
            {cleaned.length === 7 ? (isMercosul ? 'PADRÃO MERCOSUL' : 'PADRÃO ANTIGO') : 'DIGITE A PLACA'}
          </span>
        </div>
      </div>

      {/* Status da Validação */}
      <div className="flex items-center justify-between w-full max-w-sm px-1 text-xs">
        <div className="flex items-center space-x-1.5">
          {isValid ? (
            <span className="flex items-center text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {isMercosul ? 'Formato Mercosul válido' : 'Formato tradicional válido'}
            </span>
          ) : cleaned.length > 0 ? (
            <span className="flex items-center text-amber-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              Formato incompleto ({cleaned.length}/7 caracteres)
            </span>
          ) : (
            <span className="text-slate-400">Exemplos: BRA2E19 ou ABC1234</span>
          )}
        </div>
        <span className="text-slate-500 font-mono">{cleaned.length} / 7</span>
      </div>

      {/* Botão Principal de Consulta */}
      <div className="w-full max-w-sm">
        <Button
          type="button"
          onClick={() => onLookup(cleaned)}
          disabled={!isValid || isLoading || disabled}
          isLoading={isLoading}
          variant="default"
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>Consultar Placa</span>
        </Button>
      </div>

      {/* Placas de Teste Rápido (Demonstração Prática) */}
      <div className="w-full max-w-sm pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="flex items-center text-slate-400">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-yellow-400" />
            Placas de teste disponíveis:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { p: 'BRA2E19', label: 'Corolla 2023' },
            { p: 'FCL2026', label: 'Compass 2024' },
            { p: 'RIO2A18', label: 'Strada 2024' },
            { p: 'ABC1234', label: 'Gol 2021' },
          ].map((item) => (
            <button
              key={item.p}
              type="button"
              onClick={() => handleQuickSelect(item.p)}
              disabled={isLoading}
              className="text-xs font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700/60 transition-colors"
            >
              <strong className="text-white">{item.p}</strong> ({item.label})
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
