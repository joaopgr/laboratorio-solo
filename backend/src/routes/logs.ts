import { Router } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { authenticateToken, authorizeRoles } from './auth';

const router = Router();

// Schema para filtros de logs
const logsFiltersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  usuarioId: z.string().optional(),
  acao: z.string().optional(),
  entidade: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

// GET /api/logs - Listar logs
router.get('/', authenticateToken, authorizeRoles('admin', 'funcionario', 'estagiario'), async (req, res): Promise<any> => {
  try {
    const filters = logsFiltersSchema.parse(req.query);
    
    const page = parseInt(filters.page || '1');
    const limit = parseInt(filters.limit || '50');
    
    const logsFilters: any = {};
    if (filters.usuarioId) logsFilters.usuarioId = filters.usuarioId;
    if (filters.acao) logsFilters.acao = filters.acao;
    if (filters.entidade) logsFilters.entidade = filters.entidade;
    if (filters.dataInicio) logsFilters.dataInicio = filters.dataInicio;
    if (filters.dataFim) logsFilters.dataFim = filters.dataFim;
    
    const { query: logsQuery, params: logsParams } = SQL_QUERIES.logs.findAll(page, limit, logsFilters);
    const { query: countQuery, params: countParams } = SQL_QUERIES.logs.count(logsFilters);
    
    const [logsResult, countResult] = await Promise.all([
      query(logsQuery, logsParams),
      query(countQuery, countParams)
    ]);
    
    const logs = logsResult.rows.map((log: any) => ({
      ...log,
      detalhes: log.detalhes ? JSON.parse(log.detalhes) : null
    }));
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao buscar logs:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

