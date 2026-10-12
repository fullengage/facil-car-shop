import * as React from 'react'
import {
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { updateStore } from '@/services/storeService'
import type { Store } from '@/types'

export interface StoreEditModalProps {
  isOpen: boolean
  onClose: () => void
  store: Store
  onStoreUpdated: (updatedStore: Store) => void
}

export function StoreEditModal({
  isOpen,
  onClose,
  store,
  onStoreUpdated,
}: StoreEditModalProps) {
  const [name, setName] = React.useState(store.name || '')
  const [corporateName, setCorporateName] = React.useState(store.corporate_name || '')
  const [phone, setPhone] = React.useState(store.phone || '')
  const [email, setEmail] = React.useState(store.email || '')
  const [cep, setCep] = React.useState(store.cep || '')
  const [street, setStreet] = React.useState(store.address_street || '')
  const [number, setNumber] = React.useState(store.address_number || '')
  const [complement, setComplement] = React.useState(store.address_complement || '')
  const [neighborhood, setNeighborhood] = React.useState(store.address_neighborhood || '')
  const [city, setCity] = React.useState(store.address_city || '')
  const [state, setState] = React.useState(store.address_state || '')

  const [isSaving, setIsSaving] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Sincroniza estado quando a loja mudar
  React.useEffect(() => {
    setName(store.name || '')
    setCorporateName(store.corporate_name || '')
    setPhone(store.phone || '')
    setEmail(store.email || '')
    setCep(store.cep || '')
    setStreet(store.address_street || '')
    setNumber(store.address_number || '')
    setComplement(store.address_complement || '')
    setNeighborhood(store.address_neighborhood || '')
    setCity(store.address_city || '')
    setState(store.address_state || '')
    setFeedback(null)
  }, [store, isOpen])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'O nome da loja é obrigatório.' })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const updated = await updateStore(store.id, {
        name,
        corporate_name: corporateName,
        phone,
        email,
        cep,
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: state,
      })

      if (updated) {
        setFeedback({ type: 'success', message: 'Dados da loja atualizados com sucesso!' })
        onStoreUpdated(updated)
        setTimeout(() => {
          onClose()
        }, 800)
      } else {
        setFeedback({ type: 'error', message: 'Não foi possível salvar as alterações.' })
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erro ao conectar ao servidor.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Dados da Loja">
      <form onSubmit={handleSave} className="space-y-6">
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Identificação */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <Building2 className="h-4 w-4" /> Identificação e Contato
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Nome Fantasia *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Auto Fácil Premium"
                required
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Razão Social</label>
              <Input
                value={corporateName}
                onChange={(e) => setCorporateName(e.target.value)}
                placeholder="Ex: Auto Fácil Veículos Ltda"
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="bg-white pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">E-mail Comercial</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@minhaloja.com.br"
                  className="bg-white pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-4 border-t border-border pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <MapPin className="h-4 w-4" /> Localização
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">CEP</label>
              <Input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-dark">Logradouro / Rua</label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Av. Paulista"
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Número</label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1000"
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Complemento</label>
              <Input
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Sala 102"
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">Bairro</label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-dark">Cidade</label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-dark">UF / Estado</label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary-hover text-white font-bold">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
