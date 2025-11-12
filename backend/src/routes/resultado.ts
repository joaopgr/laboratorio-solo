import express from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { verificarAmostraCompleta, determinarStatusAmostra, verificarLoteCompleto } from '../utils/statusUtils';
import { authenticateToken, authorizeRoles } from './auth';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('admin', 'analista', 'visualizador'));

// Função para converter vírgula em ponto para números
function normalizeNumber(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') return undefined;
  return value.replace(',', '.');
}

// Schema base para resultados
const resultadoBaseSchema = z.object({
  amostraId: z.string().min(1, 'ID da amostra é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  categoria: z.enum(['solo', 'foliar']).default('solo'),
  valor: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val.toString() : val;
  }),
  unidade: z.string().optional(),
  diluicao: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val.toString() : val;
  }),
  massa: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  branco: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  al: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  h_al: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  param_a: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  param_b: z.union([z.string(), z.number()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val.replace(',', '.')) : undefined;
  }),
  dataAnalise: z.union([z.string().datetime(), z.string()]).optional().transform(val => {
    if (!val || val === '' || val === null || val === undefined) return undefined;
    // Se já está no formato ISO, retornar como está
    if (val.includes('T') && val.includes('Z')) return val;
    // Se está no formato YYYY-MM-DD, converter para ISO
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return `${val}T12:00:00.000Z`;
    // Tentar validar como datetime
    try {
      new Date(val);
      return val;
    } catch {
      return undefined;
    }
  }),
  observacoes: z.string().optional(),
  // Campos granulométricos
  massaRecipienteAreiaGrossa: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipienteAreiaFina: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipienteSilteArgila: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipienteArgila: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipientePartAreiaGrossa: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipientePartAreiaFina: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipientePartSilteArgila: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaRecipientePartArgila: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campo TFSA
  tfsa: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos de análise química
  ph: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  pAbs: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  naMgL: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  kMgL: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  alCmol: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  hAl: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  s: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  mo: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos foliares
  caMgLFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  mgMgLFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  kMgLFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  pAbsFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  sAbsFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Micronutrientes
  fe: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  zn: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  cu: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  mn: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  b: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos da Determinação F
  massaTrisR1: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaTrisR2: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaTrisR3: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  volumeTitR1: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  volumeTitR2: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  volumeTitR3: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos do Nitrogênio
  massaN: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  volumeN: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  brancoN: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  fatorF: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos do Boro foliar
  massaBFoliar: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  dilB: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  brancoB: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  // Campos granulométricos - massa para o fator F
  massaLata: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaLataSu: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
  massaLataSs: z.union([z.number(), z.string()]).optional().transform(val => {
    if (val === '' || val === null || val === undefined) return undefined;
    return typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  }),
});

const createResultadoSchema = resultadoBaseSchema;
const updateResultadoSchema = resultadoBaseSchema.partial().omit({ amostraId: true });

// GET /api/resultados - Listar resultados
router.get('/', async (req, res): Promise<any> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      amostraId,
      tipo,
      categoria
    } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Construir query base
    let baseQuery = `
      SELECT r.*, 
             a.codigo as amostra_codigo, 
             a.identificacao as amostra_identificacao, 
             a.cultura as amostra_cultura,
             c.nome as cliente_nome,
             c.cpf as cliente_cpf
      FROM resultados r
      JOIN amostras a ON r."amostraId" = a.id
      JOIN lotes_amostras l ON a."loteId" = l.id
      JOIN clientes c ON l."clienteId" = c.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Filtros
    if (amostraId) {
      paramCount++;
      // Se amostraId contém vírgula, é múltiplos IDs
      const amostraIdStr = String(amostraId);
      if (amostraIdStr.includes(',')) {
        const ids = amostraIdStr.split(',').filter((id: string) => id.trim());
        conditions.push(`r."amostraId" = ANY($${paramCount})`);
        params.push(ids);
      } else {
        conditions.push(`r."amostraId" = $${paramCount}`);
        params.push(amostraIdStr);
      }
    }

    if (tipo) {
      paramCount++;
      conditions.push(`r.tipo = $${paramCount}`);
      params.push(tipo);
    }

    if (categoria) {
      paramCount++;
      conditions.push(`r.categoria = $${paramCount}`);
      params.push(categoria);
    }

    // Adicionar condições à query
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenação
    baseQuery += ` ORDER BY r."createdAt" DESC`;

    // Buscar total para paginação
    const countQuery = baseQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY[\s\S]*$/, '');
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Aplicar paginação
    paramCount++;
    baseQuery += ` LIMIT $${paramCount}`;
    params.push(limitNum);
    
    paramCount++;
    baseQuery += ` OFFSET $${paramCount}`;
    params.push(offset);

    // Executar query principal
    const resultadosResult = await query(baseQuery, params);
    const resultados = resultadosResult.rows;

    res.json({
      resultados: resultados,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/resultados/:id - Buscar resultado por ID
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    
    const { query: resultadoQuery, params } = SQL_QUERIES.resultados.findById(id);
    const result = await query(resultadoQuery, params);
    const resultado = result.rows[0];

    if (!resultado) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar resultado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/resultados - Criar novo resultado
router.post('/', async (req, res): Promise<any> => {
  try {
    // Log para debug (remover depois)
    console.log('📥 Dados recebidos no POST /resultados:', JSON.stringify(req.body, null, 2));
    const data = createResultadoSchema.parse(req.body);
    console.log('✅ Dados validados com sucesso');
    
    // Verificar se amostra existe
    const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(data.amostraId);
    const amostraResult = await query(amostraQuery, amostraParams);
    
    if (!amostraResult.rows[0]) {
      return res.status(400).json({ error: 'Amostra não encontrada' });
    }

    // Criar resultado
    const { query: createQuery, params: createParams } = SQL_QUERIES.resultados.create(data);
    const result = await query(createQuery, createParams);
    const resultado = result.rows[0];

    // Atualizar status da amostra
    const statusAtualizado = await determinarStatusAmostra(data.amostraId);
    const { query: updateStatusQuery, params: updateStatusParams } = SQL_QUERIES.amostras.update(data.amostraId, { status: statusAtualizado });
    await query(updateStatusQuery, updateStatusParams);

    // Atualizar status do lote se a amostra estiver em um lote
    if (amostraResult.rows[0].loteId) {
      const loteCompleto = await verificarLoteCompleto(amostraResult.rows[0].loteId);
      const novoStatusLote = loteCompleto ? 'concluido' : 'em_analise';
      const { query: loteUpdateQuery, params: loteUpdateParams } = SQL_QUERIES.lotes.update(amostraResult.rows[0].loteId, { status: novoStatusLote });
      await query(loteUpdateQuery, loteUpdateParams);
    }

    res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro de validação Zod:');
      console.error('Erros detalhados:', JSON.stringify(error.errors, null, 2));
      console.error('Dados recebidos:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      });
    }
    
    console.error('Erro ao criar resultado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/resultados/:id - Atualizar resultado
router.put('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const data = updateResultadoSchema.parse(req.body);
    
    // Verificar se resultado existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.resultados.findById(id);
    const checkResult = await query(checkQuery, checkParams);

    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    // Atualizar resultado
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.resultados.update(id, data);
    const result = await query(updateQuery, updateParams);
    const resultado = result.rows[0];

    // Atualizar status da amostra
    const amostraId = checkResult.rows[0].amostraId;
    const statusAtualizado = await determinarStatusAmostra(amostraId);
    const { query: updateStatusQuery, params: updateStatusParams } = SQL_QUERIES.amostras.update(amostraId, { status: statusAtualizado });
    await query(updateStatusQuery, updateStatusParams);

    // Buscar o lote da amostra para atualizar seu status também
    const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(amostraId);
    const amostraResult = await query(amostraQuery, amostraParams);
    if (amostraResult.rows[0]?.loteId) {
      const loteCompleto = await verificarLoteCompleto(amostraResult.rows[0].loteId);
      const novoStatusLote = loteCompleto ? 'concluido' : 'em_analise';
      const { query: loteUpdateQuery, params: loteUpdateParams } = SQL_QUERIES.lotes.update(amostraResult.rows[0].loteId, { status: novoStatusLote });
      await query(loteUpdateQuery, loteUpdateParams);
    }

    res.json(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao atualizar resultado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/resultados/:id - Deletar resultado
router.delete('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    
    // Verificar se resultado existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.resultados.findById(id);
    const checkResult = await query(checkQuery, checkParams);

    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Resultado não encontrado' });
    }

    const amostraId = checkResult.rows[0].amostraId;

    // Deletar resultado
    const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.resultados.delete(id);
    await query(deleteQuery, deleteParams);

    // Atualizar status da amostra
    const statusAtualizado = await determinarStatusAmostra(amostraId);
    const { query: updateStatusQuery, params: updateStatusParams } = SQL_QUERIES.amostras.update(amostraId, { status: statusAtualizado });
    await query(updateStatusQuery, updateStatusParams);

    // Buscar o lote da amostra para atualizar seu status também
    const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(amostraId);
    const amostraResult = await query(amostraQuery, amostraParams);
    if (amostraResult.rows[0]?.loteId) {
      const loteCompleto = await verificarLoteCompleto(amostraResult.rows[0].loteId);
      const novoStatusLote = loteCompleto ? 'concluido' : 'em_analise';
      const { query: loteUpdateQuery, params: loteUpdateParams } = SQL_QUERIES.lotes.update(amostraResult.rows[0].loteId, { status: novoStatusLote });
      await query(loteUpdateQuery, loteUpdateParams);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar resultado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/resultados/lote - Criar múltiplos resultados (alias para /batch)
router.post('/lote', async (req, res): Promise<any> => {
  try {
    const { resultados } = req.body;

    if (!Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({ error: 'Lista de resultados é obrigatória' });
    }

    const resultadosCriados = [];
    const amostrasAfetadas = new Set<string>();

    for (const data of resultados) {
      const validatedData = createResultadoSchema.parse(data);

      // Verificar se amostra existe
      const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(validatedData.amostraId);
      const amostraResult = await query(amostraQuery, amostraParams);
      
      if (!amostraResult.rows[0]) {
        return res.status(400).json({ error: `Amostra ${validatedData.amostraId} não encontrada` });
      }

      // Upsert: se já existir resultado para mesmo (amostraId, tipo, categoria), atualizar em vez de criar
      const checkExisting = await query(
        'SELECT id FROM resultados WHERE "amostraId" = $1 AND tipo = $2 AND categoria = $3 ORDER BY "createdAt" DESC LIMIT 1',
        [validatedData.amostraId, validatedData.tipo, validatedData.categoria]
      );

      let resultado;
      if (checkExisting.rows[0]?.id) {
        const existingId = checkExisting.rows[0].id as string;
        const { query: updateQuery, params: updateParams } = SQL_QUERIES.resultados.update(existingId, validatedData);
        const upd = await query(updateQuery, updateParams);
        resultado = upd.rows[0];
      } else {
        const { query: createQuery, params: createParams } = SQL_QUERIES.resultados.create(validatedData);
        const ins = await query(createQuery, createParams);
        resultado = ins.rows[0];
      }

      resultadosCriados.push(resultado);
      amostrasAfetadas.add(validatedData.amostraId);
    }

    // Atualizar status das amostras afetadas e coletar lotes afetados
    const lotesAfetados = new Set<string>();
    await Promise.all(
      Array.from(amostrasAfetadas).map(async amostraId => {
        const statusAtualizado = await determinarStatusAmostra(amostraId);
        const { query: updateStatusQuery, params: updateStatusParams } = SQL_QUERIES.amostras.update(amostraId, { status: statusAtualizado });
        await query(updateStatusQuery, updateStatusParams);
        
        // Buscar o lote da amostra para atualizar seu status também
        const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(amostraId);
        const amostraResult = await query(amostraQuery, amostraParams);
        if (amostraResult.rows[0]?.loteId) {
          lotesAfetados.add(amostraResult.rows[0].loteId);
        }
      })
    );

    // Atualizar status dos lotes afetados
    await Promise.all(
      Array.from(lotesAfetados).map(async loteId => {
        const loteCompleto = await verificarLoteCompleto(loteId);
        const novoStatusLote = loteCompleto ? 'concluido' : 'em_analise';
        
        const { query: loteUpdateQuery, params: loteUpdateParams } = SQL_QUERIES.lotes.update(loteId, { status: novoStatusLote });
        await query(loteUpdateQuery, loteUpdateParams);
      })
    );

    res.status(201).json({
      message: `${resultadosCriados.length} resultado(s) criado(s) com sucesso`,
      resultados: resultadosCriados
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar resultados em lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/resultados/batch - Criar múltiplos resultados
router.post('/batch', async (req, res): Promise<any> => {
  try {
    const { resultados } = req.body;

    if (!Array.isArray(resultados) || resultados.length === 0) {
      return res.status(400).json({ error: 'Lista de resultados é obrigatória' });
    }

    const resultadosCriados = [];
    const amostrasAfetadas = new Set<string>();

    for (const data of resultados) {
      const validatedData = createResultadoSchema.parse(data);

      // Verificar se amostra existe
      const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.findById(validatedData.amostraId);
      const amostraResult = await query(amostraQuery, amostraParams);
      
      if (!amostraResult.rows[0]) {
        return res.status(400).json({ error: `Amostra ${validatedData.amostraId} não encontrada` });
      }

      // Criar resultado
      const { query: createQuery, params: createParams } = SQL_QUERIES.resultados.create(validatedData);
      const result = await query(createQuery, createParams);
      const resultado = result.rows[0];

      resultadosCriados.push(resultado);
      amostrasAfetadas.add(validatedData.amostraId);
    }

    // Atualizar status das amostras afetadas
    await Promise.all(
      Array.from(amostrasAfetadas).map(async amostraId => {
        const statusAtualizado = await determinarStatusAmostra(amostraId);
        const { query: updateStatusQuery, params: updateStatusParams } = SQL_QUERIES.amostras.update(amostraId, { status: statusAtualizado });
        await query(updateStatusQuery, updateStatusParams);
      })
    );

    res.status(201).json({
      message: `${resultadosCriados.length} resultado(s) criado(s) com sucesso`,
      resultados: resultadosCriados
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar resultados em lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/resultados/amostra/:amostraId/status - Verificar status da amostra
router.get('/amostra/:amostraId/status', async (req, res): Promise<any> => {
  try {
    const { amostraId } = req.params;
    
    const completa = await verificarAmostraCompleta(amostraId);
    
    res.json({
      amostraId,
      completa
    });
  } catch (error) {
    console.error('Erro ao verificar status da amostra:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;