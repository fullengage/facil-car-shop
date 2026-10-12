// ==============================================================================
// PÁTIO DE VEÍCULOS — tabela de estoque do lojista e do admin da loja
// Filtros de situação, busca e ordenação. Valores só com dados reais:
// o que não existe no cadastro (custo de compra, custos extras) mostra traço.
// ==============================================================================

import * as React from 'react'
import { Plus, Search, Car } from 'lucide-react'
import type { Vehicle, VehicleStatus } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'

type Filtro = 'todos' | 'estoque' | 'vendidos' | 'abaixo_fipe' | 'rascunhos' | 'parados'
type Ordem = 'entrada-desc' | 'entrada-asc' | 'preco-desc' | 'preco-asc'

/**
 * Alerta de carro parado: veículo em estoque há mais dias que este limite.
 * ponytail: 60 dias é um padrão de mercado; ajustar quando a loja definir o próprio.
 */
export const DIAS_PARADO = 60

const DIA_MS = 24 * 60 * 60 * 1000

/** Dias desde a entrada (created_at). Não considera reentradas: o cadastro não tem esse dado. */
export function diasEmEstoque(v: Vehicle, agora: number = Date.now()): number {
  return Math.floor((agora - new Date(v.created_at).getTime()) / DIA_MS)
}

const isParado = (v: Vehicle, agora: number) => v.status === 'published' && diasEmEstoque(v, agora) >= DIAS_PARADO

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'estoque', label: 'Em estoque' },
  { value: 'parados', label: 'Parados' },
  { value: 'vendidos', label: 'Vendidos' },
  { value: 'abaixo_fipe', label: 'Abaixo da FIPE' },
  { value: 'rascunhos', label: 'Rascunhos' },
]

const STATUS_LABEL: Record<VehicleStatus, { label: string; cls: string }> = {
  published: { label: 'Estoque', cls: 'bg-primary text-white' },
  draft: { label: 'Rascunho', cls: 'bg-surface text-dark' },
  sold: { label: 'Vendido', cls: 'bg-steel text-white' },
  archived: { label: 'Arquivado', cls: 'bg-border text-text' },
}

const abaixoFipe = (v: Vehicle) => (v.fipe_price ?? 0) > 0 && v.price < (v.fipe_price ?? 0)

function passaFiltro(v: Vehicle, f: Filtro, agora: number): boolean {
  if (f === 'todos') return true
  if (f === 'estoque') return v.status === 'published'
  if (f === 'vendidos') return v.status === 'sold'
  if (f === 'rascunhos') return v.status === 'draft'
  if (f === 'parados') return isParado(v, agora)
  return abaixoFipe(v)
}

export interface EstoquePatioProps {
  vehicles: Vehicle[]
  onOpenAddVehicle: () => void
  onSelectVehicle?: (vehicle: Vehicle) => void
}

export function EstoquePatio({ vehicles, onOpenAddVehicle, onSelectVehicle }: EstoquePatioProps) {
  const [filtro, setFiltro] = React.useState<Filtro>('todos')
  const [busca, setBusca] = React.useState('')
  const [ordem, setOrdem] = React.useState<Ordem>('entrada-desc')

  // Momento da renderização: usado para contar dias parados
  const agora = Date.now()
  const parados = vehicles.filter((v) => isParado(v, agora))

  const lista = React.useMemo(() => {
    const q = busca.trim().toLowerCase()
    const cmp: Record<Ordem, (a: Vehicle, b: Vehicle) => number> = {
      'entrada-desc': (a, b) => b.created_at.localeCompare(a.created_at),
      'entrada-asc': (a, b) => a.created_at.localeCompare(b.created_at),
      'preco-desc': (a, b) => b.price - a.price,
      'preco-asc': (a, b) => a.price - b.price,
    }
    return vehicles
      .filter((v) => passaFiltro(v, filtro, agora))
      .filter((v) => !q || [v.plate_masked, v.title, v.brand, v.model, v.color].some((c) => c?.toLowerCase().includes(q)))
      .sort(cmp[ordem])
  }, [vehicles, filtro, busca, ordem])

  return (
    <section aria-labelledby="patio-titulo" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 id="patio-titulo" className="text-[22px] font-black text-dark">Pátio de veículos</h3>
          <p className="text-[14px] text-text">
            {vehicles.length} {vehicles.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddVehicle}
          className="inline-flex items-center gap-2 rounded-brand bg-primary px-4 py-2.5 text-[14px] font-medium text-white hover:bg-dark"
        >
          <Plus className="h-4 w-4" aria-hidden /> Novo veículo
        </button>
      </div>

      {parados.length > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-brand border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-[14px] text-dark">
            <strong>{parados.length} {parados.length === 1 ? 'veículo parado' : 'veículos parados'}</strong> há mais de {DIAS_PARADO} dias no pátio.
          </p>
          <button type="button" onClick={() => setFiltro('parados')} className="text-[13px] font-bold text-primary hover:text-dark">
            Ver parados
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const total = vehicles.filter((v) => passaFiltro(v, f.value, agora)).length
          const ativo = filtro === f.value
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={ativo}
              type="button"
              onClick={() => setFiltro(f.value)}
              className={`rounded-brand px-4 py-2 text-[14px] font-medium transition-colors ${
                ativo ? 'bg-primary text-white' : 'border border-border bg-white text-dark hover:border-primary'
              }`}
            >
              {f.label} <span className="opacity-70">({total})</span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="relative w-full md:max-w-md">
          <span className="sr-only">Buscar no pátio</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text" aria-hidden />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar placa, marca, modelo ou cor"
            className="h-11 w-full rounded-brand border border-border bg-white pl-9 pr-3 text-[15px] text-dark outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-3 text-[14px] text-dark">
          <span>Ordenar</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="h-11 rounded-brand border border-border bg-white px-3 outline-none focus:border-primary"
          >
            <option value="entrada-desc">Entrada: mais recente</option>
            <option value="entrada-asc">Entrada: mais antiga</option>
            <option value="preco-desc">Venda: maior</option>
            <option value="preco-asc">Venda: menor</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-brand border border-border bg-white">
        <table className="w-full min-w-[860px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] font-bold uppercase tracking-wide text-text">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Veículo</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3 text-right">Venda</th>
              <th className="px-4 py-3 text-right">Ref. FIPE</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((v) => {
              const st = STATUS_LABEL[v.status]
              const fipe = v.fipe_price ?? 0
              const dif = fipe > 0 ? v.price - fipe : null
              return (
                <tr key={v.id} className="hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono font-bold text-dark">{v.plate_masked || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-brand bg-surface">
                        {v.photos?.[0]
                          ? <img src={v.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                          : <Car className="h-5 w-5 text-text" aria-hidden />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-dark">{v.title}</p>
                        <p className="text-[13px] text-text">
                          {v.model_year}{v.color ? ` · ${v.color}` : ''}{v.mileage ? ` · ${v.mileage.toLocaleString('pt-BR')} km` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text">{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-right font-bold text-dark">{formatCurrency(v.price)}</td>
                  <td className="px-4 py-3 text-right">
                    {dif === null ? (
                      <span className="text-text">—</span>
                    ) : (
                      <span className={dif < 0 ? 'font-bold text-steel' : 'font-bold text-primary'}>
                        {dif < 0 ? '−' : '+'}{formatCurrency(Math.abs(dif))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex rounded-brand px-2.5 py-1 text-[12px] font-bold ${st.cls}`}>{st.label}</span>
                      {isParado(v, agora) && (
                        <span className="inline-flex rounded-brand bg-primary/10 px-2.5 py-1 text-[12px] font-bold text-primary">
                          Parado · {diasEmEstoque(v, agora)} dias
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {onSelectVehicle && (
                      <button type="button" onClick={() => onSelectVehicle(v)} className="text-[13px] font-bold text-primary hover:text-dark">
                        Ver
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-text">
                  {vehicles.length === 0 ? 'Nenhum veículo no pátio ainda. Cadastre o primeiro.' : 'Nenhum veículo com esses filtros.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
