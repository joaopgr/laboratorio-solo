// Tipos compartilhados entre frontend e backend

// Valores dos tipos de análise para SOLO
export const ANALISE_VALUES_SOLO = {
  rotina: 15,
  organica: 10, // Matéria Orgânica
  micronutrientes: 20, // Micronutrientes
  prem: 12, // PREM
  enxofre: 10, // Enxofre
  nitrogenio: 10, // Nitrogênio
  granulometria: 30, // Análise Granulométrica (dentro de solo)
} as const;

// Valores dos tipos de análise para FOLIAR (TOTAL: 60)
export const ANALISE_VALUES_FOLIAR = {
  rotina: 15,        // 15
  organica: 0,       // Não usado em foliar
  micronutrientes: 15, // 15
  prem: 0,           // Não usado em foliar
  enxofre: 15,       // 15
  nitrogenio: 15,    // 15
  granulometria: 0,  // Não usado em foliar
} as const;

// Função para obter valores baseados no tipo de análise
export const getAnaliseValues = (tipoAnalise: TipoAnalise) => {
  return tipoAnalise === 'foliar' ? ANALISE_VALUES_FOLIAR : ANALISE_VALUES_SOLO;
};

// Manter compatibilidade com código existente
export const ANALISE_VALUES = ANALISE_VALUES_SOLO;

export type UsuarioRole = 'admin' | 'analista' | 'visualizador';
export type AuthRole = UsuarioRole | 'cliente';

// Tipos de análise disponíveis
export type TipoAnalise = 'solo' | 'foliar';
export type CategoriaResultado = 'solo' | 'foliar';

export type AnaliseType = keyof typeof ANALISE_VALUES;

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  createdAt: string;
  updatedAt: string;
  lotes?: LoteAmostra[];
}

export interface LoteAmostra {
  id: string;
  codigo: string;
  dataEntrega: string;
  observacoes?: string;
  status: 'pendente' | 'em_analise' | 'concluido' | 'pago';
  pago: boolean;
  desconto?: number; // Desconto em porcentagem
  // Tipo de análise do lote (sinônimos para compatibilidade)
  tipoAnalise?: TipoAnalise; // Frontend usa este nome
  modulo?: TipoAnalise; // Backend retorna este nome
  // Tipos de análise solicitados para o lote (solo)
  rotina: boolean;
  organica: boolean; // Matéria Orgânica
  micronutrientes: boolean; // Micronutrientes
  enxofre: boolean; // Enxofre
  prem: boolean; // PREM
  nitrogenio: boolean; // Nitrogênio
  granulometria: boolean; // Análise Granulométrica (dentro de solo)
  // Tipos de análise para foliar
  foliar: boolean; // Análise Foliar
  clienteId: string;
  cliente?: Cliente;
  amostras?: Amostra[];
  createdAt: string;
  updatedAt: string;
}

export interface Amostra {
  id: string;
  codigo: string;
  identificacao: string;
  cultura: string;
  localidade?: string;
  propriedade?: string;  // Nome da propriedade
  solicitante?: string;  // Nome do solicitante
  dataColeta?: string;
  dataRecebimento: string;
  observacoes?: string;
  // Tipo de análise da amostra
  tipoAnalise: TipoAnalise;
  // Tipos de análise solicitados (solo)
  rotina: boolean;
  organica: boolean; // Matéria Orgânica
  micronutrientes: boolean; // Micronutrientes
  enxofre: boolean; // Enxofre
  prem: boolean; // PREM
  nitrogenio: boolean; // Nitrogênio
  granulometria: boolean; // Análise Granulométrica (dentro de solo)
  // Tipos de análise para foliar
  foliar: boolean; // Análise Foliar
  status: 'pendente' | 'em_analise' | 'concluida';
  pago: boolean;
  loteId: string;
  lote?: LoteAmostra;
  resultados?: Resultado[];
  createdAt: string;
  updatedAt: string;
}

export interface Resultado {
  id: string;
  amostraId: string;
  categoria: CategoriaResultado;
  tipo: string;
  valor: string;
  unidade: string;
  diluicao?: string;
  massa?: string;
  branco?: string;
  al?: string;
  h_al?: string;
  param_a?: string;
  param_b?: string;
  dataAnalise?: string;
  observacoes?: string;
  amostra?: Amostra;
  createdAt: string;
  updatedAt: string;
  
  // Propriedades calculadas para exibição
  caCalculado?: number;
  mgCalculado?: number;
  kCalculado?: number;
  pCalculado?: number;
  alCalculado?: number;
  hCalculado?: number;
  znCalculado?: number;
  mnCalculado?: number;
  feCalculado?: number;
  cuCalculado?: number;
  bCalculado?: number;
  
  // Propriedades adicionais para compatibilidade
  ph?: string;
  pAbs?: string;
  kMgL?: string;
  alCmol?: string;
  hAl?: string;
  s?: string;
  zn?: string;
  mn?: string;
  fe?: string;
  cu?: string;
  b?: string;
  mo?: string;
  
  // Campos granulométricos
  massaRecipienteAreiaGrossa?: number;
  massaRecipienteAreiaFina?: number;
  massaRecipienteSilteArgila?: number;
  massaRecipienteArgila?: number;
  massaRecipientePartAreiaGrossa?: number;
  massaRecipientePartAreiaFina?: number;
  massaRecipientePartSilteArgila?: number;
  massaRecipientePartArgila?: number;
  tfsa?: number;
  massaLata?: number;
  massaLataSu?: number;
  massaLataSs?: number;
  massaAreiaGrossa?: number;
  massaAreiaFina?: number;
  massaSilte?: number;
  massaArgila?: number;
  proporcaoAreiaGrossa?: number;
  proporcaoAreiaFina?: number;
  proporcaoSilte?: number;
  proporcaoArgila?: number;
  totalRecuperado?: number;
  fatorF?: number;
  classificacaoTextural?: string;
  precisao?: number;
  
  // Campos específicos para módulo foliar
  massaBFoliar?: number;
  diluicaoBFoliar?: number;
  brancoBFoliar?: number;
  // Campos alternativos do banco (dilB e brancoB)
  dilB?: number;
  brancoB?: number;
  massaN?: number;
  volumeN?: number;
  brancoN?: number;
  massaTrisR1?: number;
  massaTrisR2?: number;
  massaTrisR3?: number;
  volumeTitR1?: number;
  volumeTitR2?: number;
  volumeTitR3?: number;

  origem?: 'bruto' | 'calculado';
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UsuarioRole;
  ativo: boolean;
  createdAt: string;
}

export interface ClienteAuthUser {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  role: 'cliente';
  tipo: 'cliente';
}

export type AuthenticatedUser =
  | (Usuario & { tipo: 'funcionario' })
  | ClienteAuthUser;

export interface AuthResponse {
  token: string;
  usuario: Usuario & { tipo: 'funcionario' };
}

export interface ClienteAuthResponse {
  token: string;
  cliente: ClienteAuthUser;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data?: T;
  pagination?: PaginationMeta;
  error?: string;
  details?: Record<string, unknown>;
}

// Tipos para formulários
export interface CreateClienteData {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
}

export interface CreateLoteAmostraData {
  codigo: string;
  dataEntrega: string;
  observacoes?: string;
  status: 'pendente' | 'em_analise' | 'concluido';
  pago: boolean;
  desconto?: number; // Desconto em porcentagem
  // Tipo de análise do lote
  tipoAnalise: TipoAnalise;
  // Tipos de análise solicitados para o lote (solo)
  rotina: boolean;
  organica: boolean; // Matéria Orgânica
  micronutrientes: boolean; // Micronutrientes
  enxofre: boolean; // Enxofre
  prem: boolean; // PREM
  nitrogenio: boolean; // Nitrogênio
  granulometria: boolean; // Análise Granulométrica (dentro de solo)
  // Tipos de análise para foliar
  foliar: boolean; // Análise Foliar
  clienteId: string;
}

export interface CreateAmostraData {
  codigo: string;
  identificacao: string;
  cultura: string;
  localidade?: string;
  propriedade?: string;  // Nome da propriedade
  solicitante?: string;  // Nome do solicitante
  dataColeta?: string;
  observacoes?: string;
  // Módulo da amostra (solo ou foliar)
  modulo?: TipoAnalise;
  // Tipo de análise da amostra
  tipoAnalise: TipoAnalise;
  // Tipos de análise solicitados (solo)
  rotina: boolean;
  organica: boolean; // Matéria Orgânica
  micronutrientes: boolean; // Micronutrientes
  enxofre: boolean; // Enxofre
  prem: boolean; // PREM
  nitrogenio: boolean; // Nitrogênio
  granulometria: boolean; // Análise Granulométrica (dentro de solo)
  // Tipos de análise para foliar
  foliar: boolean; // Análise Foliar
  pago: boolean;
  loteId: string;
}

export interface CreateResultadoData {
  amostraId: string;
  categoria: CategoriaResultado;
  tipo: string;
  valor?: string;
  diluicao?: string;
  massa?: string;
  branco?: string;
  al?: string;
  h_al?: string;
  param_a?: string;
  param_b?: string;
  dataAnalise?: string;
  observacoes?: string;
  // Campos granulométricos (apenas para módulo solo)
  massaRecipienteAreiaGrossa?: number;
  massaRecipienteAreiaFina?: number;
  massaRecipienteSilteArgila?: number;
  massaRecipienteArgila?: number;
  massaRecipientePartAreiaGrossa?: number;
  massaRecipientePartAreiaFina?: number;
  massaRecipientePartSilteArgila?: number;
  massaRecipientePartArgila?: number;
  tfsa?: number;
  massaLata?: number;
  massaLataSu?: number;
  massaLataSs?: number;
  // Campos específicos do módulo foliar
  massaBFoliar?: number;
  dilB?: number;
  brancoB?: number;
  massaN?: number;
  volumeN?: number;
  brancoN?: number;
  fatorF?: number;
  massaTrisR1?: number;
  massaTrisR2?: number;
  massaTrisR3?: number;
  volumeTitR1?: number;
  volumeTitR2?: number;
  volumeTitR3?: number;
}

export interface CreateResultadosLoteData {
  resultados: Array<{
    amostraId: string;
    tipo: string;
    categoria?: CategoriaResultado;
    valor?: string;
    unidade?: string;
    diluicao?: string;
    massa?: string;
    branco?: string;
    al?: string;
    h_al?: string;
    param_a?: string;
    param_b?: string;
    dataAnalise?: string;
    observacoes?: string;
    // Campos granulométricos
    massaRecipienteAreiaGrossa?: number;
    massaRecipienteAreiaFina?: number;
    massaRecipienteSilteArgila?: number;
    massaRecipienteArgila?: number;
    massaRecipientePartAreiaGrossa?: number;
    massaRecipientePartAreiaFina?: number;
    massaRecipientePartSilteArgila?: number;
    massaRecipientePartArgila?: number;
    tfsa?: number;
    massaLata?: number;
    massaLataSu?: number;
    massaLataSs?: number;
    // Campos específicos do módulo foliar
    massaBFoliar?: number;
    dilB?: number;
    brancoB?: number;
    massaN?: number;
    volumeN?: number;
    brancoN?: number;
    fatorF?: number;
    massaTrisR1?: number;
    massaTrisR2?: number;
    massaTrisR3?: number;
    volumeTitR1?: number;
    volumeTitR2?: number;
    volumeTitR3?: number;
  }>;
}

// Filtros
export interface ClienteFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface LoteAmostraFilters {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  pago?: boolean;
  concluido?: boolean;
  tipoAnalise?: TipoAnalise | undefined;
}

export interface AmostraFilters {
  page?: number;
  limit?: number;
  search?: string;
  loteId?: string;
  status?: string;
  cultura?: string;
  ano?: string;
  tipoAnalise?: TipoAnalise;
  codigoInicio?: string;
  codigoFim?: string;
}

export interface ResultadoFilters {
  page?: number;
  limit?: number;
  amostraId?: string;
  clienteId?: string;
  cultura?: string;
  ano?: string;
  categoria?: CategoriaResultado;
  tiposAnalise?: {
    rotina?: boolean;
    organica?: boolean;
    micronutrientes?: boolean;
    enxofre?: boolean;
    prem?: boolean;
    nitrogenio?: boolean;
    granulometria?: boolean;
  };
}

export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: 'tarefa' | 'aviso' | 'lembrete';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavel?: string;
  prazo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAtividadeData {
  titulo: string;
  descricao?: string;
  tipo?: 'tarefa' | 'aviso' | 'lembrete';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel?: string;
  prazo?: string;
}

export interface UpdateAtividadeData {
  titulo?: string;
  descricao?: string;
  tipo?: 'tarefa' | 'aviso' | 'lembrete';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  status?: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavel?: string;
  prazo?: string;
}


