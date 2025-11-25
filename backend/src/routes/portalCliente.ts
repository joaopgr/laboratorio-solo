import { Router } from 'express';
import { authenticateToken, authorizeRoles } from './auth';
import { SQL_QUERIES } from '../database/queries';
import { query } from '../database/connection';
import { calcularResultados, prepararDadosBrutos, calcularResultadosFoliar } from '../utils/calculosResultados';

const router = Router();

const UNIDADES_CALCULADAS: Record<string, string> = {
  PH: '',
  P: 'mg/dm³',
  NA: 'cmolc/dm³',
  K: 'cmolc/dm³',
  CA: 'cmolc/dm³',
  MG: 'cmolc/dm³',
  AL: 'cmolc/dm³',
  H_AL: 'cmolc/dm³',
  SB: 'cmolc/dm³',
  T: 'cmolc/dm³',
  CTC: 'cmolc/dm³',
  V: '%',
  M: '%',
  MO: 'g/kg',
  FE: 'mg/dm³',
  CU: 'mg/dm³',
  ZN: 'mg/dm³',
  MN: 'mg/dm³',
};

function inferirUnidade(tipo: string): string | null {
  return UNIDADES_CALCULADAS[tipo.toUpperCase()] ?? null;
}

router.use(authenticateToken);
router.use(authorizeRoles('cliente'));

router.get('/perfil', async (req: any, res) => {
  try {
    const clienteId = req.user?.clienteId;

    if (!clienteId) {
      return res.status(400).json({ error: 'Token inválido para cliente' });
    }

    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(clienteId);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const clientePayload = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      email: cliente.email,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      estado: cliente.estado,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };

    const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(clienteId);
    const lotesResult = await query(lotesQuery, lotesParams);

    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByCliente(clienteId);
    const amostrasResult = await query(amostrasQuery, amostrasParams);

    let totalResultados = 0;
    try {
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.countByCliente(clienteId);
      const resultadosResult = await query(resultadosQuery, resultadosParams);
      totalResultados = parseInt(resultadosResult.rows[0]?.total ?? '0', 10);
    } catch (error) {
      console.error('Erro ao contar resultados do cliente:', error);
    }

    return res.json({
      cliente: clientePayload,
      resumo: {
        totalLotes: lotesResult.rows.length,
        totalAmostras: amostrasResult.rows.length,
        totalResultados,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/lotes', async (req: any, res) => {
  try {
    const clienteId = req.user?.clienteId;

    if (!clienteId) {
      return res.status(400).json({ error: 'Token inválido para cliente' });
    }

    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(clienteId);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const clientePayload = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      email: cliente.email,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      estado: cliente.estado,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };

    const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(clienteId);
    const lotesResult = await query(lotesQuery, lotesParams);
    const lotes = lotesResult.rows;

    for (const lote of lotes) {
      lote.cliente = clientePayload;

      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      const amostras = amostrasResult.rows;

      lote.amostras = await Promise.all(
        amostras.map(async (amostra) => {
          const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
          const resultadosResult = await query(resultadosQuery, resultadosParams);
          const resultadosBrutos = resultadosResult.rows;

          try {
            // Detectar módulo da amostra ou lote
            const moduloAmostra = amostra.modulo || amostra.tipoAnalise || lote.modulo || lote.tipoAnalise || 'solo'
            
            // Usar função correta baseada no módulo
            let calculados: any = {}
            if (moduloAmostra === 'foliar') {
              calculados = calcularResultadosFoliar(resultadosBrutos)
            } else {
              const dadosBrutos = prepararDadosBrutos(resultadosBrutos)
              calculados = calcularResultados(dadosBrutos)
            }

            const resultadosCalculados = Object.entries(calculados)
              .filter(([, valor]) => valor !== undefined && !Number.isNaN(valor))
              .map(([tipo, valor]) => ({
                id: `${amostra.id}-${tipo}-calculado`,
                amostraId: amostra.id,
                categoria: resultadosBrutos[0]?.categoria ?? moduloAmostra,
                tipo: tipo.toUpperCase(),
                valor: valor?.toString() ?? null,
                unidade: inferirUnidade(tipo),
                origem: 'calculado',
              }));

            return {
              ...amostra,
              resultados: resultadosCalculados,
            };
          } catch (erroCalculo) {
            console.error('Erro ao calcular resultados da amostra', amostra.id, erroCalculo);
            return {
              ...amostra,
              resultados: [],
            };
          }
        })
      );
    }

    return res.json(lotes);
  } catch (error) {
    console.error('Erro ao buscar lotes do cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/lotes/:loteId', async (req: any, res) => {
  try {
    const clienteId = req.user?.clienteId;
    const { loteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({ error: 'Token inválido para cliente' });
    }

    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(loteId);
    const loteResult = await query(loteQuery, loteParams);
    const lote = loteResult.rows[0];

    if (!lote || lote.clienteId !== clienteId) {
      return res.status(404).json({ error: 'Lote não encontrado' });
    }

    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(clienteId);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const clientePayload = {
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf,
      email: cliente.email,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      estado: cliente.estado,
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    };

    lote.cliente = clientePayload;

    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(loteId);
    const amostrasResult = await query(amostrasQuery, amostrasParams);
    const amostras = amostrasResult.rows;

    lote.amostras = await Promise.all(
      amostras.map(async (amostra) => {
        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        const resultadosBrutos = resultadosResult.rows;

        try {
          const dadosBrutos = prepararDadosBrutos(resultadosBrutos);
          const calculados = calcularResultados(dadosBrutos);

          const resultadosCalculados = Object.entries(calculados)
            .filter(([, valor]) => valor !== undefined && !Number.isNaN(valor))
            .map(([tipo, valor]) => ({
              id: `${amostra.id}-${tipo}-calculado`,
              amostraId: amostra.id,
              categoria: resultadosBrutos[0]?.categoria ?? 'solo',
              tipo: tipo.toUpperCase(),
              valor: valor?.toString() ?? null,
              unidade: inferirUnidade(tipo),
              origem: 'calculado',
            }));

          return {
            ...amostra,
            resultados: resultadosCalculados,
          };
        } catch (erroCalculo) {
          console.error('Erro ao calcular resultados da amostra', amostra.id, erroCalculo);
          return {
            ...amostra,
            resultados: [],
          };
        }
      })
    );

    return res.json(lote);
  } catch (error) {
    console.error('Erro ao buscar detalhes do lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

