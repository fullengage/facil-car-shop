// ==============================================================================
// CADASTRO INTELIGENTE E AUTOMÁTICO DE VEÍCULOS POR PLACA
// "Digite a placa, complete as fotos e anuncie seu carro."
// ==============================================================================

import * as React from 'react'
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Car,
  Eye,
} from 'lucide-react'
import { PlateInput } from '@/components/plate/PlateInput'
import { FipeCascadeSelect } from '@/components/fipe/FipeCascadeSelect'
import { FipeComparisonCard } from '@/components/fipe/FipeComparisonCard'
import { VehiclePhotoUploader } from '@/components/vehicle/VehiclePhotoUploader'
import { VehiclePreviewModal } from '@/components/vehicle/VehiclePreviewModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { plateProviderManager } from '@/services/plate/PlateProviderManager'
import { getFipePriceByCode } from '@/services/brasilApi/fipeService'
import {
  checkDuplicateActiveVehicle,
  createVehicle,
} from '@/services/vehicleService'
import type {
  FipeVehicleDetail,
  PlateLookupResult,
  Store,
  Vehicle,
} from '@/types'
import { cleanPlate, maskPlate, parseFipePrice } from '@/utils/plateValidator'

export interface VehicleWizardModalProps {
  isOpen: boolean
  onClose: () => void
  activeStore: Store
  onVehicleCreated: (vehicle: Vehicle) => void
}

type WizardStep = 'plate' | 'details_fipe' | 'photos_pricing'

export function VehicleWizardModal({
  isOpen,
  onClose,
  activeStore,
  onVehicleCreated,
}: VehicleWizardModalProps) {
  // Controle de Etapas
  const [step, setStep] = React.useState<WizardStep>('plate')

  // Estado da Placa
  const [plate, setPlate] = React.useState('')
  const [isLookingUpPlate, setIsLookingUpPlate] = React.useState(false)
  const [plateResult, setPlateResult] = React.useState<PlateLookupResult | null>(null)
  const [plateError, setPlateError] = React.useState<string | null>(null)

  // Dados do Formulário do Veículo
  const [brand, setBrand] = React.useState('')
  const [model, setModel] = React.useState('')
  const [version, setVersion] = React.useState('')
  const [modelYear, setModelYear] = React.useState<number>(new Date().getFullYear())
  const [manufacturingYear, setManufacturingYear] = React.useState<number>(new Date().getFullYear())
  const [fuelType, setFuelType] = React.useState('Flex')
  const [color, setColor] = React.useState('Prata')
  const [mileage, setMileage] = React.useState<number>(0)
  const [transmission, setTransmission] = React.useState('Automático')
  const [price, setPrice] = React.useState<number>(0)
  const [description, setDescription] = React.useState('')
  const [photos, setPhotos] = React.useState<string[]>([])

  // Dados FIPE
  const [fipeCode, setFipeCode] = React.useState<string>('')
  const [fipePrice, setFipePrice] = React.useState<number>(0)
  const [fipeReferenceMonth, setFipeReferenceMonth] = React.useState<string>('')
  const [isLookingUpFipe, setIsLookingUpFipe] = React.useState(false)

  // Validação de Duplicidade e Feedback
  const [duplicationWarning, setDuplicationWarning] = React.useState<string | null>(null)
  const [generalError, setGeneralError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Modal de Prévia
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

  // Reset ao abrir
  React.useEffect(() => {
    if (isOpen) {
      setStep('plate')
      setPlate('')
      setPlateResult(null)
      setPlateError(null)
      setBrand('')
      setModel('')
      setVersion('')
      setPrice(0)
      setPhotos([])
      setDuplicationWarning(null)
      setGeneralError(null)
    }
  }, [isOpen])

  // ============================================================================
  // ETAPA 1: CONSULTAR PLACA
  // ============================================================================
  async function handlePlateLookup(plateToQuery: string) {
    setIsLookingUpPlate(true)
    setPlateError(null)
    setDuplicationWarning(null)

    try {
      // 1. Checa duplicidade antes de prosseguir
      const isDuplicate = await checkDuplicateActiveVehicle(activeStore.id, plateToQuery)
      if (isDuplicate) {
        setDuplicationWarning(
          `Atenção: Já existe um anúncio ativo para a placa ${maskPlate(plateToQuery)} nesta loja.`
        )
      }

      // 2. Consulta no provedor veicular
      const result = await plateProviderManager.lookupPlate(plateToQuery)
      setPlateResult(result)

      if (result.success) {
        // Preenche automaticamente dados técnicos retornados
        if (result.brand) setBrand(result.brand)
        if (result.model) setModel(result.model)
        if (result.version) setVersion(result.version)
        if (result.modelYear) setModelYear(result.modelYear)
        if (result.manufactureYear) setManufacturingYear(result.manufactureYear)
        if (result.fuel) setFuelType(result.fuel)
        if (result.color) setColor(result.color)
        if (result.fipeCode) setFipeCode(result.fipeCode)
        if (result.fipePriceEstimated) {
          setFipePrice(result.fipePriceEstimated)
          // Sugestão de preço inicial caso não definido
          setPrice(result.fipePriceEstimated)
        }

        // Se veio o código FIPE da consulta de placa, busca o preço oficial em tempo real na BrasilAPI
        if (result.fipeCode) {
          fetchOfficialFipePrice(result.fipeCode)
        }

        // Avança automaticamente para os detalhes técnicos
        setStep('details_fipe')
      } else {
        setPlateError(
          result.errorMessage ||
            'Não foi possível obter dados automáticos para esta placa. Você pode preencher manualmente.'
        )
      }
    } catch (err: unknown) {
      setPlateError(
        err instanceof Error ? err.message : 'Falha na comunicação com o serviço de placas.'
      )
    } finally {
      setIsLookingUpPlate(false)
    }
  }

  // Busca preço oficial na BrasilAPI FIPE
  async function fetchOfficialFipePrice(code: string) {
    setIsLookingUpFipe(true)
    try {
      const fipeData = await getFipePriceByCode(code)
      if (fipeData && fipeData.length > 0) {
        const top = fipeData[0]
        const parsed = parseFipePrice(top.valor)
        setFipePrice(parsed)
        setFipeReferenceMonth(top.mesReferencia)
        if (price === 0) {
          setPrice(parsed)
        }
      }
    } catch {
      // Caso a BrasilAPI falhe, mantém os dados pré-carregados pelo provedor de placa
    } finally {
      setIsLookingUpFipe(false)
    }
  }

  // Preenchimento manual quando o serviço de placa não encontrar
  function handleProceedManual() {
    setPlateResult({
      success: false,
      plate: cleanPlate(plate),
      maskedPlate: maskPlate(plate),
      provider: 'manual',
      isMercosul: false,
    })
    setStep('details_fipe')
  }

  // Seleção FIPE via cascata
  function handleFipeSelected(detail: FipeVehicleDetail) {
    setBrand(detail.marca)
    setModel(detail.modelo)
    setModelYear(detail.anoModelo)
    setFuelType(detail.combustivel)
    setFipeCode(detail.codigoFipe)
    setFipeReferenceMonth(detail.mesReferencia)

    const parsed = parseFipePrice(detail.valor)
    setFipePrice(parsed)
    if (price === 0) {
      setPrice(parsed)
    }
  }

  // ============================================================================
  // ETAPA 3: CONFIRMAR E SALVAR NO SUPABASE (FCS_VEHICLES)
  // ============================================================================
  async function handleSaveVehicle() {
    if (!brand || !model || !price) {
      setGeneralError('Por favor preencha a marca, modelo e preço do veículo.')
      return
    }

    setIsSubmitting(true)
    setGeneralError(null)

    try {
      const title = `${brand} ${model} ${modelYear}`
      const created = await createVehicle({
        store_id: activeStore.id,
        title,
        brand,
        model,
        version: version || model,
        model_year: modelYear,
        manufacturing_year: manufacturingYear || modelYear,
        fuel_type: fuelType,
        color,
        mileage,
        transmission,
        price,
        description: description || `Veículo anunciado por ${activeStore.name}. Revisado e com procedência garantida.`,
        photos: photos.length > 0 ? photos : [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
        ],
        status: 'published',
        plate: cleanPlate(plate),
        fipe_code: fipeCode,
        fipe_price: fipePrice,
        fipe_reference_month: fipeReferenceMonth || 'outubro de 2026',
        plate_lookup_status: plateResult?.success ? 'success' : 'manual',
        plate_lookup_provider: plateResult?.provider || 'manual',
        plate_last_checked_at: new Date().toISOString(),
        fipe_last_checked_at: new Date().toISOString(),
      })

      onVehicleCreated(created)
      setIsPreviewOpen(false)
      onClose()
    } catch (err: unknown) {
      setGeneralError(
        err instanceof Error ? err.message : 'Falha ao salvar o veículo no banco de dados.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Cadastro Inteligente de Veículo"
        description="Digite a placa, confirme os dados FIPE e anuncie seu carro em menos de 2 minutos."
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {/* Stepper Superior */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-4">
            <button
              type="button"
              onClick={() => setStep('plate')}
              className={`flex items-center space-x-2 text-xs font-semibold p-2 rounded-lg transition-all ${
                step === 'plate'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                1
              </div>
              <span className="truncate">1. Consulta de Placa</span>
            </button>

            <button
              type="button"
              onClick={() => plate && setStep('details_fipe')}
              disabled={!plate}
              className={`flex items-center space-x-2 text-xs font-semibold p-2 rounded-lg transition-all ${
                step === 'details_fipe'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                2
              </div>
              <span className="truncate">2. Dados & FIPE</span>
            </button>

            <button
              type="button"
              onClick={() => brand && model && setStep('photos_pricing')}
              disabled={!brand || !model}
              className={`flex items-center space-x-2 text-xs font-semibold p-2 rounded-lg transition-all ${
                step === 'photos_pricing'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                3
              </div>
              <span className="truncate">3. Fotos & Preço</span>
            </button>
          </div>

          {/* Avisos e Erros */}
          {duplicationWarning && (
            <div className="rounded-lg bg-amber-900/20 border border-amber-800 p-3 text-xs text-amber-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{duplicationWarning}</span>
            </div>
          )}

          {generalError && (
            <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-xs text-red-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASSO 1: DIGITAÇÃO E CONSULTA DA PLACA                           */}
          {/* ================================================================ */}
          {step === 'plate' && (
            <div className="py-4 space-y-6 flex flex-col items-center">
              <div className="text-center max-w-md space-y-1">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Passo 1 de 3
                </span>
                <h3 className="text-2xl font-black text-white">
                  Qual é a placa do veículo?
                </h3>
                <p className="text-xs text-slate-400">
                  Nosso sistema busca automaticamente marca, modelo, ano, cor e referência FIPE.
                </p>
              </div>

              {/* Campo Estilizado de Placa */}
              <PlateInput
                value={plate}
                onChange={setPlate}
                onLookup={handlePlateLookup}
                isLoading={isLookingUpPlate}
              />

              {plateError && (
                <div className="w-full max-w-md rounded-xl border border-amber-800/80 bg-amber-950/20 p-4 text-xs text-amber-200 space-y-3">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-white">Consulta automática indisponível</strong>
                      <p className="text-amber-300/90 mt-0.5">{plateError}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleProceedManual}
                    className="w-full border-amber-700/60 text-amber-200 hover:bg-amber-900/40"
                  >
                    Prosseguir com Cadastro Manual
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* PASSO 2: REVISÃO DE DADOS E CATÁLOGO FIPE (BRASILAPI)            */}
          {/* ================================================================ */}
          {step === 'details_fipe' && (
            <div className="space-y-6">
              {/* Header do Passo */}
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      PLACA: {cleanPlate(plate)}
                    </span>
                    <strong className="text-sm text-white">
                      {brand ? `${brand} ${model}` : 'Identificação do Veículo'}
                    </strong>
                  </div>
                </div>
                {plateResult?.success && (
                  <div className="flex items-center text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Dados obtidos via {plateResult.provider}
                  </div>
                )}
              </div>

              {isLookingUpFipe && (
                <div className="flex items-center p-2.5 text-xs text-blue-300 bg-blue-950/30 rounded-lg border border-blue-800/40 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Sincronizando tabela FIPE oficial em tempo real na BrasilAPI...
                </div>
              )}

              {/* Formulário de Dados Principais (Editáveis) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Marca *</label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Toyota"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Modelo *</label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: Corolla Altis 2.0"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Versão</label>
                  <Input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="Ex: Altis Flex Aut."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Ano Modelo *</label>
                  <Input
                    type="number"
                    value={modelYear || ''}
                    onChange={(e) => setModelYear(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Combustível</label>
                  <Input
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    placeholder="Ex: Flex, Gasolina, Híbrido"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 mb-1 block">Cor</label>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Prata, Preto, Branco"
                  />
                </div>
              </div>

              {/* Seleção e Consulta FIPE da BrasilAPI */}
              <FipeCascadeSelect
                onVehicleSelected={handleFipeSelected}
                prefillBrand={brand}
                prefillModel={model}
                prefillYear={modelYear}
                prefillFipeCode={fipeCode}
              />

              {/* Botões de Navegação */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('plate')}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Voltar para Placa
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  disabled={!brand || !model}
                  onClick={() => setStep('photos_pricing')}
                  className="bg-blue-600 hover:bg-blue-500 font-bold"
                >
                  Avançar para Preço e Fotos
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PASSO 3: FOTOS, PRECIFICAÇÃO E PREVIEW                            */}
          {/* ================================================================ */}
          {step === 'photos_pricing' && (
            <div className="space-y-6">
              {/* Card Comparativo FIPE */}
              <FipeComparisonCard
                brand={brand}
                model={model}
                modelYear={modelYear}
                fuelType={fuelType}
                fipeCode={fipeCode}
                fipePrice={fipePrice}
                fipeReferenceMonth={fipeReferenceMonth}
                announcedPrice={price}
              />

              {/* Campos de Precificação e Detalhes de Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200 mb-1 block">
                    Preço de Venda Anunciado (R$) *
                  </label>
                  <Input
                    type="number"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="Ex: 145000"
                    className="font-bold text-base text-emerald-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    O vendedor define livremente o valor.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 mb-1 block">
                    Quilometragem (KM) *
                  </label>
                  <Input
                    type="number"
                    value={mileage || ''}
                    onChange={(e) => setMileage(Number(e.target.value))}
                    placeholder="Ex: 25000"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200 mb-1 block">
                    Câmbio
                  </label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Automático">Automático</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                    <option value="Automatizado">Automatizado</option>
                  </select>
                </div>
              </div>

              {/* Descrição Comercial */}
              <div>
                <label className="text-xs font-semibold text-slate-200 mb-1 block">
                  Descrição do Veículo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Informe destaques, opcionais, revisões e laudo cautelar..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Upload e Gerenciamento de Fotos */}
              <VehiclePhotoUploader photos={photos} onChange={setPhotos} />

              {/* Botões de Ação Final */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('details_fipe')}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Voltar para Dados
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="default"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Eye className="w-4 h-4 mr-1.5 text-blue-400" />
                    Pré-visualizar Anúncio
                  </Button>

                  <Button
                    type="button"
                    variant="accent"
                    size="default"
                    onClick={handleSaveVehicle}
                    isLoading={isSubmitting}
                    disabled={!price || !brand || !model}
                    className="font-bold bg-emerald-600 hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Publicar Agora
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Prévia Completa do Anúncio */}
      <VehiclePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        vehicle={{
          title: `${brand} ${model} ${modelYear}`,
          brand,
          model,
          version,
          model_year: modelYear,
          manufacturing_year: manufacturingYear,
          fuel_type: fuelType,
          color,
          mileage,
          transmission,
          price,
          description,
          photos,
          plate: cleanPlate(plate),
          plate_masked: maskPlate(plate),
          fipe_code: fipeCode,
          fipe_price: fipePrice,
          fipe_reference_month: fipeReferenceMonth,
        }}
        store={activeStore}
        onConfirmPublish={handleSaveVehicle}
        isPublishing={isSubmitting}
      />
    </>
  )
}
