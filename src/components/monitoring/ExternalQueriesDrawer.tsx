// ==============================================================================
// PAINEL DE AUDITORIA E LOGS — FCS_EXTERNAL_API_QUERIES
// Monitora latência, status, cache e protege dados sensíveis (LGPD)
// ==============================================================================

import * as React from 'react'
import {
  ShieldCheck,
  Clock,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  clearApiLogs,
  getRecentApiLogs,
  subscribeToApiLogs,
} from '@/services/apiLogger'
import type { ExternalApiQueryLog } from '@/types'

export interface ExternalQueriesDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function ExternalQueriesDrawer({
  isOpen,
  onClose,
}: ExternalQueriesDrawerProps) {
  const [logs, setLogs] = React.useState<ExternalApiQueryLog[]>([])

  React.useEffect(() => {
    setLogs(getRecentApiLogs())
    const unsubscribe = subscribeToApiLogs((updated) => {
      setLogs(updated)
    })
    return () => unsubscribe()
  }, [])

  // Métricas
  const total = logs.length
  const successCount = logs.filter((l) => l.status === 'success').length
  const cachedCount = logs.filter((l) => l.status === 'cached').length
  const avgLatency =
    total > 0
      ? Math.round(logs.reduce((acc, l) => acc + l.response_time_ms, 0) / total)
      : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Auditoria de Integrações (fcs_external_api_queries)"
      description="Monitoramento em tempo real das chamadas à BrasilAPI e Provedores de Placas."
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Banner de Proteção de Dados (LGPD) */}
        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 flex items-start space-x-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block">Proteção e Privacidade Ativa:</strong>
            As placas veiculares são anonimizadas/mascaradas e informações proprietárias restritas
            não são gravadas em logs genéricos de auditoria, atendendo estritamente aos requisitos de segurança.
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Total de Consultas</span>
            <span className="text-xl font-black text-white">{total}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Latência Média</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{avgLatency} ms</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Cache Hits (Economia)</span>
            <span className="text-xl font-black text-emerald-400">{cachedCount}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[11px] text-slate-400 block font-medium">Taxa de Sucesso</span>
            <span className="text-xl font-black text-blue-400">
              {total > 0 ? `${Math.round(((successCount + cachedCount) / total) * 100)}%` : '100%'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Últimas {logs.length} chamadas registradas:</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearApiLogs}
            disabled={logs.length === 0}
            className="text-xs text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Limpar Registros
          </Button>
        </div>

        {/* Lista de Registros */}
        {logs.length === 0 ? (
          <div className="rounded-xl border border-slate-800 p-8 text-center text-slate-500 text-xs bg-slate-900/20">
            Nenhuma consulta registrada até o momento. Realize uma consulta de placa, FIPE, CNPJ ou CEP.
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      log.status === 'success'
                        ? 'bg-emerald-400'
                        : log.status === 'cached'
                        ? 'bg-blue-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <strong className="text-white font-mono uppercase">
                        {log.query_type}
                      </strong>
                      <Badge variant="outline" className="text-[10px] font-mono py-0">
                        {log.provider}
                      </Badge>
                      {log.status === 'cached' && (
                        <Badge variant="info" className="text-[10px] py-0">
                          CACHE TTL
                        </Badge>
                      )}
                    </div>
                    {log.endpoint && (
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate max-w-sm">
                        {log.endpoint}
                      </span>
                    )}
                    {log.metadata && (
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-slate-400">
                        {Object.entries(log.metadata).map(([k, v]) => (
                          <span key={k} className="bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {k}: <strong className="text-slate-300">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-slate-300 flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-500" />
                    {log.response_time_ms} ms
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(log.requested_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
