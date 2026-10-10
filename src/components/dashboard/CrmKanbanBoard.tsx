// ==============================================================================
// CRM KANBAN BOARD — FÁCIL CAR SHOP
// 8 Etapas Oficiais, Drag & Drop Nativo, WhatsApp 1-Click e Gestão de Oportunidades
// ==============================================================================

import * as React from 'react'
import {
  MessageCircle,
  Car,
  ChevronRight,
  User,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FCSPipelineStage } from '@/types'
import {
  listPipelineStages,
  listLeads,
  updateLeadStage,
  recordContactEvent,
  type EnrichedLead,
} from '@/services/crmService'
import { formatCurrency } from '@/utils/plateValidator'

interface CrmKanbanBoardProps {
  sellerId?: string
  storeId?: string
  onLeadSelect?: (lead: EnrichedLead) => void
}

export function CrmKanbanBoard({ sellerId, storeId, onLeadSelect }: CrmKanbanBoardProps) {

  const [stages, setStages] = React.useState<FCSPipelineStage[]>([])
  const [leads, setLeads] = React.useState<EnrichedLead[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchFilter, setSearchFilter] = React.useState('')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all')
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null)
  const [activeLeadModal, setActiveLeadModal] = React.useState<EnrichedLead | null>(null)

  // Carregamento de etapas e leads
  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [stagesData, leadsData] = await Promise.all([
        listPipelineStages(),
        listLeads({ sellerId, storeId }),
      ])
      setStages(stagesData)
      setLeads(leadsData)
    } catch (error) {
      console.error('Erro ao carregar dados do Kanban:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sellerId, storeId])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Filtragem dos leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.customer?.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        lead.vehicle?.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        lead.source.toLowerCase().includes(searchFilter.toLowerCase())

      if (!matchesSearch) return false

      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
        return false
      }

      return true
    })
  }, [leads, searchFilter, priorityFilter])

  // Manipulação de Drag & Drop
  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (stageKey: string) => {
    if (!draggedLeadId) return
    const leadToMove = leads.find((l) => l.id === draggedLeadId)
    if (!leadToMove || leadToMove.stage_id === stageKey) {
      setDraggedLeadId(null)
      return
    }

    // Atualização otimista na UI
    setLeads((prev) =>
      prev.map((l) => (l.id === draggedLeadId ? { ...l, stage_id: stageKey } : l))
    )
    setDraggedLeadId(null)

    // Persistência no Supabase
    await updateLeadStage(leadToMove.id, stageKey)
  }

  // Avançar lead para próxima etapa com botão rápido
  const handleAdvanceStage = async (lead: EnrichedLead, e: React.MouseEvent) => {
    e.stopPropagation()
    const currentIndex = stages.findIndex((s) => s.stage_key === lead.stage_id)
    if (currentIndex >= 0 && currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1]
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, stage_id: nextStage.stage_key } : l))
      )
      await updateLeadStage(lead.id, nextStage.stage_key)
    }
  }

  // Abrir WhatsApp com link wa.me e registrar auditoria
  const handleOpenWhatsApp = async (lead: EnrichedLead, e: React.MouseEvent) => {
    e.stopPropagation()
    const phone = lead.customer?.normalized_phone || lead.customer?.phone?.replace(/\D/g, '')
    if (!phone) {
      alert('Telefone do cliente não cadastrado.')
      return
    }

    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`
    const message = encodeURIComponent(
      `Olá ${lead.customer?.full_name}, tudo bem? Sou o consultor da Fácil Car Shop referente ao seu interesse no ${lead.vehicle?.title || 'veículo anunciado'}. Como posso te ajudar hoje?`
    )
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`

    // Registrar evento de contato na auditoria
    await recordContactEvent({
      dealerId: lead.dealer_id,
      storeId: lead.store_id,
      leadId: lead.id,
      customerId: lead.customer_id,
      sellerId: lead.assigned_seller_id || undefined,
      channel: 'whatsapp',
      direction: 'outbound',
      eventType: 'whatsapp_link_opened',
      metadata: { phone: cleanPhone, vehicle: lead.vehicle?.title },
    })

    window.open(whatsappUrl, '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Carregando CRM Kanban...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por cliente, carro ou canal..."
            className="bg-slate-950 border-slate-800 text-sm h-9"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Prioridade:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todas as prioridades</option>
            <option value="urgent">Urgente 🔥</option>
            <option value="high">Alta</option>
            <option value="normal">Normal</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* Grid de Colunas do Kanban (Rolagem Horizontal Suave) */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter(
            (l) => l.stage_id === stage.stage_key || l.stage_id === stage.id
          )
          const totalValue = stageLeads.reduce((acc, l) => acc + (l.vehicle?.price || 0), 0)

          return (
            <div
              key={stage.stage_key || stage.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.stage_key)}
              className="flex-shrink-0 w-80 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 flex flex-col flex-1 min-h-[580px] max-h-[750px]"
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color || '#3b82f6' }}
                  />
                  <h3 className="font-semibold text-sm text-slate-100">{stage.name}</h3>
                  <span className="text-xs bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                {totalValue > 0 && (
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {formatCurrency(totalValue)}
                  </span>
                )}
              </div>

              {/* Lista de Cards da Etapa */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="h-32 border border-dashed border-slate-800/60 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    Arraste uma oportunidade aqui
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      onClick={() => {
                        setActiveLeadModal(lead)
                        onLeadSelect?.(lead)
                      }}
                      className={`group relative bg-slate-950 border border-slate-800 hover:border-slate-700 hover:shadow-lg rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
                        draggedLeadId === lead.id ? 'opacity-40 scale-95' : 'opacity-100'
                      }`}
                    >
                      {/* Tag de Prioridade e Origem */}
                      <div className="flex items-center justify-between text-[11px] mb-2">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                          {lead.source}
                        </span>

                        {lead.priority === 'urgent' && (
                          <span className="bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <span>Urgente</span>
                          </span>
                        )}
                        {lead.priority === 'high' && (
                          <span className="bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full">
                            Alta
                          </span>
                        )}
                      </div>

                      {/* Dados do Cliente */}
                      <div className="mb-2">
                        <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 group-hover:text-blue-400 transition-colors">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{lead.customer?.full_name || 'Cliente'}</span>
                        </h4>
                        <p className="text-xs text-slate-400 truncate pl-5">
                          {lead.customer?.phone || 'Sem telefone'}
                        </p>
                      </div>

                      {/* Veículo de Interesse */}
                      {lead.vehicle && (
                        <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-2 mb-2 flex items-center space-x-2">
                          {lead.vehicle.photos?.[0] ? (
                            <img
                              src={lead.vehicle.photos[0]}
                              alt={lead.vehicle.title}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center shrink-0">
                              <Car className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {lead.vehicle.title}
                            </p>
                            <p className="text-xs font-bold text-emerald-400">
                              {formatCurrency(lead.vehicle.price)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Ações Rápidas (WhatsApp & Próxima Etapa) */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleOpenWhatsApp(lead, e)}
                          className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center space-x-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleAdvanceStage(lead, e)}
                          className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 flex items-center space-x-1"
                        >
                          <span>Avançar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Detalhes da Oportunidade */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {activeLeadModal.customer?.full_name}
                </h3>
                <p className="text-xs text-slate-400">
                  Lead #{activeLeadModal.id} • Criado em{' '}
                  {new Date(activeLeadModal.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setActiveLeadModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Veículo Desejado</span>
                <p className="font-bold text-white">{activeLeadModal.vehicle?.title}</p>
                <p className="text-emerald-400 font-bold">
                  {formatCurrency(activeLeadModal.vehicle?.price || 0)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-semibold block">Notas e Histórico</span>
                <p className="text-slate-300 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {activeLeadModal.customer?.notes || 'Nenhuma observação cadastrada.'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={(e) => handleOpenWhatsApp(activeLeadModal, e)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveLeadModal(null)}
                  className="border-slate-700 text-slate-200"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
