import { Router } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { authenticateToken, authorizeRoles } from './auth';
import { limparCacheValores } from '../utils/valoresAnalise';

const router = Router();

router.use(authenticateToken);

// Schema para validação
const updateValorSchema = z.object({
  modulo: z.enum(['solo', 'foliar']),
  tipo: z.string(),
  valor: z.number().min(0)
});

// GET /api/valores-analise - Buscar todos os valores
router.get('/', async (req, res): Promise<any> => {
  try {
    const { query: valoresQuery, params } = SQL_QUERIES.valoresAnalise.findAll();
    const result = await query(valoresQuery, params);
    
    // Organizar por módulo
    const valoresPorModulo: any = {
      solo: {},
      foliar: {}
    };
    
    result.rows.forEach((row: any) => {
      valoresPorModulo[row.modulo][row.tipo] = row.valor;
    });
    
    res.json(valoresPorModulo);
  } catch (error) {
    console.error('Erro ao buscar valores de análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/valores-analise/:modulo - Buscar valores por módulo
router.get('/:modulo', async (req, res): Promise<any> => {
  try {
    const { modulo } = req.params;
    
    if (modulo !== 'solo' && modulo !== 'foliar') {
      return res.status(400).json({ error: 'Módulo inválido. Use "solo" ou "foliar"' });
    }
    
    const { query: valoresQuery, params } = SQL_QUERIES.valoresAnalise.findByModulo(modulo);
    const result = await query(valoresQuery, params);
    
    // Converter para objeto chave-valor
    const valores: any = {};
    result.rows.forEach((row: any) => {
      valores[row.tipo] = row.valor;
    });
    
    res.json(valores);
  } catch (error) {
    console.error('Erro ao buscar valores de análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/valores-analise - Atualizar valor (apenas admin)
router.put('/', authorizeRoles('admin'), async (req, res): Promise<any> => {
  try {
    const data = updateValorSchema.parse(req.body);
    
    const { query: updateQuery, params } = SQL_QUERIES.valoresAnalise.upsert(
      data.modulo,
      data.tipo,
      data.valor
    );
    
    const result = await query(updateQuery, params);
    
    // Limpar cache para forçar atualização
    limparCacheValores();
    
    res.json({
      success: true,
      valor: result.rows[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
    }
    console.error('Erro ao atualizar valor de análise:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

