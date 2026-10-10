// ==============================================================================
// SELEÇÃO ENCADEADA DA TABELA FIPE (BRASILAPI)
// Endpoints: marcas -> modelos -> anos -> detalhes
// ==============================================================================

import * as React from 'react'
import {
  Car,
  Search,
  AlertTriangle,
} from 'lucide-react'
import {
  getFipeBrands,
  getFipeDetails,
  getFipeModels,
  getFipePriceByCode,
  getFipeYears,
} from '@/services/brasilApi/fipeService'
import type {
  FipeBrand,
  FipeModel,
  FipeVehicleDetail,
  FipeYear,
} from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface FipeCascadeSelectProps {
  onVehicleSelected: (detail: FipeVehicleDetail) => void
  prefillBrand?: string
  prefillModel?: string
  prefillYear?: number
  prefillFipeCode?: string
}

export function FipeCascadeSelect({
  onVehicleSelected,
  prefillBrand,
  prefillModel,
  prefillYear,
  prefillFipeCode,
}: FipeCascadeSelectProps) {
  // Estados de dados
  const [brands, setBrands] = React.useState<FipeBrand[]>([])
  const [models, setModels] = React.useState<FipeModel[]>([])
  const [years, setYears] = React.useState<FipeYear[]>([])

  // Seleções atuais
  const [selectedBrandCode, setSelectedBrandCode] = React.useState<string>('')
  const [selectedModelCode, setSelectedModelCode] = React.useState<string>('')
  const [selectedYearCode, setSelectedYearCode] = React.useState<string>('')

  // Estados de carregamento e erro (RULE #TECH-07)
  const [isLoadingBrands, setIsLoadingBrands] = React.useState(false)
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)
  const [isLoadingYears, setIsLoadingYears] = React.useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Busca alternativa direta por código FIPE
  const [manualFipeCode, setManualFipeCode] = React.useState(prefillFipeCode || '')
  const [isLoadingFipeCode, setIsLoadingFipeCode] = React.useState(false)

  // 1. Carregar Marcas no início
  React.useEffect(() => {
    let isMounted = true
    async function loadBrands() {
      setIsLoadingBrands(true)
      setErrorMessage(null)
      try {
        const data = await getFipeBrands('carros')
        if (isMounted) {
          setBrands(data)
          // Se houver prefill de marca vindo da placa, tenta selecionar automaticamente
          if (prefillBrand) {
            const found = data.find(
              (b) =>
                b.nome.toLowerCase().includes(prefillBrand.toLowerCase()) ||
                prefillBrand.toLowerCase().includes(b.nome.toLowerCase())
            )
            if (found) {
              setSelectedBrandCode(found.valor)
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Falha ao obter marcas na BrasilAPI'
          )
        }
      } finally {
        if (isMounted) setIsLoadingBrands(false)
      }
    }
    loadBrands()
    return () => {
      isMounted = false
    }
  }, [prefillBrand])

  // 2. Carregar Modelos ao alterar marca
  React.useEffect(() => {
    if (!selectedBrandCode) {
      setModels([])
      setSelectedModelCode('')
      setYears([])
      setSelectedYearCode('')
      return
    }

    let isMounted = true
    async function loadModels() {
      setIsLoadingModels(true)
      setErrorMessage(null)
      try {
        const data = await getFipeModels(selectedBrandCode, 'carros')
        if (isMounted) {
          setModels(data)
          setSelectedModelCode('')
          setYears([])
          setSelectedYearCode('')

          // Se houver prefill de modelo vindo da placa
          if (prefillModel) {
            const cleanPrefill = prefillModel.toLowerCase().split(' ')[0]
            const found = data.find((m) =>
              m.nome.toLowerCase().includes(cleanPrefill)
            )
            if (found) {
              setSelectedModelCode(String(found.valor))
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Falha ao buscar modelos na BrasilAPI'
          )
        }
      } finally {
        if (isMounted) setIsLoadingModels(false)
      }
    }
    loadModels()
    return () => {
      isMounted = false
    }
  }, [selectedBrandCode, prefillModel])

  // 3. Carregar Anos ao alterar modelo
  React.useEffect(() => {
    if (!selectedBrandCode || !selectedModelCode) {
      setYears([])
      setSelectedYearCode('')
      return
    }

    let isMounted = true
    async function loadYears() {
      setIsLoadingYears(true)
      setErrorMessage(null)
      try {
        const data = await getFipeYears(selectedBrandCode, selectedModelCode, 'carros')
        if (isMounted) {
          setYears(data)
          setSelectedYearCode('')

          if (prefillYear) {
            const found = data.find((y) => y.nome.includes(String(prefillYear)))
            if (found) {
              setSelectedYearCode(found.valor)
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Falha ao buscar anos na BrasilAPI'
          )
        }
      } finally {
        if (isMounted) setIsLoadingYears(false)
      }
    }
    loadYears()
    return () => {
      isMounted = false
    }
  }, [selectedBrandCode, selectedModelCode, prefillYear])

  // 4. Carregar Detalhes e Preço ao selecionar o Ano
  async function handleYearSelect(yearValue: string) {
    setSelectedYearCode(yearValue)
    if (!selectedBrandCode || !selectedModelCode || !yearValue) return

    setIsLoadingDetails(true)
    setErrorMessage(null)
    try {
      const details = await getFipeDetails(
        selectedBrandCode,
        selectedModelCode,
        yearValue,
        'carros'
      )
      onVehicleSelected(details)
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao buscar detalhes FIPE'
      )
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // 5. Busca direta por código FIPE
  async function handleSearchByFipeCode() {
    if (!manualFipeCode.trim()) return
    setIsLoadingFipeCode(true)
    setErrorMessage(null)
    try {
      const results = await getFipePriceByCode(manualFipeCode)
      if (results && results.length > 0) {
        // Pega a versão mais recente
        onVehicleSelected(results[0])
      } else {
        setErrorMessage('Nenhum veículo encontrado para este código FIPE.')
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Código FIPE não localizado na BrasilAPI'
      )
    } finally {
      setIsLoadingFipeCode(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Car className="h-5 w-5 text-blue-400" />
          <h4 className="font-semibold text-white text-sm sm:text-base">
            Catálogo Oficial FIPE (BrasilAPI)
          </h4>
        </div>
        <span className="text-xs text-slate-400">Seleção encadeada oficial</span>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-red-900/20 border border-red-800/60 p-3 text-xs text-red-300 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid de seleção encadeada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Passo 1: Marca */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span>1. Marca</span>
            {isLoadingBrands && <span className="text-blue-400 animate-pulse text-[11px]">Carregando...</span>}
          </label>
          <select
            value={selectedBrandCode}
            onChange={(e) => setSelectedBrandCode(e.target.value)}
            disabled={isLoadingBrands || brands.length === 0}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Selecione a Marca</option>
            {brands.map((b) => (
              <option key={b.valor} value={b.valor}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 2: Modelo */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span>2. Modelo</span>
            {isLoadingModels && <span className="text-blue-400 animate-pulse text-[11px]">Carregando...</span>}
          </label>
          <select
            value={selectedModelCode}
            onChange={(e) => setSelectedModelCode(e.target.value)}
            disabled={!selectedBrandCode || isLoadingModels || models.length === 0}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {!selectedBrandCode ? 'Aguardando marca...' : 'Selecione o Modelo'}
            </option>
            {models.map((m) => (
              <option key={String(m.valor)} value={String(m.valor)}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Passo 3: Ano / Combustível */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
            <span>3. Ano / Versão</span>
            {isLoadingYears && <span className="text-blue-400 animate-pulse text-[11px]">Carregando...</span>}
          </label>
          <select
            value={selectedYearCode}
            onChange={(e) => handleYearSelect(e.target.value)}
            disabled={!selectedModelCode || isLoadingYears || years.length === 0 || isLoadingDetails}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {!selectedModelCode ? 'Aguardando modelo...' : 'Selecione o Ano'}
            </option>
            {years.map((y) => (
              <option key={y.valor} value={y.valor}>
                {y.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoadingDetails && (
        <div className="flex items-center justify-center p-3 text-sm text-blue-400 bg-blue-950/20 rounded-lg border border-blue-800/40">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
          Consultando detalhes e valor oficial FIPE na BrasilAPI...
        </div>
      )}

      {/* Opção Alternativa: Busca por Código FIPE Direto */}
      <div className="pt-2 border-t border-slate-800/80">
        <details className="text-xs text-slate-400 group">
          <summary className="cursor-pointer hover:text-slate-200 transition-colors flex items-center select-none">
            <Search className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Prefere buscar direto pelo Código FIPE? (ex: 002166-0)
          </summary>
          <div className="flex items-center space-x-2 mt-2 pt-1">
            <Input
              type="text"
              placeholder="Digite o código FIPE (ex: 005340-6)"
              value={manualFipeCode}
              onChange={(e) => setManualFipeCode(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSearchByFipeCode}
              isLoading={isLoadingFipeCode}
              disabled={!manualFipeCode.trim()}
            >
              Consultar FIPE
            </Button>
          </div>
        </details>
      </div>
    </div>
  )
}
