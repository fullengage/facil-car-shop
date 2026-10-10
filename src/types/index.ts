// ==============================================================================
// TIPOS DO DOMÍNIO — FÁCIL CAR SHOP
// ==============================================================================

export type PlateLookupStatus = 'pending' | 'success' | 'not_found' | 'failed' | 'manual';
export type VehicleStatus = 'draft' | 'published' | 'sold' | 'archived';
export type StoreStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export interface Vehicle {
  id: string;
  store_id: string;
  title: string;
  brand: string;
  model: string;
  version?: string;
  model_year: number;
  manufacturing_year?: number;
  fuel_type?: string;
  color?: string;
  mileage: number;
  transmission?: string;
  price: number;
  description?: string;
  photos: string[];
  status: VehicleStatus;

  // Campos de Placa e Tabela FIPE
  plate?: string;
  plate_masked?: string;
  fipe_code?: string;
  fipe_price?: number;
  fipe_reference_month?: string;
  plate_lookup_status: PlateLookupStatus;
  plate_lookup_provider?: string;
  plate_last_checked_at?: string;
  fipe_last_checked_at?: string;

  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id?: string;
  name: string; // Nome Fantasia
  corporate_name?: string; // Razão Social
  cnpj?: string;
  phone?: string;
  email?: string;
  cep?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  slug?: string; // Caminho da vitrine: /loja/<slug>
  custom_domain?: string; // Domínio próprio do lojista (ex: minhaloja.com.br)
  domain_verified?: boolean; // Só true após o administrador confirmar o CNAME
  status: StoreStatus;
  created_at: string;
  updated_at: string;
}

export interface ExternalApiQueryLog {
  id: string;
  user_id?: string;
  store_id?: string;
  provider: string;
  query_type: string;
  status: 'success' | 'error' | 'cached' | 'timeout';
  requested_at: string;
  response_time_ms: number;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

// ==============================================================================
// TIPOS BRASILAPI — FIPE
// ==============================================================================

export interface FipeBrand {
  nome: string;
  valor: string; // ID / Código da marca na BrasilAPI
}

export interface FipeModel {
  nome: string;
  valor: string | number; // ID / Código do modelo
}

export interface FipeYear {
  nome: string; // ex: "2024 Gasolina"
  valor: string; // ex: "2024-1"
}

export interface FipeVehicleDetail {
  valor: string; // ex: "R$ 95.420,00"
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  tipoVeiculo: number;
  siglaCombustivel: string;
  dataConsulta?: string;
}

export interface FipeReferenceTable {
  codigo: number;
  mes: string;
}

// ==============================================================================
// TIPOS BRASILAPI — CNPJ & CEP
// ==============================================================================

export interface BrasilApiCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  uf?: string;
  municipio?: string;
  ddd_telefone_1?: string;
  email?: string;
  capital_social?: number;
}

export interface BrasilApiCep {
  cep: string;
  state: string;
  city: string;
  neighborhood?: string;
  street?: string;
  service?: string;
}

// ==============================================================================
// TIPOS DE CONSULTA DE PLACAS
// ==============================================================================

export interface PlateLookupResult {
  success: boolean;
  plate: string;
  maskedPlate: string;
  brand?: string;
  model?: string;
  version?: string;
  modelYear?: number;
  manufactureYear?: number;
  fuel?: string;
  color?: string;
  fipeCode?: string;
  fipePriceEstimated?: number;
  provider: string;
  chassisMasked?: string;
  errorMessage?: string;
  isMercosul: boolean;
}

export interface VehiclePlateProvider {
  readonly name: string;
  lookupPlate(plate: string): Promise<PlateLookupResult>;
}

// ==============================================================================
// CRM AUTOMOTIVO & GESTÃO DE LOJAS (17 TABELAS FCS)
// ==============================================================================
export * from './crm';

