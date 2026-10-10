export type Carroceria = "Hatch" | "Sedan" | "SUV" | "Picape" | "Moto";
export type Cambio = "Manual" | "Automático";
export type Combustivel = "Flex" | "Diesel" | "Gasolina";

export interface Veiculo {
  id: string;
  slug: string;
  titulo: string;
  marca: string;
  modelo: string;
  versao: string;
  ano: number;
  km: number;
  cambio: Cambio;
  combustivel: Combustivel;
  carroceria: Carroceria;
  preco: number;
  cidade: string;
  lojaId: string;
  destaque: boolean;
  novo: boolean;
  cor: string;
  portas: number;
  motor: string;
  potencia: string;
  descricao: string;
  opcionais: string[];
  fotos: string[];
  publicadoEm: string;
  cidadeNome: string;
  lojaNome: string;
}

export interface Loja {
  id: string;
  slug: string;
  nome: string;
  cidade: string;
  uf: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  email: string;
  horario: string;
  descricao: string;
  plano: "basico" | "pro" | "premium";
  avaliacao: number;
}

export interface Marca {
  slug: string;
  nome: string;
}

export interface Cidade {
  slug: string;
  nome: string;
  uf: string;
}

export interface Post {
  slug: string;
  titulo: string;
  resumo: string;
  data: string;
}
