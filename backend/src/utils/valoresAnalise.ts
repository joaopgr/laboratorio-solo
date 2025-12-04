import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

// Cache de valores (atualizado quando necessário)
let valoresCache: {
  solo?: Record<string, number>;
  foliar?: Record<string, number>;
} = {};

// Valores padrão como fallback
const VALORES_PADRAO = {
  solo: {
    rotina: 15,
    organica: 10,
    micronutrientes: 20,
    prem: 12,
    enxofre: 10,
    nitrogenio: 10,
    granulometria: 30,
  },
  foliar: {
    rotina: 15,
    organica: 0,
    micronutrientes: 15,
    prem: 0,
    enxofre: 15,
    nitrogenio: 15,
    granulometria: 0,
  },
};

// Buscar valores do banco de dados
export async function getValoresAnalise(modulo: 'solo' | 'foliar'): Promise<Record<string, number>> {
  try {
    // Verificar cache primeiro
    if (valoresCache[modulo]) {
      return valoresCache[modulo]!;
    }

    // Buscar do banco
    const { query: valoresQuery, params } = SQL_QUERIES.valoresAnalise.findByModulo(modulo);
    const result = await query(valoresQuery, params);

    // Converter para objeto chave-valor
    const valores: Record<string, number> = {};
    result.rows.forEach((row: any) => {
      valores[row.tipo] = parseFloat(row.valor);
    });

    // Atualizar cache
    valoresCache[modulo] = valores;

    return valores;
  } catch (error) {
    console.error(`Erro ao buscar valores de análise para ${modulo}:`, error);
    // Retornar valores padrão em caso de erro
    return VALORES_PADRAO[modulo];
  }
}

// Limpar cache (chamar após atualizar valores)
export function limparCacheValores() {
  valoresCache = {};
}

// Função para obter valor específico
export async function getValorAnalise(
  modulo: 'solo' | 'foliar',
  tipo: string
): Promise<number> {
  const valores = await getValoresAnalise(modulo);
  return valores[tipo] || 0;
}

