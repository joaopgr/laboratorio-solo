import express from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { determinarStatusAmostra, verificarLoteCompleto } from '../utils/statusUtils';
import { registrarLog } from '../utils/logging';
import { authenticateToken, authorizeRoles } from './auth';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken, authorizeRoles('admin', 'funcionario', 'estagiario', 'recepcao'));

// Função para gerar variações de busca para cobrir acentos
function generateSearchVariations(term: string): string[] {
  const variations = new Set<string>();
  
  // Adicionar o termo original
  variations.add(term);
  variations.add(term.toLowerCase());
  variations.add(term.toUpperCase());
  
  // Variações com acentos comuns
  const accentMap: { [key: string]: string[] } = {
    'a': ['á', 'à', 'â', 'ã', 'ä'],
    'e': ['é', 'è', 'ê', 'ë'],
    'i': ['í', 'ì', 'î', 'ï'],
    'o': ['ó', 'ò', 'ô', 'õ', 'ö'],
    'u': ['ú', 'ù', 'û', 'ü'],
    'c': ['ç'],
    'n': ['ñ']
  };
  
  // Gerar variações substituindo cada caractere por suas versões acentuadas
  for (const [base, accents] of Object.entries(accentMap)) {
    for (const accent of accents) {
      // Substituir base por acento
      variations.add(term.toLowerCase().replace(new RegExp(base, 'g'), accent));
      variations.add(term.toLowerCase().replace(new RegExp(base.toUpperCase(), 'g'), accent.toUpperCase()));
      
      // Substituir acento por base
      variations.add(term.toLowerCase().replace(new RegExp(accent, 'g'), base));
      variations.add(term.toLowerCase().replace(new RegExp(accent.toUpperCase(), 'g'), base.toUpperCase()));
    }
  }
  
  return Array.from(variations);
}

// PUT /api/amostras/batch - Atualizar tipos de análise em lote (DEVE FICAR NO TOPO!)
router.put('/batch', async (req, res): Promise<any> => {
  try {
    const { amostraIds, tiposAnalise } = req.body;
    
    if (!amostraIds || !Array.isArray(amostraIds) || amostraIds.length === 0) {
      return res.status(400).json({ error: 'Pelo menos uma amostra deve ser selecionada' });
    }
    
    if (!tiposAnalise || typeof tiposAnalise !== 'object') {
      return res.status(400).json({ error: 'Tipos de análise são obrigatórios' });
    }
    
    // Verificar se pelo menos um tipo foi selecionado
    const hasSelectedType = Object.values(tiposAnalise).some(Boolean);
    if (!hasSelectedType) {
      return res.status(400).json({ error: 'Pelo menos um tipo de análise deve ser selecionado' });
    }
    
    // Verificar se todas as amostras existem
    const amostrasQuery = `
      SELECT * FROM amostras 
      WHERE id = ANY($1)
    `;
    const amostrasResult = await query(amostrasQuery, [amostraIds]);
    const amostras = amostrasResult.rows;

    if (amostras.length !== amostraIds.length) {
      return res.status(400).json({ error: 'Uma ou mais amostras não foram encontradas' });
    }

    // Atualizar cada amostra
    const updatedAmostras = await Promise.all(
      amostras.map(async (amostra: any) => {
        // Primeiro atualizar os tipos de análise
        const updateData: any = {};
        if (tiposAnalise.rotina !== undefined) updateData.rotina = tiposAnalise.rotina;
        if (tiposAnalise.organica !== undefined) updateData.organica = tiposAnalise.organica;
        if (tiposAnalise.micronutrientes !== undefined) updateData.micronutrientes = tiposAnalise.micronutrientes;
        if (tiposAnalise.enxofre !== undefined) updateData.enxofre = tiposAnalise.enxofre;
        if (tiposAnalise.prem !== undefined) updateData.prem = tiposAnalise.prem;
        if (tiposAnalise.nitrogenio !== undefined) updateData.nitrogenio = tiposAnalise.nitrogenio;
        if (tiposAnalise.granulometria !== undefined) updateData.granulometria = tiposAnalise.granulometria;

        const { query: updateQuery, params: updateParams } = SQL_QUERIES.amostras.update(amostra.id, updateData);
        const updateResult = await query(updateQuery, updateParams);
        const amostraAtualizada = updateResult.rows[0];

        // Buscar dados relacionados
        const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(amostraAtualizada.loteId);
        const loteResult = await query(loteQuery, loteParams);
        const lote = loteResult.rows[0];

        const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId);
        const clienteResult = await query(clienteQuery, clienteParams);
        const cliente = clienteResult.rows[0];

        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraAtualizada.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        const resultados = resultadosResult.rows;

        // Adicionar dados relacionados ao objeto
        amostraAtualizada.lote = { ...lote, cliente };
        amostraAtualizada.resultados = resultados;

        // Determinar status correto após a atualização dos tipos
        const statusAtualizado = await determinarStatusAmostra(amostra.id);
        
        // Atualizar o status se necessário
        if (amostraAtualizada.status !== statusAtualizado) {
          const { query: statusUpdateQuery, params: statusUpdateParams } = SQL_QUERIES.amostras.update(amostra.id, { status: statusAtualizado });
          const statusUpdateResult = await query(statusUpdateQuery, statusUpdateParams);
          const amostraComStatusCorreto = statusUpdateResult.rows[0];
          
          // Adicionar dados relacionados novamente
          amostraComStatusCorreto.lote = { ...lote, cliente };
          amostraComStatusCorreto.resultados = resultados;
          
          return amostraComStatusCorreto;
        }
        return amostraAtualizada;
      })
    );

    // Atualizar status dos lotes afetados
    const lotesAfetados = new Set<string>();
    updatedAmostras.forEach((amostra: any) => {
      if (amostra.lote) {
        lotesAfetados.add(amostra.lote.id);
      }
    });

    // Atualizar status de cada lote afetado
    await Promise.all(
      Array.from(lotesAfetados).map(async loteId => {
        const loteCompleto = await verificarLoteCompleto(loteId);
        const novoStatusLote = loteCompleto ? 'concluido' : 'em_analise';
        
        const { query: loteUpdateQuery, params: loteUpdateParams } = SQL_QUERIES.lotes.update(loteId, { status: novoStatusLote });
        await query(loteUpdateQuery, loteUpdateParams);
      })
    );

    res.json({
      message: `${updatedAmostras.length} amostra(s) atualizada(s) com sucesso`,
      amostras: updatedAmostras
    });
  } catch (error) {
    console.error('Erro ao atualizar amostras em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para normalizar texto (remover acentos e converter para minúsculas)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

// Schemas de validação
const createAmostraSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  identificacao: z.string().min(1, 'Identificação é obrigatória'),
  cultura: z.string().min(1, 'Cultura é obrigatória'),
  localidade: z.string().optional(),
  propriedade: z.string().optional(),
  solicitante: z.string().optional(),
  dataColeta: z.string().optional(),
  observacoes: z.string().optional(),
  // Tipo de análise da amostra
  modulo: z.enum(['solo', 'foliar']).default('solo'),
  // Tipos de análise solicitados para a amostra (solo)
  rotina: z.boolean().default(false),
  organica: z.boolean().default(false), // Matéria Orgânica
  micronutrientes: z.boolean().default(false), // Micronutrientes
  enxofre: z.boolean().default(false), // Enxofre
  prem: z.boolean().default(false), // PREM
  nitrogenio: z.boolean().default(false), // Nitrogênio
  granulometria: z.boolean().default(false), // Granulométrica dentro de solo
  // Tipos de análise para foliar
  foliar: z.boolean().default(false),
  pago: z.boolean().default(false),
  loteId: z.string().min(1, 'ID do lote é obrigatório'),
});

const updateAmostraSchema = createAmostraSchema.partial().omit({ loteId: true }).extend({
  modulo: z.enum(['solo', 'foliar']).optional(),
});

// Função para gerar próximo código de amostra
async function getNextAmostraNumber(modulo: string = 'solo'): Promise<string> {
  // Definir prefixo baseado no módulo
  const prefixos = {
    'solo': '',
    'foliar': 'F'
  }
  
  const prefixo = prefixos[modulo as keyof typeof prefixos] || ''
  
  // Buscar amostras do módulo específico
  const amostrasQuery = `
    SELECT codigo FROM amostras 
    WHERE modulo = $1
  `;
  const amostrasResult = await query(amostrasQuery, [modulo]);
  const amostrasTipo = amostrasResult.rows;

  // Extrair números dos códigos
  const numeros = amostrasTipo
    .map((amostra: any) => {
      // Padrão para solo: "1", "2", "3", para foliar: "F1", "F2", "F3"
      const pattern = prefixo ? `^${prefixo}(\\d+)$` : `^(\\d+)$`
      const match = amostra.codigo.match(new RegExp(pattern))
      return match ? parseInt(match[1]) : 0
    })
    .filter((num: any) => num > 0)
    .sort((a: any, b: any) => b - a) // Ordenar em ordem decrescente

  // O próximo número é o maior número encontrado + 1, ou 1 se não houver amostras
  const nextNumber = numeros.length > 0 ? numeros[0] + 1 : 1

  return prefixo ? `${prefixo}${nextNumber}` : `${nextNumber}`
}

// GET /api/amostras - Listar amostras
router.get('/', async (req, res): Promise<any> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      loteId,
      status,
      cultura,
      ano,
      modulo,
      codigoInicio,
      codigoFim
    } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Construir query base
    let baseQuery = `
      SELECT 
        a.*,
        l.codigo as lote_codigo,
        l.status as lote_status,
        c.id as cliente_id,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf
      FROM amostras a
      JOIN lotes_amostras l ON a."loteId" = l.id
      JOIN clientes c ON l."clienteId" = c.id
    `;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Filtro por módulo
    if (modulo) {
      paramCount++;
      conditions.push(`a.modulo = $${paramCount}`);
      params.push(modulo);
    }

    // Filtro por lote
    if (loteId) {
      paramCount++;
      conditions.push(`a."loteId" = $${paramCount}`);
      params.push(loteId);
    }

    // Filtro por status
    if (status) {
      paramCount++;
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
    }

    // Filtro por cultura
    if (cultura) {
      paramCount++;
      conditions.push(`a.cultura ILIKE $${paramCount}`);
      params.push(`%${cultura}%`);
    }

    // Filtro por ano
    if (ano) {
      paramCount++;
      conditions.push(`EXTRACT(YEAR FROM a."dataRecebimento") = $${paramCount}`);
      params.push(ano);
    }

    // Filtro de busca
    if (search) {
      const searchTerm = search as string;
      const isExactCode = /^[0-9]+$/.test(searchTerm);
      
      if (isExactCode) {
        paramCount++;
        conditions.push(`a.codigo = $${paramCount}`);
        params.push(searchTerm);
      } else {
        paramCount++;
        conditions.push(`(a.identificacao ILIKE $${paramCount} OR c.nome ILIKE $${paramCount})`);
        params.push(`%${searchTerm}%`);
      }
    }

    // Adicionar condições à query
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenação
    baseQuery += ` ORDER BY a."createdAt" DESC`;

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
    const amostrasResult = await query(baseQuery, params);
    let amostras = amostrasResult.rows;

    // Filtro por intervalo de códigos (aplicado após a busca)
    if (codigoInicio && codigoFim) {
      amostras = amostras.filter((amostra: any) => {
        const codigoNum = parseInt(amostra.codigo.replace(/\D/g, ''));
        const inicioNum = parseInt(codigoInicio as string);
        const fimNum = parseInt(codigoFim as string);
        return codigoNum >= inicioNum && codigoNum <= fimNum;
      });
    }

    // Buscar resultados para cada amostra
    for (const amostra of amostras) {
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
      const resultadosResult = await query(resultadosQuery, resultadosParams);
      amostra.resultados = resultadosResult.rows;
    }

    res.json({
      amostras: amostras,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar amostras:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/amostras/:id - Buscar amostra por ID
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { query: amostraQuery, params } = SQL_QUERIES.amostras.findById(id);
    const result = await query(amostraQuery, params);
    const amostra = result.rows[0];

    if (!amostra) {
      return res.status(404).json({ error: 'Amostra não encontrada' });
    }

    // Buscar dados relacionados
    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(amostra.loteId);
    const loteResult = await query(loteQuery, loteParams);
    const lote = loteResult.rows[0];

    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
    const resultadosResult = await query(resultadosQuery, resultadosParams);
    const resultados = resultadosResult.rows;

    // Adicionar dados relacionados
    amostra.lote = { ...lote, cliente };
    amostra.resultados = resultados;

    res.json(amostra);
  } catch (error) {
    console.error('Erro ao buscar amostra:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/amostras - Criar nova amostra
router.post('/', async (req, res): Promise<any> => {
  try {
    const data = createAmostraSchema.parse(req.body);
    
    // Verificar se o código já existe
    const { query: codigoQuery, params: codigoParams } = SQL_QUERIES.amostras.findByCodigo(data.codigo);
    const codigoResult = await query(codigoQuery, codigoParams);
    
    if (codigoResult.rows.length > 0) {
      return res.status(400).json({ error: 'Código de amostra já existe' });
    }

    // Verificar se o lote existe
    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(data.loteId);
    const loteResult = await query(loteQuery, loteParams);
    
    if (!loteResult.rows[0]) {
      return res.status(400).json({ error: 'Lote não encontrado' });
    }

    // Gerar código se não fornecido
    let codigo = data.codigo;
    if (!codigo) {
      codigo = await getNextAmostraNumber(data.modulo);
    } else {
      // Verificar se código já existe
      const { query: codigoQuery, params: codigoParams } = SQL_QUERIES.amostras.findByCodigo(codigo);
      const codigoResult = await query(codigoQuery, codigoParams);
      
      if (codigoResult.rows.length > 0) {
        return res.status(400).json({ error: 'Código de amostra já existe' });
      }
    }

    // Criar amostra
    const amostraData = {
      ...data,
      codigo,
      dataColeta: data.dataColeta ? new Date(data.dataColeta) : undefined,
    };
    const { query: createQuery, params: createParams } = SQL_QUERIES.amostras.create(amostraData);
    const result = await query(createQuery, createParams);
    const amostra = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'criar',
      entidade: 'amostra',
      entidadeId: amostra.id,
      entidadeNome: amostra.codigo
    });

    res.status(201).json(amostra);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar amostra:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/amostras/:id - Atualizar amostra
router.put('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const data = updateAmostraSchema.parse(req.body);
    
    // Verificar se amostra existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.amostras.findById(id);
    const checkResult = await query(checkQuery, checkParams);

    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Amostra não encontrada' });
    }

    // Verificar se código já existe (se estiver sendo alterado)
    if (data.codigo) {
      const { query: codigoQuery, params: codigoParams } = SQL_QUERIES.amostras.findByCodigo(data.codigo);
      const codigoResult = await query(codigoQuery, codigoParams);
      
      if (codigoResult.rows.length > 0 && codigoResult.rows[0].id !== id) {
        return res.status(400).json({ error: 'Código de amostra já existe' });
      }
    }

    // Atualizar amostra
    const updateData = {
      ...data,
      dataColeta: data.dataColeta ? new Date(data.dataColeta) : undefined,
    };
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.amostras.update(id, updateData);
    const result = await query(updateQuery, updateParams);
    const amostra = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'editar',
      entidade: 'amostra',
      entidadeId: amostra.id,
      entidadeNome: amostra.codigo
    });

    res.json(amostra);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao atualizar amostra:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/amostras/:id - Deletar amostra
router.delete('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { cascade = 'false' } = req.query; // Parâmetro para deleção em cascata
    
    // Verificar se amostra existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.amostras.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Amostra não encontrada' });
    }

    // Verificar se tem resultados associados
    const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(id);
    const resultadosResult = await query(resultadosQuery, resultadosParams);
    
    if (resultadosResult.rows.length > 0) {
      if (cascade === 'true') {
        // Deletar em cascata: primeiro os resultados, depois a amostra
        const { query: deleteResultadosQuery, params: deleteResultadosParams } = SQL_QUERIES.resultados.deleteByAmostra(id);
        await query(deleteResultadosQuery, deleteResultadosParams);
        
        const existingAmostra = checkResult.rows[0];
        const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.amostras.delete(id);
        await query(deleteQuery, deleteParams);
        
        // Registrar log
        await registrarLog(req, {
          acao: 'deletar',
          entidade: 'amostra',
          entidadeId: id,
          entidadeNome: existingAmostra.codigo
        });
        
        res.status(204).send();
      } else {
        // Retornar informações sobre dados relacionados para o frontend decidir
        return res.status(400).json({ 
          error: 'Amostra possui resultados associados',
          hasRelatedData: true,
          relatedData: {
            resultados: resultadosResult.rows.length
          },
          message: `Esta amostra possui ${resultadosResult.rows.length} resultado(s) de análise associado(s). Deseja deletar a amostra junto com todos os resultados?`
        });
      }
    } else {
      // Deletar amostra normalmente (sem dados relacionados)
      const existingAmostra = checkResult.rows[0];
      const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.amostras.delete(id);
      await query(deleteQuery, deleteParams);
      
      // Registrar log
      await registrarLog(req, {
        acao: 'deletar',
        entidade: 'amostra',
        entidadeId: id,
        entidadeNome: existingAmostra.codigo
      });
      
      res.status(204).send();
    }
  } catch (error) {
    console.error('Erro ao deletar amostra:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/amostras/next-code/:modulo - Obter próximo código de amostra
router.get('/next-code/:modulo', async (req, res): Promise<any> => {
  try {
    const { modulo } = req.params;
    const nextCode = await getNextAmostraNumber(modulo);
    res.json({ nextCode });
  } catch (error) {
    console.error('Erro ao gerar próximo código:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;