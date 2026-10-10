// ==============================================================================
// DASHBOARD DO COMPRADOR — FÁCIL CAR SHOP
// Área do Cliente, Veículos Favoritos, Alertas FIPE e Propostas
// ==============================================================================

import * as React from 'react'
import { Heart, CarFront } from 'lucide-react'
import type { Vehicle } from '@/types'
import { formatCurrency } from '@/utils/plateValidator'


interface BuyerDashboardProps {
  vehicles: Vehicle[]
  onSelectVehicle?: (vehicle: Vehicle) => void
}

export function BuyerDashboard({ vehicles, onSelectVehicle }: BuyerDashboardProps) {
  const [activeTab, setActiveTab] = React.useState<'favorites' | 'alerts' | 'proposals'>('favorites')

  // Simulação de favoritos do comprador (os 2 primeiros veículos disponíveis)
  const favoriteVehicles = vehicles.slice(0, 2)

  return (
    <div className="space-y-6">
      {/* Header do Comprador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary bg-steel/10 px-3 py-1 text-xs font-semibold text-steel mb-2">
            <Heart className="w-3.5 h-3.5 text-steel" />
            <span>Perfil: COMPRADOR • Área do Cliente</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-dark">
            Meus Carros & Negociações
          </h2>
          <p className="text-sm text-text">
            Acompanhe seus anúncios favoritados, alertas de preço abaixo da Tabela FIPE e propostas enviadas às concessionárias.
          </p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex space-x-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'favorites'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          Carros Favoritos ({favoriteVehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'alerts'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          Alertas de Preço & Buscas (2)
        </button>
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            activeTab === 'proposals'
              ? 'bg-primary text-white'
              : 'text-text hover:text-dark hover:bg-surface'
          }`}
        >
          Minhas Propostas Enviadas (1)
        </button>
      </div>

      {activeTab === 'favorites' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteVehicles.map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectVehicle?.(v)}
              className="bg-white border border-border hover:border-border rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl group"
            >
              {v.photos?.[0] ? (
                <div className="h-44 w-full overflow-hidden relative">
                  <img
                    src={v.photos[0]}
                    alt={v.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 right-2.5 bg-red-600/90 text-white p-1.5 rounded-full shadow">
                    <Heart className="w-4 h-4 fill-white" />
                  </span>
                </div>
              ) : (
                <div className="h-44 w-full bg-surface flex items-center justify-center">
                  <CarFront className="w-12 h-12 text-text" />
                </div>
              )}

              <div className="p-4 space-y-2">
                <h4 className="font-bold text-dark text-base truncate group-hover:text-primary transition-colors">
                  {v.title}
                </h4>
                <p className="text-xs text-text">
                  {v.model_year} • {v.mileage} km • {v.transmission || 'Automático'}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-lg font-black text-steel">
                    {formatCurrency(v.price)}
                  </span>
                  {v.fipe_price && v.price < v.fipe_price && (
                    <span className="text-[11px] font-bold text-steel bg-steel/10 px-2 py-0.5 rounded-full">
                      Abaixo da FIPE
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <h3 className="font-bold text-dark text-base">Alertas Automáticos de Oportunidades</h3>
          <div className="space-y-3">
            <div className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-dark text-sm">Toyota Corolla 2021 a 2024</p>
                <p className="text-xs text-text">Notificar por e-mail quando entrar veículo até R$ 115.000</p>
              </div>
              <span className="text-xs font-bold text-steel bg-steel/10 px-2 py-1 rounded-full">
                Alerta Ativo
              </span>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-dark text-sm">Jeep Compass Diesel 4x4</p>
                <p className="text-xs text-text">Qualquer ano a partir de 2022 em São Paulo / Interior</p>
              </div>
              <span className="text-xs font-bold text-steel bg-steel/10 px-2 py-1 rounded-full">
                Alerta Ativo
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'proposals' && (
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <h3 className="font-bold text-dark text-base">Propostas que Você Enviou</h3>
          <div className="bg-surface border border-border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="font-bold text-dark text-sm">Toyota Corolla 2.0 XEi 2022</p>
              <p className="text-xs text-text">Loja Auto Premium • Proposta de R$ 109.000 à vista</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Em Análise pelo Gerente
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
