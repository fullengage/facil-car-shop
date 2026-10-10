// ==============================================================================
// VISUALIZAÇÃO COMPLETA DO ANÚNCIO COM FOCO EM SEO & COMPARTILHAMENTO
// Breadcrumbs semânticos, h1 otimizado, SEO Local e Rich Snippets Preview
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
  Share2,
  Copy,
  Check,
  Code,
  ArrowLeft,
  Phone,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { SeoHead } from '@/components/seo/SeoHead'
import type { Store, Vehicle } from '@/types'
import { formatCurrency, maskPlate } from '@/utils/plateValidator'
import {
  DEFAULT_SITE_URL,
  generateBreadcrumbSchemaJsonLd,
  generateVehicleMetaDescription,
  generateVehicleMetaTitle,
  generateVehicleSchemaJsonLd,
  generateVehicleSlug,
} from '@/utils/seo'

export interface VehicleDetailViewProps {
  vehicle: Vehicle
  store?: Store
  onBack: () => void
}

export function VehicleDetailView({
  vehicle,
  store,
  onBack,
}: VehicleDetailViewProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)
  const [copiedLink, setCopiedLink] = React.useState(false)
  const [isSchemaModalOpen, setIsSchemaModalOpen] = React.useState(false)

  const photos = vehicle.photos && vehicle.photos.length > 0
    ? vehicle.photos
    : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80']

  const currentPhoto = photos[selectedPhotoIndex] || photos[0]

  const slug = generateVehicleSlug(vehicle, store)
  const canonicalUrl = `${DEFAULT_SITE_URL}/carros/${slug}`
  const metaTitle = generateVehicleMetaTitle(vehicle, store)
  const metaDescription = generateVehicleMetaDescription(vehicle, store)

  const fipePrice = vehicle.fipe_price || 0
  const diff = vehicle.price - fipePrice
  const diffPercent = fipePrice > 0 ? (diff / fipePrice) * 100 : 0
  const isBelow = diff < 0

  const jsonLdData = [
    generateVehicleSchemaJsonLd(vehicle, store, canonicalUrl),
    generateBreadcrumbSchemaJsonLd(vehicle, store),
  ]

  function handleCopyShareLink() {
    navigator.clipboard.writeText(canonicalUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `Confira este ${vehicle.title} por ${formatCurrency(vehicle.price)} no Fácil Car Shop!\n${canonicalUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  return (
    <article className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Injeção Dinâmica de SEO Head e Schema.org no DOM */}
      <SeoHead
        title={metaTitle}
        description={metaDescription}
        canonicalUrl={canonicalUrl}
        ogImage={currentPhoto}
        ogType="product"
        jsonLd={jsonLdData}
        keywords={[
          vehicle.brand,
          vehicle.model,
          `${vehicle.brand} ${vehicle.model}`,
          `comprar ${vehicle.model}`,
          `tabela fipe ${vehicle.model}`,
          store?.address_city || 'carros brasil',
          store?.address_state || 'SP',
        ]}
      />

      {/* Topo / Barra de Navegação e Breadcrumb Semântico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white pl-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar ao Catálogo
          </Button>

          {/* Breadcrumb Visual com tags semânticas */}
          <nav aria-label="Breadcrumb" className="hidden md:flex items-center text-xs text-slate-500 space-x-1.5">
            <span>/</span>
            <span>Carros</span>
            <span>/</span>
            <span className="text-slate-400">{store?.address_state || 'Brasil'}</span>
            <span>/</span>
            <span className="text-slate-400">{vehicle.brand}</span>
            <span>/</span>
            <span className="text-blue-400 font-medium truncate max-w-xs">{vehicle.model}</span>
          </nav>
        </div>

        {/* Botões de Compartilhamento Social e Inspeção SEO */}
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSchemaModalOpen(true)}
            className="text-xs border-slate-800 text-slate-300"
            title="Ver Rich Snippets do Google (Schema.org JSON-LD)"
          >
            <Code className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Schema.org JSON-LD
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyShareLink}
            className="text-xs border-slate-800 text-slate-300"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar URL Amigável'}
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleShareWhatsApp}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Grid Principal do Veículo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Galeria e Detalhes */}
        <div className="lg:col-span-2 space-y-6">
          {/* H1 Semântico Único Otimizado para o Google */}
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
                {vehicle.brand}
              </Badge>
              {store?.address_city && (
                <span className="text-xs text-slate-400 flex items-center font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {store.address_city} - {store.address_state}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              {vehicle.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              URL Indexável: <span className="text-blue-400">{slug}</span>
            </p>
          </div>

          {/* Galeria de Fotos */}
          <div className="space-y-3">
            <figure className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
              <img
                src={currentPhoto}
                alt={`${vehicle.title} - Foto ${selectedPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Placa Mascarada para Proteção de Dados (LGPD) */}
              <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 px-3 py-1 rounded-md text-xs font-mono text-slate-200 flex items-center space-x-1.5 shadow-lg">
                <span className="text-[10px] text-blue-400 font-bold">PLACA:</span>
                <strong className="text-white">{vehicle.plate_masked || maskPlate(vehicle.plate)}</strong>
              </div>

              {/* Selo FIPE na Foto */}
              {fipePrice > 0 && isBelow && (
                <div className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>{Math.abs(diffPercent).toFixed(1)}% ABAIXO DA TABELA FIPE</span>
                </div>
              )}
            </figure>

            {photos.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      idx === selectedPhotoIndex
                        ? 'border-blue-500 scale-105 shadow-md'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ficha Técnica e Atributos */}
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <h3 className="text-base font-bold text-white">Especificações do Veículo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-700/40">
                <span className="text-slate-400 block mb-1">Ano / Modelo</span>
                <strong className="text-sm text-white flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  {vehicle.model_year}{vehicle.manufacturing_year ? `/${vehicle.manufacturing_year}` : ''}
                </strong>
              </div>

              <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-700/40">
                <span className="text-slate-400 block mb-1">Quilometragem</span>
                <strong className="text-sm text-white flex items-center">
                  <Gauge className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  {vehicle.mileage.toLocaleString('pt-BR')} km
                </strong>
              </div>

              <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-700/40">
                <span className="text-slate-400 block mb-1">Combustível</span>
                <strong className="text-sm text-white flex items-center">
                  <Fuel className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  {vehicle.fuel_type || 'Flex'}
                </strong>
              </div>

              <div className="rounded-lg bg-slate-800/40 p-3 border border-slate-700/40">
                <span className="text-slate-400 block mb-1">Câmbio</span>
                <strong className="text-sm text-white">
                  {vehicle.transmission || 'Automático'}
                </strong>
              </div>
            </div>
          </section>

          {/* Descrição Completa */}
          {vehicle.description && (
            <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-2">
              <h3 className="text-base font-bold text-white">Descrição e Observações</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {vehicle.description}
              </p>
            </section>
          )}
        </div>

        {/* Coluna Direita: Preço, FIPE e Vendedor */}
        <aside className="space-y-6">
          {/* Card de Preço e FIPE */}
          <Card className="border-blue-900/50 bg-gradient-to-b from-slate-900/90 to-blue-950/20 p-5 space-y-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Preço à Vista</span>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatCurrency(vehicle.price)}
              </div>
            </div>

            {/* Comparativo FIPE */}
            {fipePrice > 0 && (
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tabela FIPE Oficial:</span>
                  <span className="font-mono text-slate-200 font-bold">{formatCurrency(fipePrice)}</span>
                </div>
                {vehicle.fipe_reference_month && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Mês de Referência:</span>
                    <span>{vehicle.fipe_reference_month}</span>
                  </div>
                )}
                {vehicle.fipe_code && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Código FIPE:</span>
                    <span>{vehicle.fipe_code}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Diferença:</span>
                  <span className={isBelow ? 'text-emerald-400' : 'text-cyan-400'}>
                    {isBelow
                      ? `${Math.abs(diffPercent).toFixed(1)}% abaixo da FIPE`
                      : `+${diffPercent.toFixed(1)}% acima`}
                  </span>
                </div>
              </div>
            )}

            {/* Botão de Contato */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                size="lg"
                onClick={handleShareWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20"
              >
                <Phone className="w-4 h-4 mr-2" />
                Falar com o Vendedor
              </Button>
            </div>
          </Card>

          {/* Dados da Loja Parceira (SEO Local) */}
          {store && (
            <Card className="border-slate-800 bg-slate-900/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-sm text-white block">{store.name}</strong>
                    <span className="text-xs text-slate-400 flex items-center">
                      <MapPin className="w-3 h-3 mr-0.5 text-emerald-400" />
                      {store.address_city} - {store.address_state}
                    </span>
                  </div>
                </div>
                <Badge variant="success" className="text-[10px]">Verificada</Badge>
              </div>

              {store.cnpj && (
                <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
                  CNPJ: {store.cnpj}
                </div>
              )}

              {store.phone && (
                <div className="text-xs text-slate-300 flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  {store.phone}
                </div>
              )}

              {store.email && (
                <div className="text-xs text-slate-300 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-2 text-slate-500" />
                  {store.email}
                </div>
              )}
            </Card>
          )}

          {/* Selo LGPD e Segurança */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 text-xs text-slate-400 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Anúncio Seguro:</strong> Dados verificados na Tabela FIPE. A placa completa
              não é divulgada publicamente para proteção contra clonagem e respeito à LGPD.
            </span>
          </div>
        </aside>
      </div>

      {/* Modal de Inspeção dos Dados Estruturados Schema.org JSON-LD */}
      <Modal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        title="Dados Estruturados Schema.org (Google Rich Snippets)"
        description="Este JSON-LD é injetado automaticamente na página para que os robôs do Google indexem preço, fotos, modelo e estoque."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 overflow-x-auto text-xs font-mono text-emerald-400 max-h-96">
            <pre>{JSON.stringify(jsonLdData, null, 2)}</pre>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(jsonLdData, null, 2))
                alert('JSON-LD copiado para a área de transferência!')
              }}
            >
              Copiar Código JSON-LD
            </Button>
          </div>
        </div>
      </Modal>
    </article>
  )
}
