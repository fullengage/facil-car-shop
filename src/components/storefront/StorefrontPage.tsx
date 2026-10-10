// ==============================================================================
// VITRINE PÚBLICA DA LOJA — venda de veículos (não oficina)
// Seções: navbar, hero com destaque, estoque com filtros, diferenciais, contato.
// Visível em /loja/<slug> ou no domínio próprio. Só mostra veículos publicados.
// ==============================================================================

import * as React from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Car,
  LineChart,
  MapPin,
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingDown,
} from 'lucide-react'
import { listVehicles } from '@/services/vehicleService'
import type { Store, Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'
import { StorefrontVehicleCard } from './StorefrontVehicleCard'
import { VehicleDetailModal } from './VehicleDetailModal'
import { compareWithFipe, FALLBACK_PHOTO, mapsUrl, whatsappUrl } from './storefrontHelpers'

export interface StorefrontPageProps {
  store: Store
}

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'km_asc' | 'year_desc'

const PRICE_LIMITS = [
  { label: 'Qualquer preço', value: 0 },
  { label: 'Até R$ 50 mil', value: 50_000 },
  { label: 'Até R$ 100 mil', value: 100_000 },
  { label: 'Até R$ 150 mil', value: 150_000 },
  { label: 'Até R$ 200 mil', value: 200_000 },
]

export function StorefrontPage({ store }: StorefrontPageProps) {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [openVehicle, setOpenVehicle] = React.useState<Vehicle | null>(null)

  // Filtros
  const [query, setQuery] = React.useState('')
  const [brand, setBrand] = React.useState('')
  const [fuel, setFuel] = React.useState('')
  const [maxPrice, setMaxPrice] = React.useState(0)
  const [belowFipeOnly, setBelowFipeOnly] = React.useState(false)
  const [sort, setSort] = React.useState<SortKey>('relevance')

  React.useEffect(() => {
    listVehicles(store.id)
      .then((list) => setVehicles(list.filter((v) => v.status === 'published')))
      .finally(() => setIsLoading(false))
  }, [store.id])

  const brands = React.useMemo(
    () => [...new Set(vehicles.map((v) => v.brand))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [vehicles]
  )
  const fuels = React.useMemo(
    () => [...new Set(vehicles.map((v) => v.fuel_type).filter(Boolean) as string[])].sort(),
    [vehicles]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = vehicles.filter((v) => {
      if (q && ![v.title, v.brand, v.model, v.plate_masked].some((f) => f?.toLowerCase().includes(q))) return false
      if (brand && v.brand !== brand) return false
      if (fuel && v.fuel_type !== fuel) return false
      if (maxPrice && v.price > maxPrice) return false
      if (belowFipeOnly && !compareWithFipe(v).below) return false
      return true
    })

    const byKey: Record<Exclude<SortKey, 'relevance'>, (a: Vehicle, b: Vehicle) => number> = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      km_asc: (a, b) => a.mileage - b.mileage,
      year_desc: (a, b) => b.model_year - a.model_year,
    }
    return sort === 'relevance' ? list : [...list].sort(byKey[sort])
  }, [vehicles, query, brand, fuel, maxPrice, belowFipeOnly, sort])

  // Destaque: o anúncio com maior economia em relação à FIPE; senão, o primeiro
  const featured = React.useMemo(() => {
    const below = vehicles
      .map((v) => ({ v, c: compareWithFipe(v) }))
      .filter((x) => x.c.below)
      .sort((a, b) => a.c.percent - b.c.percent)
    return (below[0]?.v ?? vehicles[0]) || null
  }, [vehicles])

  const belowCount = vehicles.filter((v) => compareWithFipe(v).below).length
  const city = [store.address_city, store.address_state].filter(Boolean).join(' / ')
  const contactUrl = whatsappUrl(store, `Olá! Vim pela vitrine da ${store.name} e quero ver o estoque.`)
  const directionsUrl = mapsUrl(store)

  function clearFilters() {
    setQuery('')
    setBrand('')
    setFuel('')
    setMaxPrice(0)
    setBelowFipeOnly(false)
    setSort('relevance')
  }

  const hasActiveFilter = Boolean(query || brand || fuel || maxPrice || belowFipeOnly)

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#topo" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-slate-950">
              {store.name.charAt(0).toUpperCase()}
            </span>
            <span className="font-extrabold tracking-tight text-white">{store.name}</span>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#estoque" className="hover:text-white">Estoque</a>
            <a href="#diferenciais" className="hover:text-white">Por que comprar aqui</a>
            <a href="#contato" className="hover:text-white">Contato</a>
          </nav>

          {contactUrl && (
            <a
              href={contactUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Falar no WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </a>
          )}
        </div>
      </header>

      {/* HERO */}
      <section id="topo" className="relative isolate overflow-hidden">
        <img
          src={featured?.photos?.[0] || FALLBACK_PHOTO}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-950/60" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <MapPin className="h-3.5 w-3.5" />
              {city || 'Loja parceira'}
            </p>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Seu próximo carro,
              <span className="block text-amber-400">com preço transparente.</span>
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-300">
              Cada anúncio mostra o preço comparado à Tabela FIPE. Fale direto com a {store.name} pelo WhatsApp e agende a visita.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#estoque"
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300"
              >
                Ver estoque <ArrowRight className="h-4 w-4" />
              </a>
              {contactUrl && (
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 hover:border-slate-500"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" /> Falar com um consultor
                </a>
              )}
            </div>

            <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-slate-800 pt-6">
              <div>
                <dt className="text-[11px] text-slate-500">Disponíveis</dt>
                <dd className="text-2xl font-black text-white">{vehicles.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500">Abaixo da FIPE</dt>
                <dd className="text-2xl font-black text-emerald-400">{belowCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-slate-500">Marcas</dt>
                <dd className="text-2xl font-black text-white">{brands.length}</dd>
              </div>
            </dl>
          </div>

          {/* Destaque */}
          {featured && (
            <button
              type="button"
              onClick={() => setOpenVehicle(featured)}
              className="group relative hidden self-center overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-left shadow-2xl lg:block"
            >
              <img
                src={featured.photos?.[0] || FALLBACK_PHOTO}
                alt={featured.title}
                className="aspect-[16/11] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="space-y-2 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Destaque</p>
                <h2 className="text-lg font-bold text-white">{featured.title}</h2>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-white">{formatCurrency(featured.price)}</span>
                  {compareWithFipe(featured).below && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                      <TrendingDown className="h-3.5 w-3.5" />
                      Abaixo da FIPE
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* ESTOQUE */}
      <section id="estoque" className="mx-auto w-full max-w-7xl scroll-mt-20 space-y-6 px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Estoque</p>
            <h2 className="text-3xl font-black tracking-tight text-white">Veículos disponíveis</h2>
          </div>
          <p className="text-sm text-slate-500">
            {filtered.length} de {vehicles.length} veículos
          </p>
        </div>

        {/* Barra de filtros */}
        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelo, marca ou placa"
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 md:col-span-2">
            <option value="">Todas as marcas</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={fuel} onChange={(e) => setFuel(e.target.value)} className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 md:col-span-2">
            <option value="">Combustível</option>
            {fuels.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 md:col-span-2">
            {PRICE_LIMITS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200 md:col-span-2">
            <option value="relevance">Mais recentes</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="km_asc">Menor km</option>
            <option value="year_desc">Ano mais novo</option>
          </select>

          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-12">
            <button
              type="button"
              onClick={() => setBelowFipeOnly((v) => !v)}
              aria-pressed={belowFipeOnly}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                belowFipeOnly ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Só abaixo da FIPE
            </button>
            {hasActiveFilter && (
              <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Limpar filtros
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-slate-500">Carregando estoque...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-800 py-16 text-center">
            <Car className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">
              {vehicles.length === 0 ? 'Nenhum veículo disponível no momento.' : 'Nenhum veículo com esses filtros.'}
            </p>
            {hasActiveFilter && (
              <button type="button" onClick={clearFilters} className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((vehicle) => (
              <StorefrontVehicleCard key={vehicle.id} store={store} vehicle={vehicle} onOpen={setOpenVehicle} />
            ))}
          </div>
        )}
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="scroll-mt-20 border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            { icon: LineChart, title: 'Preço comparado à FIPE', text: 'Todo anúncio mostra a Tabela FIPE de referência e a diferença em reais e em percentual.' },
            { icon: ShieldCheck, title: 'Placa protegida', text: 'A placa completa nunca aparece na vitrine. Exibimos apenas a versão mascarada.' },
            { icon: BadgeCheck, title: 'Loja aprovada', text: `A ${store.name} foi aprovada pela administração da plataforma antes de publicar o estoque.` },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6">
        <div className="grid gap-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Visite a loja</p>
            <h2 className="text-3xl font-black tracking-tight text-white">Fale com a {store.name}</h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Tire dúvidas, combine test drive e negocie direto com a equipe.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {contactUrl && (
                <a href={contactUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {store.phone && (
                <a href={`tel:${store.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500">
                  <Phone className="h-4 w-4" /> Ligar
                </a>
              )}
            </div>
          </div>

          <ul className="space-y-4 text-sm text-slate-300">
            {(store.address_street || city) && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  {[store.address_street, store.address_number, store.address_complement].filter(Boolean).join(', ')}
                  {store.address_neighborhood ? ` — ${store.address_neighborhood}` : ''}
                  {city ? `, ${city}` : ''}
                  {directionsUrl && (
                    <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-1 block text-xs font-semibold text-amber-400 hover:underline">
                      Abrir no mapa
                    </a>
                  )}
                </span>
              </li>
            )}
            {store.email && (
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" />
                <a href={`mailto:${store.email}`} className="hover:text-white">{store.email}</a>
              </li>
            )}
            {store.phone && (
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{store.phone}</span>
              </li>
            )}
          </ul>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-slate-500 sm:flex-row sm:px-6">
          <span>{store.corporate_name ?? store.name}{store.cnpj ? ` · CNPJ ${store.cnpj}` : ''}</span>
          <span>Vitrine {store.name}</span>
        </div>
      </footer>

      <VehicleDetailModal store={store} vehicle={openVehicle} onClose={() => setOpenVehicle(null)} />
    </div>
  )
}
