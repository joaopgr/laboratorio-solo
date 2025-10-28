import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

// Função para verificar se todos os tipos de análise solicitados têm resultados
export async function verificarAmostraCompleta(amostraId: string): Promise<boolean> {
  const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(amostraId);
  const amostraResult = await query(amostraQuery, amostraParams);
  const amostra = amostraResult.rows[0];

  if (!amostra) return false;

  // Buscar resultados da amostra
  const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraId);
  const resultadosResult = await query(resultadosQuery, resultadosParams);
  const resultados = resultadosResult.rows;

  // Mapeamento dos tipos de análise para os tipos de resultado
  const analiseToResultadoMap = {
    rotina: amostra.modulo === 'foliar' ? ['P', 'K', 'Ca', 'Mg'] : ['pH', 'P', 'Na', 'K', 'H+Al', 'Ca', 'Mg'],
    micronutrientes: ['Fe', 'Zn', 'Cu', 'Mn', 'B'],
    organica: amostra.modulo === 'foliar' ? [] : ['MO'],
    enxofre: ['S'],
    prem: amostra.modulo === 'foliar' ? [] : ['PREM'],
    nitrogenio: amostra.modulo === 'foliar' ? ['N', 'MASSA_GERAL', 'DETERMINACAO_F'] : ['N'],
    granulometria: amostra.modulo === 'foliar' ? [] : ['GRAN_MASSA_RECIPIENTES', 'GRAN_MASSA_RECIPIENTES_PARTICULAS', 'GRAN_MASSA_FATOR_F']
  };

  // Determinar quais tipos de resultado são necessários
  const tiposNecessarios: string[] = [];
  
  if (amostra.rotina) tiposNecessarios.push(...analiseToResultadoMap.rotina);
  if (amostra.micronutrientes) tiposNecessarios.push(...analiseToResultadoMap.micronutrientes);
  if (amostra.organica) tiposNecessarios.push(...analiseToResultadoMap.organica);
  if (amostra.enxofre) tiposNecessarios.push(...analiseToResultadoMap.enxofre);
  if (amostra.prem) tiposNecessarios.push(...analiseToResultadoMap.prem);
  if (amostra.nitrogenio) tiposNecessarios.push(...analiseToResultadoMap.nitrogenio);
  if (amostra.granulometria) tiposNecessarios.push(...analiseToResultadoMap.granulometria);

  // Verificar se todos os tipos necessários têm resultados
  const tiposComResultado = resultados.map(r => r.tipo);
  
  // Função para verificar se um tipo necessário tem resultado (considerando variações)
  const temResultado = (tipoNecessario: string): boolean => {
    if (tipoNecessario === 'H+Al') {
      // Aceitar tanto H+Al quanto H_Al
      return tiposComResultado.includes('H+Al') || tiposComResultado.includes('H_Al');
    }
    return tiposComResultado.includes(tipoNecessario);
  };

  return tiposNecessarios.every(tipo => temResultado(tipo));
}

// Função para determinar o status de uma amostra
export async function determinarStatusAmostra(amostraId: string): Promise<string> {
  const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(amostraId);
  const amostraResult = await query(amostraQuery, amostraParams);
  const amostra = amostraResult.rows[0];

  if (!amostra) return 'pendente';

  // Se não há tipos de análise solicitados, está pendente
  const temAnalisesSolicitadas = amostra.rotina || amostra.organica || amostra.micronutrientes || 
                                amostra.enxofre || amostra.prem || amostra.nitrogenio || 
                                amostra.granulometria || amostra.foliar;

  if (!temAnalisesSolicitadas) {
    return 'pendente';
  }

  // Buscar resultados para verificar se tem algum
  const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraId);
  const resultadosResult = await query(resultadosQuery, resultadosParams);
  const resultados = resultadosResult.rows;
  
  // Se não tem resultados, está pendente
  if (resultados.length === 0) {
    return 'pendente';
  }
  
  // Verificar se está completa
  const completa = await verificarAmostraCompleta(amostraId);
  
  if (completa) {
    return 'concluida';
  } else {
    return 'em_analise';
  }
}

// Função para verificar se um lote está completo
export async function verificarLoteCompleto(loteId: string): Promise<boolean> {
  const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(loteId);
  const amostrasResult = await query(amostrasQuery, amostrasParams);
  const amostras = amostrasResult.rows;

  if (amostras.length === 0) return false;

  // Verificar se todas as amostras estão completas
  for (const amostra of amostras) {
    const completa = await verificarAmostraCompleta(amostra.id);
    if (!completa) {
      return false;
    }
  }

  return true;
}

// Função para determinar o status de um lote
export async function determinarStatusLote(loteId: string): Promise<string> {
  const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(loteId);
  const loteResult = await query(loteQuery, loteParams);
  const lote = loteResult.rows[0];

  if (!lote) return 'pendente';

  const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(loteId);
  const amostrasResult = await query(amostrasQuery, amostrasParams);
  const amostras = amostrasResult.rows;

  if (amostras.length === 0) return 'pendente';

  // Verificar se todas as amostras estão completas
  const todasCompletas = await verificarLoteCompleto(loteId);
  
  if (todasCompletas) {
    return 'concluido';
  } else {
    return 'em_analise';
  }
}