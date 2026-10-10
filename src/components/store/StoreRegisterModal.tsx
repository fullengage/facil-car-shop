// ==============================================================================
// CADASTRO DE LOJAS COM CONSULTA DE CNPJ E CEP (BRASILAPI)
// Endpoints: GET /cnpj/v1/{cnpj} & GET /cep/v2/{cep}
// ==============================================================================

import * as React from 'react'
import {
  Building2,
  Search,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { getCnpjDetails, cleanCnpj, formatCnpj } from '@/services/brasilApi/cnpjService'
import { getCepDetails, cleanCep, formatCep } from '@/services/brasilApi/cepService'
import { createStore } from '@/services/storeService'
import type { Store } from '@/types'
import { normalizeDomain, slugify } from '@/utils/storeIdentity'

const PLATFORM_HOST = (import.meta.env.VITE_PLATFORM_HOST as string | undefined) ?? ''

export interface StoreRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onStoreCreated: (store: Store) => void
}

export function StoreRegisterModal({
  isOpen,
  onClose,
  onStoreCreated,
}: StoreRegisterModalProps) {
  const [cnpj, setCnpj] = React.useState('')
  const [name, setName] = React.useState('') // Nome Fantasia
  const [corporateName, setCorporateName] = React.useState('') // Razão Social
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')

  // Vitrine: /loja/<slug> e, opcionalmente, domínio próprio
  const [slug, setSlug] = React.useState('')
  const [customDomain, setCustomDomain] = React.useState('')

  // Endereço
  const [cep, setCep] = React.useState('')
  const [street, setStreet] = React.useState('')
  const [number, setNumber] = React.useState('')
  const [complement, setComplement] = React.useState('')
  const [neighborhood, setNeighborhood] = React.useState('')
  const [city, setCity] = React.useState('')
  const [state, setState] = React.useState('')

  // Estados de consulta BrasilAPI
  const [isLoadingCnpj, setIsLoadingCnpj] = React.useState(false)
  const [isLoadingCep, setIsLoadingCep] = React.useState(false)
  const [cnpjSuccess, setCnpjSuccess] = React.useState(false)
  const [cepSuccess, setCepSuccess] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Consulta CNPJ na BrasilAPI
  async function handleLookupCnpj() {
    const raw = cleanCnpj(cnpj)
    if (raw.length !== 14) {
      setErrorMessage('Digite um CNPJ válido com 14 dígitos numéricos.')
      return
    }

    setIsLoadingCnpj(true)
    setErrorMessage(null)
    setCnpjSuccess(false)

    try {
      const data = await getCnpjDetails(raw)
      setCnpjSuccess(true)

      // Preenchimento automático dos dados retornados
      if (data.razao_social) setCorporateName(data.razao_social)
      if (data.nome_fantasia) {
        setName(data.nome_fantasia)
        setSlug(slugify(data.nome_fantasia))
      } else if (data.razao_social) {
        setName(data.razao_social)
        setSlug(slugify(data.razao_social))
      }

      if (data.ddd_telefone_1) setPhone(data.ddd_telefone_1)
      if (data.email) setEmail(data.email.toLowerCase())

      // Preenchimento de endereço vindo do CNPJ
      if (data.cep) {
        const cleanedCep = cleanCep(data.cep)
        setCep(cleanedCep)
        // Se vier CEP, consulta para completar bairro/cidade
        if (cleanedCep.length === 8) {
          handleLookupCep(cleanedCep)
        }
      }
      if (data.logradouro) setStreet(data.logradouro)
      if (data.numero) setNumber(data.numero)
      if (data.complemento) setComplement(data.complemento)
      if (data.bairro) setNeighborhood(data.bairro)
      if (data.municipio) setCity(data.municipio)
      if (data.uf) setState(data.uf)
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'CNPJ não encontrado na BrasilAPI ou serviço indisponível.'
      )
    } finally {
      setIsLoadingCnpj(false)
    }
  }

  // Consulta CEP na BrasilAPI
  async function handleLookupCep(cepToQuery?: string) {
    const targetCep = cleanCep(cepToQuery || cep)
    if (targetCep.length !== 8) {
      setErrorMessage('O CEP deve conter 8 dígitos.')
      return
    }

    setIsLoadingCep(true)
    setErrorMessage(null)
    setCepSuccess(false)

    try {
      const data = await getCepDetails(targetCep)
      setCepSuccess(true)
      if (data.street) setStreet(data.street)
      if (data.neighborhood) setNeighborhood(data.neighborhood)
      if (data.city) setCity(data.city)
      if (data.state) setState(data.state)
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao consultar CEP na BrasilAPI.'
      )
    } finally {
      setIsLoadingCep(false)
    }
  }

  // Enviar cadastro
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !corporateName) {
      setErrorMessage('Nome Fantasia e Razão Social são obrigatórios.')
      return
    }

    const finalSlug = slugify(slug || name)
    if (!finalSlug) {
      setErrorMessage('Defina um endereço para a vitrine (letras e números).')
      return
    }

    let finalDomain: string | undefined
    if (customDomain.trim()) {
      const normalized = normalizeDomain(customDomain)
      if (!normalized) {
        setErrorMessage('Domínio inválido. Exemplo: minhaloja.com.br')
        return
      }
      finalDomain = normalized
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const created = await createStore({
        name,
        corporate_name: corporateName,
        cnpj: cleanCnpj(cnpj),
        phone,
        email,
        cep: cleanCep(cep),
        address_street: street,
        address_number: number,
        address_complement: complement,
        address_neighborhood: neighborhood,
        address_city: city,
        address_state: state,
        slug: finalSlug,
        custom_domain: finalDomain,
        domain_verified: false,
        status: 'pending_approval',
      })

      onStoreCreated(created)
      onClose()
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Falha ao salvar a loja no banco de dados.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Nova Loja Parceira"
      description="Consulta automática via BrasilAPI (CNPJ e CEP) com preenchimento instantâneo."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-900/20 border border-red-800 p-3 text-xs text-red-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bloco CNPJ */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Consulta Empresarial por CNPJ (BrasilAPI)
              </label>
            </div>
            {cnpjSuccess && (
              <span className="text-[11px] text-emerald-400 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Dados Carregados
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Digite o CNPJ da Loja (ex: 00.000.000/0001-91)"
              value={formatCnpj(cnpj)}
              onChange={(e) => setCnpj(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="default"
              onClick={handleLookupCnpj}
              isLoading={isLoadingCnpj}
              disabled={cleanCnpj(cnpj).length < 14}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              <Search className="w-4 h-4 mr-1.5" />
              Consultar CNPJ
            </Button>
          </div>
          <div className="flex gap-1.5 text-[11px] text-slate-400">
            <span>Exemplo rápido:</span>
            <button
              type="button"
              onClick={() => {
                setCnpj('00.000.000/0001-91')
              }}
              className="text-blue-300 hover:underline font-mono"
            >
              00.000.000/0001-91 (Banco do Brasil)
            </button>
          </div>
        </div>

        {/* Campos Empresariais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Razão Social *</label>
            <Input
              value={corporateName}
              onChange={(e) => setCorporateName(e.target.value)}
              placeholder="Razão Social completa"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Nome Fantasia *</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSlug(slugify(e.target.value))
              }}
              placeholder="Nome da loja no marketplace"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Telefone / WhatsApp</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">E-mail Comercial</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@loja.com.br"
            />
          </div>
        </div>

        {/* Bloco Vitrine: endereço próprio e domínio opcional */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <label className="text-xs font-bold text-white uppercase tracking-wider">
              Sua vitrine na plataforma
            </label>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">Endereço da vitrine</label>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono">/loja/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="minha-loja"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 mb-1 block">
              Domínio próprio (opcional)
            </label>
            <Input
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="minhaloja.com.br"
              className="font-mono text-xs"
            />
            {customDomain.trim() && (
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                No painel de DNS do seu domínio, crie um registro <strong>CNAME</strong> apontando
                para <span className="font-mono text-cyan-300">{PLATFORM_HOST || 'o endereço da plataforma'}</span>.
                Depois que o administrador confirmar, o domínio passa a abrir a sua vitrine.
              </p>
            )}
          </div>
        </div>

        {/* Bloco Endereço & CEP */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Endereço e Localização (BrasilAPI CEP v2)
              </label>
            </div>
            {cepSuccess && (
              <span className="text-[11px] text-emerald-400 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                CEP Localizado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-slate-300 mb-1 block">CEP</label>
              <div className="flex gap-1.5">
                <Input
                  type="text"
                  placeholder="00000-000"
                  value={formatCep(cep)}
                  onChange={(e) => setCep(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleLookupCep()}
                  isLoading={isLoadingCep}
                  disabled={cleanCep(cep).length < 8}
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-300 mb-1 block">Logradouro / Rua</label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua, Avenida..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Número</label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Complemento</label>
              <Input
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Sala 10"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Bairro</label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1 block">Cidade / UF</label>
              <div className="flex gap-1">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                />
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="UF"
                  className="w-14 uppercase"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de Regra de Negócio (Item 4) */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-slate-400 flex items-start space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Aviso de Segurança:</strong> O cadastro da loja dependerá da aprovação do
            administrador geral. A consulta ao CNPJ não substitui a verificação de identidade e de
            autorização do responsável pela loja.
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 font-bold"
          >
            Cadastrar Loja
          </Button>
        </div>
      </form>
    </Modal>
  )
}
