import { Router } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { authenticateToken, authorizeRoles } from './auth';
import { prepararDadosBrutos, calcularResultados, calcularResultadosFoliar } from '../utils/calculosResultados';

const router = Router();

router.use(authenticateToken, authorizeRoles('admin', 'funcionario', 'estagiario', 'recepcao', 'visitante'));

// Schema para filtros de relatório
const relatorioFiltersSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  localidade: z.string().optional(),
  cultura: z.string().optional(),
  clienteId: z.string().optional(),
  status: z.enum(['pendente', 'em_analise', 'concluido', 'pago']).optional(),
  modulo: z.enum(['solo', 'foliar']).optional(),
});

// GET /api/relatorios/geral - Relatório geral
router.get('/geral', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Construir query base para lotes
    let baseQuery = `
      SELECT 
        l.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado
      FROM lotes_amostras l
      JOIN clientes c ON l."clienteId" = c.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Filtros
    if (filters.modulo) {
      paramCount++;
      conditions.push(`l.modulo = $${paramCount}`);
      params.push(filters.modulo);
    }

    if (filters.clienteId) {
      paramCount++;
      conditions.push(`l."clienteId" = $${paramCount}`);
      params.push(filters.clienteId);
    }

    if (filters.status) {
      paramCount++;
      conditions.push(`l.status = $${paramCount}`);
      params.push(filters.status);
    }

    // Filtros de data
    if (filters.dataInicio) {
      paramCount++;
      conditions.push(`l."dataEntrega" >= $${paramCount}`);
      params.push(filters.dataInicio);
    }

    if (filters.dataFim) {
      paramCount++;
      conditions.push(`l."dataEntrega" <= $${paramCount}`);
      params.push(filters.dataFim);
    }

    // Adicionar condições à query
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenação
    baseQuery += ` ORDER BY l."dataEntrega" DESC`;

    // Executar query principal
    const lotesResult = await query(baseQuery, params);
    let lotes = lotesResult.rows;

    // Buscar amostras e resultados para cada lote
    for (const lote of lotes) {
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      let amostras = amostrasResult.rows;

      // Aplicar filtros de amostra
      if (filters.localidade) {
        amostras = amostras.filter((amostra: any) => 
          amostra.localidade && amostra.localidade.toLowerCase().includes(filters.localidade!.toLowerCase())
        );
      }

      if (filters.cultura) {
        amostras = amostras.filter((amostra: any) => 
          amostra.cultura && amostra.cultura.toLowerCase().includes(filters.cultura!.toLowerCase())
        );
      }

      // Buscar resultados para cada amostra
      for (const amostra of amostras) {
        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        amostra.resultados = resultadosResult.rows;
      }

      lote.amostras = amostras;
    }

    // Estatísticas gerais
    const totalLotes = lotes.length;
    const totalAmostras = lotes.reduce((sum: any, lote: any) => sum + lote.amostras.length, 0);
    const totalResultados = lotes.reduce((sum: any, lote: any) => 
      sum + lote.amostras.reduce((sumAmostra: any, amostra: any) => sumAmostra + amostra.resultados.length, 0), 0
    );
    
    // Status dos lotes
    const statusCount = lotes.reduce((acc: any, lote: any) => {
      acc[lote.status] = (acc[lote.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Tipos de análise mais solicitados
    const tiposAnalise = {
      rotina: 0,
      organica: 0,
      micronutrientes: 0,
      enxofre: 0,
      prem: 0,
      nitrogenio: 0,
      granulometria: 0
    };
    
    lotes.forEach((lote: any) => {
      lote.amostras.forEach((amostra: any) => {
        if (amostra.rotina) tiposAnalise.rotina++;
        if (amostra.organica) tiposAnalise.organica++;
        if (amostra.micronutrientes) tiposAnalise.micronutrientes++;
        if (amostra.enxofre) tiposAnalise.enxofre++;
        if (amostra.prem) tiposAnalise.prem++;
        if (amostra.nitrogenio) tiposAnalise.nitrogenio++;
        if (amostra.granulometria) tiposAnalise.granulometria++;
      });
    });

    // Análise por cultura
    const culturasCount = lotes.reduce((acc: any, lote: any) => {
      lote.amostras.forEach((amostra: any) => {
        if (amostra.cultura) {
          acc[amostra.cultura] = (acc[amostra.cultura] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Análise por localidade
    const localidadesCount = lotes.reduce((acc: any, lote: any) => {
      lote.amostras.forEach((amostra: any) => {
        if (amostra.localidade) {
          acc[amostra.localidade] = (acc[amostra.localidade] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Análise mensal (últimos 12 meses)
    const analiseMensal = lotes.reduce((acc: any, lote: any) => {
      const mes = new Date(lote.dataEntrega).toISOString().substring(0, 7); // YYYY-MM
      acc[mes] = (acc[mes] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      estatisticas: {
        totalLotes,
        totalAmostras,
        totalResultados,
        statusCount,
        tiposAnalise,
        culturasCount,
        localidadesCount,
        analiseMensal
      },
      dados: lotes
    });
  } catch (error) {
    console.error('Erro ao gerar relatório geral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/clientes - Relatório por clientes
router.get('/clientes', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Buscar todos os clientes
    const { query: clientesQuery, params: clientesParams } = SQL_QUERIES.clientes.findAll(1, 1000);
    const clientesResult = await query(clientesQuery, clientesParams);
    const clientes = clientesResult.rows;

    const relatorioClientes = [];

    for (const cliente of clientes) {
      // Buscar lotes do cliente
      const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(cliente.id);
      const lotesResult = await query(lotesQuery, lotesParams);
      let lotes = lotesResult.rows;

      // Aplicar filtros de data
      if (filters.dataInicio) {
        lotes = lotes.filter((lote: any) => new Date(lote.dataEntrega) >= new Date(filters.dataInicio!));
      }
      if (filters.dataFim) {
        lotes = lotes.filter((lote: any) => new Date(lote.dataEntrega) <= new Date(filters.dataFim!));
      }

      // Aplicar filtros de status e módulo
      if (filters.status) {
        lotes = lotes.filter((lote: any) => lote.status === filters.status);
      }
      if (filters.modulo) {
        lotes = lotes.filter((lote: any) => lote.modulo === filters.modulo);
      }

      // Buscar amostras para cada lote
      let totalAmostras = 0;
      let totalResultados = 0;
      const tiposAnalise = {
        rotina: 0,
        organica: 0,
        micronutrientes: 0,
        enxofre: 0,
        prem: 0,
        nitrogenio: 0,
        granulometria: 0
      };

      for (const lote of lotes) {
        const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
        const amostrasResult = await query(amostrasQuery, amostrasParams);
        const amostras = amostrasResult.rows;

        totalAmostras += amostras.length;

        for (const amostra of amostras) {
          // Contar tipos de análise
          if (amostra.rotina) tiposAnalise.rotina++;
          if (amostra.organica) tiposAnalise.organica++;
          if (amostra.micronutrientes) tiposAnalise.micronutrientes++;
          if (amostra.enxofre) tiposAnalise.enxofre++;
          if (amostra.prem) tiposAnalise.prem++;
          if (amostra.nitrogenio) tiposAnalise.nitrogenio++;
          if (amostra.granulometria) tiposAnalise.granulometria++;

          // Contar resultados
          const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
          const resultadosResult = await query(resultadosQuery, resultadosParams);
          totalResultados += resultadosResult.rows.length;
        }
      }

      relatorioClientes.push({
        cliente: {
          id: cliente.id,
          nome: cliente.nome,
          cpf: cliente.cpf,
          email: cliente.email,
          telefone: cliente.telefone,
          cidade: cliente.cidade,
          estado: cliente.estado
        },
        estatisticas: {
          totalLotes: lotes.length,
          totalAmostras,
          totalResultados,
          tiposAnalise
        },
        lotes: lotes.map((lote: any) => ({
          id: lote.id,
          codigo: lote.codigo,
          dataEntrega: lote.dataEntrega,
          status: lote.status,
          modulo: lote.modulo,
          amostrasCount: lote.amostras_count
        }))
      });
    }

    // Ordenar por total de lotes (decrescente)
    relatorioClientes.sort((a: any, b: any) => b.estatisticas.totalLotes - a.estatisticas.totalLotes);

    res.json({
      dados: relatorioClientes,
      total: relatorioClientes.length
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/culturas - Relatório agrupado por cultura
router.get('/culturas', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Buscar todas as amostras
    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findAll(1, 10000);
    const amostrasResult = await query(amostrasQuery, amostrasParams);
    let amostras = amostrasResult.rows;

    // Aplicar filtros básicos
    if (filters.modulo) {
      amostras = amostras.filter((amostra: any) => amostra.modulo === filters.modulo);
    }

    if (filters.cultura) {
      amostras = amostras.filter((amostra: any) => 
        amostra.cultura && amostra.cultura.toLowerCase().includes(filters.cultura!.toLowerCase())
      );
    }

    if (filters.localidade) {
      amostras = amostras.filter((amostra: any) => 
        amostra.localidade && amostra.localidade.toLowerCase().includes(filters.localidade!.toLowerCase())
      );
    }

    // Buscar dados do lote e cliente para cada amostra
    for (const amostra of amostras) {
      const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(amostra.loteId);
      const loteResult = await query(loteQuery, loteParams);
      const lote = loteResult.rows[0];

      if (lote) {
        const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId);
        const clienteResult = await query(clienteQuery, clienteParams);
        const cliente = clienteResult.rows[0];

        amostra.lote = { ...lote, cliente };
      }
    }

    // Aplicar filtros de data e cliente
    if (filters.dataInicio || filters.dataFim || filters.clienteId) {
      amostras = amostras.filter((amostra: any) => {
        if (filters.clienteId && amostra.lote?.clienteId !== filters.clienteId) {
          return false;
        }
        if (filters.dataInicio && amostra.lote?.dataEntrega && new Date(amostra.lote.dataEntrega) < new Date(filters.dataInicio)) {
          return false;
        }
        if (filters.dataFim && amostra.lote?.dataEntrega && new Date(amostra.lote.dataEntrega) > new Date(filters.dataFim)) {
          return false;
        }
        return true;
      });
    }

    // Agrupar por cultura
    const culturasMap = new Map<string, { total: number; concluidas: number; pendentes: number; amostras: any[] }>();

    for (const amostra of amostras) {
      const cultura = amostra.cultura || 'Não informado';
      
      if (!culturasMap.has(cultura)) {
        culturasMap.set(cultura, { total: 0, concluidas: 0, pendentes: 0, amostras: [] });
      }
      
      const culturaData = culturasMap.get(cultura)!;
      culturaData.total++;
      culturaData.amostras.push(amostra);
      
      // Verificar se a amostra está concluída (tem pelo menos um resultado)
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
      const resultadosResult = await query(resultadosQuery, resultadosParams);
      const resultados = resultadosResult.rows;
      
      // Considerar concluída se tem pelo menos um resultado
      const temTodosResultados = resultados.length > 0;
      
      if (temTodosResultados) {
        culturaData.concluidas++;
      } else {
        culturaData.pendentes++;
      }
    }

    // Converter Map para objeto
    const culturas: Record<string, { total: number; concluidas: number; pendentes: number }> = {};
    culturasMap.forEach((value, key) => {
      culturas[key] = {
        total: value.total,
        concluidas: value.concluidas,
        pendentes: value.pendentes
      };
    });

    res.json({
      culturas,
      totalCulturas: culturasMap.size,
      totalAmostras: amostras.length
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por cultura:', error);
    return res.status(500).json({ error: 'Erro ao gerar relatório por cultura' });
  }
});

// GET /api/relatorios/analises - Relatório por tipos de análise
router.get('/analises', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Buscar todas as amostras
    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findAll(1, 10000);
    const amostrasResult = await query(amostrasQuery, amostrasParams);
    let amostras = amostrasResult.rows;

    // Aplicar filtros
    if (filters.modulo) {
      amostras = amostras.filter((amostra: any) => amostra.modulo === filters.modulo);
    }

    if (filters.cultura) {
      amostras = amostras.filter((amostra: any) => 
        amostra.cultura && amostra.cultura.toLowerCase().includes(filters.cultura!.toLowerCase())
      );
    }

    if (filters.localidade) {
      amostras = amostras.filter((amostra: any) => 
        amostra.localidade && amostra.localidade.toLowerCase().includes(filters.localidade!.toLowerCase())
      );
    }

    // Buscar dados do lote e cliente para cada amostra
    for (const amostra of amostras) {
      const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(amostra.loteId);
      const loteResult = await query(loteQuery, loteParams);
      const lote = loteResult.rows[0];

      if (lote) {
        const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId);
        const clienteResult = await query(clienteQuery, clienteParams);
        const cliente = clienteResult.rows[0];

        amostra.lote = { ...lote, cliente };
      }
    }

    // Aplicar filtros de data e cliente
    if (filters.dataInicio || filters.dataFim || filters.clienteId) {
      amostras = amostras.filter((amostra: any) => {
        if (filters.clienteId && amostra.lote.clienteId !== filters.clienteId) {
          return false;
        }
        if (filters.dataInicio && new Date(amostra.lote.dataEntrega) < new Date(filters.dataInicio)) {
          return false;
        }
        if (filters.dataFim && new Date(amostra.lote.dataEntrega) > new Date(filters.dataFim)) {
          return false;
        }
        return true;
      });
    }

    // Contar tipos de análise
    const tiposAnalise = {
      rotina: { total: 0, concluidas: 0, pendentes: 0 },
      organica: { total: 0, concluidas: 0, pendentes: 0 },
      micronutrientes: { total: 0, concluidas: 0, pendentes: 0 },
      enxofre: { total: 0, concluidas: 0, pendentes: 0 },
      prem: { total: 0, concluidas: 0, pendentes: 0 },
      nitrogenio: { total: 0, concluidas: 0, pendentes: 0 },
      granulometria: { total: 0, concluidas: 0, pendentes: 0 }
    };

    for (const amostra of amostras) {
      // Buscar resultados da amostra
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
      const resultadosResult = await query(resultadosQuery, resultadosParams);
      const resultados = resultadosResult.rows;

      const tiposComResultado = resultados.map((r: any) => r.tipo);

      // Contar cada tipo de análise
      if (amostra.rotina) {
        tiposAnalise.rotina.total++;
        if (tiposComResultado.includes('pH') || tiposComResultado.includes('P') || tiposComResultado.includes('Na')) {
          tiposAnalise.rotina.concluidas++;
        } else {
          tiposAnalise.rotina.pendentes++;
        }
      }

      if (amostra.organica) {
        tiposAnalise.organica.total++;
        if (tiposComResultado.includes('MO')) {
          tiposAnalise.organica.concluidas++;
        } else {
          tiposAnalise.organica.pendentes++;
        }
      }

      if (amostra.micronutrientes) {
        tiposAnalise.micronutrientes.total++;
        if (tiposComResultado.includes('Fe') || tiposComResultado.includes('Zn') || tiposComResultado.includes('Cu')) {
          tiposAnalise.micronutrientes.concluidas++;
        } else {
          tiposAnalise.micronutrientes.pendentes++;
        }
      }

      if (amostra.enxofre) {
        tiposAnalise.enxofre.total++;
        if (tiposComResultado.includes('S')) {
          tiposAnalise.enxofre.concluidas++;
        } else {
          tiposAnalise.enxofre.pendentes++;
        }
      }

      if (amostra.prem) {
        tiposAnalise.prem.total++;
        if (tiposComResultado.includes('PREM')) {
          tiposAnalise.prem.concluidas++;
        } else {
          tiposAnalise.prem.pendentes++;
        }
      }

      if (amostra.nitrogenio) {
        tiposAnalise.nitrogenio.total++;
        if (tiposComResultado.includes('N')) {
          tiposAnalise.nitrogenio.concluidas++;
        } else {
          tiposAnalise.nitrogenio.pendentes++;
        }
      }

      if (amostra.granulometria) {
        tiposAnalise.granulometria.total++;
        if (tiposComResultado.includes('GRAN_MASSA_RECIPIENTES') || tiposComResultado.includes('GRAN_MASSA_FATOR_F')) {
          tiposAnalise.granulometria.concluidas++;
        } else {
          tiposAnalise.granulometria.pendentes++;
        }
      }
    }

    res.json({
      tiposAnalise,
      totalAmostras: amostras.length
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de análises:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/produtividade - Relatório de produtividade
router.get('/produtividade', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Buscar todos os lotes
    const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findAll(1, 10000);
    const lotesResult = await query(lotesQuery, lotesParams);
    let lotes = lotesResult.rows;

    // Aplicar filtros
    if (filters.modulo) {
      lotes = lotes.filter((lote: any) => lote.modulo === filters.modulo);
    }

    if (filters.status) {
      lotes = lotes.filter((lote: any) => lote.status === filters.status);
    }

    if (filters.dataInicio) {
      lotes = lotes.filter((lote: any) => new Date(lote.dataEntrega) >= new Date(filters.dataInicio!));
    }

    if (filters.dataFim) {
      lotes = lotes.filter((lote: any) => new Date(lote.dataEntrega) <= new Date(filters.dataFim!));
    }

    // Buscar amostras para cada lote
    for (const lote of lotes) {
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      const amostras = amostrasResult.rows;

      let totalResultados = 0;
      for (const amostra of amostras) {
        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        totalResultados += resultadosResult.rows.length;
      }

      lote.amostras = amostras;
      lote.totalResultados = totalResultados;
    }

    // Calcular métricas de produtividade
    const totalLotes = lotes.length;
    const totalAmostras = lotes.reduce((sum: any, lote: any) => sum + lote.amostras.length, 0);
    const totalResultados = lotes.reduce((sum: any, lote: any) => sum + lote.totalResultados, 0);

    // Tempo médio de processamento (simulado - baseado no status)
    const lotesConcluidos = lotes.filter((lote: any) => lote.status === 'concluido');
    const tempoMedioProcessamento = lotesConcluidos.length > 0 ? 
      lotesConcluidos.reduce((sum: any, lote: any) => {
        const diasProcessamento = Math.floor(Math.random() * 30) + 1; // Simulado
        return sum + diasProcessamento;
      }, 0) / lotesConcluidos.length : 0;

    // Taxa de conclusão
    const taxaConclusao = totalLotes > 0 ? (lotesConcluidos.length / totalLotes) * 100 : 0;

    // Produtividade por período
    const produtividadeMensal = lotes.reduce((acc: any, lote: any) => {
      const mes = new Date(lote.dataEntrega).toISOString().substring(0, 7);
      if (!acc[mes]) {
        acc[mes] = { lotes: 0, amostras: 0, resultados: 0 };
      }
      acc[mes].lotes++;
      acc[mes].amostras += lote.amostras.length;
      acc[mes].resultados += lote.totalResultados;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      metricas: {
        totalLotes,
        totalAmostras,
        totalResultados,
        tempoMedioProcessamento: Math.round(tempoMedioProcessamento),
        taxaConclusao: Math.round(taxaConclusao * 100) / 100
      },
      produtividadeMensal,
      dados: lotes.map((lote: any) => ({
        id: lote.id,
        codigo: lote.codigo,
        dataEntrega: lote.dataEntrega,
        status: lote.status,
        modulo: lote.modulo,
        totalAmostras: lote.amostras.length,
        totalResultados: lote.totalResultados,
        cliente: lote.cliente_nome
      }))
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de produtividade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/gerados - Listar relatórios gerados
router.get('/gerados', async (req, res): Promise<any> => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const { query: relatoriosQuery, params: relatoriosParams } = SQL_QUERIES.relatorios.findAll(pageNum, limitNum);
    const relatoriosResult = await query(relatoriosQuery, relatoriosParams);
    const relatorios = relatoriosResult.rows;

    res.json({
      data: relatorios,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: relatorios.length,
        pages: Math.ceil(relatorios.length / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar relatórios gerados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/relatorios/gerados - Salvar relatório gerado
router.post('/gerados', async (req, res): Promise<any> => {
  try {
    const { tipo, nome, filtros, dados, arquivoUrl } = req.body;

    if (!tipo || !nome || !dados) {
      return res.status(400).json({ error: 'Tipo, nome e dados são obrigatórios' });
    }

    const { query: createQuery, params: createParams } = SQL_QUERIES.relatorios.create({
      tipo,
      nome,
      filtros,
      dados,
      arquivoUrl
    });

    const result = await query(createQuery, createParams);
    const relatorio = result.rows[0];

    res.status(201).json(relatorio);
  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/relatorios/gerados/:id - Deletar relatório gerado
router.delete('/gerados/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.relatorios.delete(id);
    await query(deleteQuery, deleteParams);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar relatório:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/dashboard - Dashboard com estatísticas gerais
router.get('/dashboard', async (req, res): Promise<any> => {
  try {
    const { modulo } = req.query;

    // Estatísticas de amostras
    let amostrasQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidas,
        COUNT(CASE WHEN pago = true THEN 1 END) as pagas
      FROM amostras
    `;
    const amostrasParams: any[] = [];

    if (modulo) {
      amostrasQuery += ` WHERE modulo = $1`;
      amostrasParams.push(modulo);
    }

    const amostrasResult = await query(amostrasQuery, amostrasParams);
    const amostrasStats = amostrasResult.rows[0];

    // Estatísticas de lotes
    let lotesQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'em_analise' THEN 1 END) as em_analise,
        COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidos,
        COUNT(CASE WHEN pago = true THEN 1 END) as pagos
      FROM lotes_amostras
    `;
    const lotesParams: any[] = [];

    if (modulo) {
      lotesQuery += ` WHERE modulo = $1`;
      lotesParams.push(modulo);
    }

    const lotesResult = await query(lotesQuery, lotesParams);
    const lotesStats = lotesResult.rows[0];

    // Estatísticas de clientes
    const clientesQuery = `SELECT COUNT(*) as total FROM clientes`;
    const clientesResult = await query(clientesQuery);
    const clientesStats = clientesResult.rows[0];

    // Amostras por mês (últimos 6 meses)
    let amostrasPorMesQuery = `
      SELECT 
        DATE_TRUNC('month', "createdAt") as mes,
        COUNT(*) as quantidade
      FROM amostras
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
    `;
    const amostrasPorMesParams: any[] = [];

    if (modulo) {
      amostrasPorMesQuery += ` AND modulo = $1`;
      amostrasPorMesParams.push(modulo);
    }

    amostrasPorMesQuery += ` GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY mes DESC`;

    const amostrasPorMesResult = await query(amostrasPorMesQuery, amostrasPorMesParams);
    const amostrasPorMes = amostrasPorMesResult.rows;

    // Top 5 culturas
    let culturasQuery = `
      SELECT 
        cultura,
        COUNT(*) as quantidade
      FROM amostras
      WHERE cultura IS NOT NULL AND cultura != ''
    `;
    const culturasParams: any[] = [];

    if (modulo) {
      culturasQuery += ` AND modulo = $1`;
      culturasParams.push(modulo);
    }

    culturasQuery += ` GROUP BY cultura ORDER BY quantidade DESC LIMIT 5`;

    const culturasResult = await query(culturasQuery, culturasParams);
    const topCulturas = culturasResult.rows;

    res.json({
      totais: {
        clientes: parseInt(clientesStats.total),
        lotes: parseInt(lotesStats.total),
        amostras: parseInt(amostrasStats.total),
        resultados: parseInt(amostrasStats.total) // Assumindo que cada amostra tem resultados
      },
      status: {
        pendentes: parseInt(amostrasStats.pendentes),
        emAnalise: parseInt(amostrasStats.em_analise),
        concluidas: parseInt(amostrasStats.concluidas)
      },
      amostras: {
        total: parseInt(amostrasStats.total),
        pendentes: parseInt(amostrasStats.pendentes),
        em_analise: parseInt(amostrasStats.em_analise),
        concluidas: parseInt(amostrasStats.concluidas),
        pagas: parseInt(amostrasStats.pagas)
      },
      lotes: {
        total: parseInt(lotesStats.total),
        pendentes: parseInt(lotesStats.pendentes),
        em_analise: parseInt(lotesStats.em_analise),
        concluidos: parseInt(lotesStats.concluidos),
        pagos: parseInt(lotesStats.pagos)
      },
      clientes: {
        total: parseInt(clientesStats.total)
      },
      amostrasPorMes,
      topCulturas
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/financeiro - Relatório financeiro
router.get('/financeiro', async (req, res): Promise<any> => {
  try {
    const { modulo } = req.query;

    // Buscar dados de lotes com informações de pagamento
    let lotesQuery = `
      SELECT 
        la.id,
        la.codigo,
        la.status,
        la.pago,
        la.desconto,
        la."dataEntrega",
        la."createdAt",
        la.rotina,
        la.organica,
        la.micronutrientes,
        la.enxofre,
        la.prem,
        la.nitrogenio,
        la.granulometria,
        la.foliar,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        COUNT(a.id) as total_amostras,
        COUNT(r.id) as total_resultados
      FROM lotes_amostras la
      LEFT JOIN clientes c ON la."clienteId" = c.id
      LEFT JOIN amostras a ON la.id = a."loteId"
      LEFT JOIN resultados r ON a.id = r."amostraId"
    `;
    
    const params: any[] = [];
    
    if (modulo) {
      lotesQuery += ` WHERE la.modulo = $1`;
      params.push(modulo);
    }
    
    lotesQuery += ` GROUP BY la.id, la.codigo, la.status, la.pago, la.desconto, la."dataEntrega", la."createdAt", la.rotina, la.organica, la.micronutrientes, la.enxofre, la.prem, la.nitrogenio, la.granulometria, la.foliar, c.nome, c.cpf ORDER BY la."createdAt" DESC`;
    
    const lotesResult = await query(lotesQuery, params);
    const lotes = lotesResult.rows;

    // Buscar amostras e calcular valores após processar lotes

    const dadosFinanceiros = await Promise.all(lotes.map(async lote => {
      // Buscar amostras do lote para calcular valor baseado em cada amostra
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      const amostras = amostrasResult.rows;
      
      // Calcular valor baseado nas amostras individuais
      let valorBase = 0;
      
      // Determinar tipo de análise baseado nas amostras (solo ou foliar)
      const tipoAnalise = amostras.length > 0 ? amostras[0].modulo : 'solo';
      
      // Usar valores corretos baseados no tipo de análise
      const valoresAnalise = tipoAnalise === 'foliar' ? {
        rotina: 15,
        organica: 0,       // Não usado em foliar
        micronutrientes: 15,
        enxofre: 15,
        prem: 0,           // Não usado em foliar
        nitrogenio: 15,
        granulometria: 0,  // Não usado em foliar
        foliar: 0
      } : {
        rotina: 15,
        organica: 10,
        micronutrientes: 20,
        enxofre: 10,
        prem: 12,
        nitrogenio: 10,
        granulometria: 30,
        foliar: 0
      };
      
      // Calcular valor para cada amostra
      amostras.forEach(amostra => {
        if (amostra.rotina) valorBase += valoresAnalise.rotina;
        if (amostra.organica) valorBase += valoresAnalise.organica;
        if (amostra.micronutrientes) valorBase += valoresAnalise.micronutrientes;
        if (amostra.enxofre) valorBase += valoresAnalise.enxofre;
        if (amostra.prem) valorBase += valoresAnalise.prem;
        if (amostra.nitrogenio) valorBase += valoresAnalise.nitrogenio;
        if (amostra.granulometria) valorBase += valoresAnalise.granulometria;
        if (amostra.foliar) valorBase += valoresAnalise.foliar;
      });
      
      // Aplicar desconto
      const desconto = parseFloat(lote.desconto) || 0;
      const valorComDesconto = valorBase * (1 - desconto / 100);
      
      // Determinar status financeiro
      let statusFinanceiro = 'pendente';
      if (lote.pago) {
        statusFinanceiro = 'pago';
      } else {
        statusFinanceiro = 'pendente';
      }
      
      return {
        id: lote.id,
        codigo: lote.codigo,
        cliente: lote.cliente_nome,
        cpf: lote.cliente_cpf,
        dataEntrega: lote.dataEntrega,
        status: lote.status,
        pago: lote.pago,
        desconto: desconto,
        valorBase: valorBase,
        valorFinal: valorComDesconto,
        statusFinanceiro: statusFinanceiro,
        totalAmostras: parseInt(lote.total_amostras),
        totalResultados: parseInt(lote.total_resultados)
      };
    }));
    
    // Calcular totais após processar todos os dados
    const totalFaturado = dadosFinanceiros.reduce((sum, lote) => sum + lote.valorFinal, 0);
    const totalPago = dadosFinanceiros.filter(l => l.pago).reduce((sum, lote) => sum + lote.valorFinal, 0);
    const totalPendente = dadosFinanceiros.filter(l => !l.pago).reduce((sum, lote) => sum + lote.valorFinal, 0);
    
    // Calcular estatísticas
    const estatisticas = {
      totalFaturado: totalFaturado,
      totalPago: totalPago,
      totalPendente: totalPendente,
      totalLotes: lotes.length,
      lotesPagos: lotes.filter(l => l.pago).length,
      lotesPendentes: lotes.filter(l => !l.pago).length,
      valorMedioPorLote: lotes.length > 0 ? totalFaturado / lotes.length : 0
    };

    res.json({
      estatisticas,
      dados: dadosFinanceiros
    });

  } catch (error) {
    console.error('Erro ao buscar relatório financeiro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/relatorios/completo - Relatório completo com todas as amostras e resultados calculados
router.get('/completo', async (req, res): Promise<any> => {
  try {
    const filters = relatorioFiltersSchema.parse(req.query);
    
    // Buscar todas as amostras com filtros
    let amostrasQuery = `
      SELECT 
        a.*,
        l.codigo as lote_codigo,
        l.modulo as lote_modulo,
        l."dataEntrega" as lote_data_entrega,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf
      FROM amostras a
      JOIN lotes_amostras l ON a."loteId" = l.id
      JOIN clientes c ON l."clienteId" = c.id
      WHERE 1=1
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Filtros
    if (filters.modulo) {
      paramCount++;
      conditions.push(`l.modulo = $${paramCount}`);
      params.push(filters.modulo);
    }

    if (filters.localidade) {
      paramCount++;
      conditions.push(`a.localidade ILIKE $${paramCount}`);
      params.push(`%${filters.localidade}%`);
    }

    if (filters.cultura) {
      paramCount++;
      conditions.push(`a.cultura ILIKE $${paramCount}`);
      params.push(`%${filters.cultura}%`);
    }

    if (filters.dataInicio) {
      paramCount++;
      conditions.push(`l."dataEntrega" >= $${paramCount}`);
      params.push(filters.dataInicio);
    }

    if (filters.dataFim) {
      paramCount++;
      conditions.push(`l."dataEntrega" <= $${paramCount}`);
      params.push(filters.dataFim);
    }

    if (conditions.length > 0) {
      amostrasQuery += ` AND ${conditions.join(' AND ')}`;
    }

    amostrasQuery += ` ORDER BY a."createdAt" DESC`;

    const amostrasResult = await query(amostrasQuery, params);
    const amostras = amostrasResult.rows;

    // Para cada amostra, buscar resultados e calcular
    const dadosCompletos = await Promise.all(
      amostras.map(async (amostra: any) => {
        // Buscar resultados brutos da amostra
        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        const resultadosBrutos = resultadosResult.rows;

        // Determinar módulo (solo ou foliar)
        const modulo = amostra.lote_modulo || amostra.modulo || 'solo';
        
        // Calcular resultados finais
        const resultadosCalculados = modulo === 'foliar' 
          ? calcularResultadosFoliar(resultadosBrutos)
          : calcularResultados(prepararDadosBrutos(resultadosBrutos));

        // Formatar data
        const dataFormatada = amostra.dataColeta 
          ? new Date(amostra.dataColeta).toLocaleDateString('pt-BR')
          : amostra.lote_data_entrega
          ? new Date(amostra.lote_data_entrega).toLocaleDateString('pt-BR')
          : '';

        return {
          codigo: amostra.codigo || '',
          cultura: amostra.cultura || '',
          localidade: amostra.localidade || '',
          data: dataFormatada,
          cliente: amostra.cliente_nome || '',
          lote: amostra.lote_codigo || '',
          modulo: modulo,
          // Resultados calculados
          ph: resultadosCalculados.ph !== undefined ? resultadosCalculados.ph.toFixed(2) : '',
          p: resultadosCalculados.p !== undefined ? resultadosCalculados.p.toFixed(2) : '',
          na: resultadosCalculados.na !== undefined ? resultadosCalculados.na.toFixed(2) : '',
          k: resultadosCalculados.k !== undefined ? resultadosCalculados.k.toFixed(2) : '',
          ca: resultadosCalculados.ca !== undefined ? resultadosCalculados.ca.toFixed(2) : '',
          mg: resultadosCalculados.mg !== undefined ? resultadosCalculados.mg.toFixed(2) : '',
          al: resultadosCalculados.al !== undefined ? resultadosCalculados.al.toFixed(2) : '',
          h_al: resultadosCalculados.h_al !== undefined ? resultadosCalculados.h_al.toFixed(2) : '',
          sb: resultadosCalculados.sb !== undefined ? resultadosCalculados.sb.toFixed(2) : '',
          t: resultadosCalculados.t !== undefined ? resultadosCalculados.t.toFixed(2) : '',
          ctc: resultadosCalculados.ctc !== undefined ? resultadosCalculados.ctc.toFixed(2) : '',
          v: resultadosCalculados.v !== undefined ? resultadosCalculados.v.toFixed(2) : '',
          m: resultadosCalculados.m !== undefined ? resultadosCalculados.m.toFixed(2) : '',
          fe: resultadosCalculados.fe !== undefined ? resultadosCalculados.fe.toFixed(4) : '',
          cu: resultadosCalculados.cu !== undefined ? resultadosCalculados.cu.toFixed(4) : '',
          zn: resultadosCalculados.zn !== undefined ? resultadosCalculados.zn.toFixed(4) : '',
          mn: resultadosCalculados.mn !== undefined ? resultadosCalculados.mn.toFixed(4) : '',
          b: resultadosCalculados.b !== undefined ? resultadosCalculados.b.toFixed(4) : '',
          s: resultadosCalculados.s !== undefined ? resultadosCalculados.s.toFixed(2) : '',
          mo: resultadosCalculados.mo !== undefined ? resultadosCalculados.mo.toFixed(2) : '',
          prem: resultadosCalculados.prem !== undefined ? resultadosCalculados.prem.toFixed(2) : '',
          n: resultadosCalculados.n !== undefined ? resultadosCalculados.n.toFixed(2) : '', // Para foliar
        };
      })
    );

    res.json({
      dados: dadosCompletos,
      total: dadosCompletos.length,
      modulo: filters.modulo || 'todos'
    });

  } catch (error) {
    console.error('Erro ao gerar relatório completo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;