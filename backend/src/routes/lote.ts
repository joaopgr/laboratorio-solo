import { Router } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { registrarLog } from '../utils/logging';
import { authenticateToken } from './auth';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

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

// Schema de validação
const createLoteSchema = z.object({
  codigo: z.string().optional(), // Código opcional - será gerado automaticamente se não fornecido
  dataEntrega: z.string().datetime(),
  observacoes: z.string().optional(),
  status: z.enum(['pendente', 'em_analise', 'concluido', 'pago']).default('pendente'),
  pago: z.boolean().default(false),
  desconto: z.number().optional(), // Desconto em porcentagem
  clienteId: z.string().min(1, 'ID do cliente é obrigatório'),
  modulo: z.enum(['solo', 'foliar']).default('solo'),
  // Tipos de análise solicitados para o lote (solo)
  rotina: z.boolean().default(false),
  organica: z.boolean().default(false), // Matéria Orgânica
  micronutrientes: z.boolean().default(false), // Micronutrientes
  enxofre: z.boolean().default(false), // Enxofre
  prem: z.boolean().default(false), // PREM
  nitrogenio: z.boolean().default(false), // Nitrogênio
  granulometria: z.boolean().default(false), // Granulométrica dentro de solo
  // Tipos de análise para foliar
  foliar: z.boolean().default(false),
});

const updateLoteSchema = createLoteSchema.partial().omit({ clienteId: true });

// Função para gerar próximo número de lote
async function getNextLoteNumber(modulo: string = 'solo'): Promise<string> {
  // Definir prefixo baseado no módulo
  const prefixos = {
    'solo': '',
    'foliar': 'F'
  }
  
  const prefixo = prefixos[modulo as keyof typeof prefixos] || ''
  
  // Buscar lotes do módulo específico
  const lotesQuery = `
    SELECT codigo FROM lotes_amostras 
    WHERE modulo = $1
  `;
  const lotesResult = await query(lotesQuery, [modulo]);
  const lotesTipo = lotesResult.rows;

  // Extrair números dos códigos
  const numeros = lotesTipo
    .map((lote: any) => {
      // Padrão para solo: "1", "2", "3", para foliar: "F1", "F2", "F3"
      const pattern = prefixo ? `^${prefixo}(\\d+)$` : `^(\\d+)$`
      const match = lote.codigo.match(new RegExp(pattern))
      return match ? parseInt(match[1]) : 0
    })
    .filter((num: any) => num > 0)
    .sort((a: any, b: any) => b - a) // Ordenar em ordem decrescente

  // O próximo número é o maior número encontrado + 1, ou 1 se não houver lotes
  const nextNumber = numeros.length > 0 ? numeros[0] + 1 : 1

  return prefixo ? `${prefixo}${nextNumber}` : `${nextNumber}`
}

// GET /api/lotes - Listar todos os lotes
router.get('/', async (req, res): Promise<any> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status,
      modulo,
      clienteId,
      ano,
      codigoInicio,
      codigoFim,
      pago,
      concluido
    } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Buscar lotes e total
    const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findAll(
      pageNum, 
      limitNum, 
      search as string, 
      status as string
    );
    
    const { query: countQuery, params: countParams } = SQL_QUERIES.lotes.count(
      search as string, 
      status as string
    );

    const [lotesResult, countResult] = await Promise.all([
      query(lotesQuery, lotesParams),
      query(countQuery, countParams)
    ]);

    let lotes = lotesResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // Aplicar filtros adicionais
    if (modulo) {
      lotes = lotes.filter((lote: any) => lote.modulo === modulo);
    }
    
    if (clienteId) {
      lotes = lotes.filter((lote: any) => lote.clienteId === clienteId);
    }
    
    if (ano) {
      lotes = lotes.filter((lote: any) => {
        const loteAno = new Date(lote.dataEntrega).getFullYear();
        return loteAno === parseInt(ano as string);
      });
    }
    
    // Filtro por pagamento
    if (pago !== undefined) {
      const pagoBool = pago === 'true';
      lotes = lotes.filter((lote: any) => lote.pago === pagoBool);
    }
    
    // Filtro por conclusão
    if (concluido !== undefined) {
      const concluidoBool = concluido === 'true';
      lotes = lotes.filter((lote: any) => {
        if (concluidoBool) {
          return lote.status === 'concluido' || lote.status === 'pago';
        } else {
          return lote.status !== 'concluido' && lote.status !== 'pago';
        }
      });
    }

    // Filtro por intervalo de códigos
    if (codigoInicio && codigoFim) {
      lotes = lotes.filter((lote: any) => {
        const codigoNum = parseInt(lote.codigo.replace(/\D/g, ''));
        const inicioNum = parseInt(codigoInicio as string);
        const fimNum = parseInt(codigoFim as string);
        return codigoNum >= inicioNum && codigoNum <= fimNum;
      });
    }

    // Buscar amostras para cada lote e aninhar dados do cliente
    for (const lote of lotes) {
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      lote.amostras = amostrasResult.rows;
      
      // Extrair informações do cliente e criar objeto aninhado
      const cliente = {
        id: lote.clienteId,
        nome: lote.cliente_nome,
        cpf: lote.cliente_cpf,
        email: lote.cliente_email,
        telefone: lote.cliente_telefone,
        cidade: lote.cliente_cidade,
        estado: lote.cliente_estado
      };

      // Remover campos individuais do cliente do objeto lote
      delete lote.cliente_nome;
      delete lote.cliente_cpf;
      delete lote.cliente_email;
      delete lote.cliente_telefone;
      delete lote.cliente_cidade;
      delete lote.cliente_estado;

      // Adicionar objeto cliente ao lote
      lote.cliente = cliente;
    }

    res.json({
      lotes: lotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/lotes/:id - Buscar lote por ID
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { query: loteQuery, params } = SQL_QUERIES.lotes.findById(id);
    const result = await query(loteQuery, params);
    const lote = result.rows[0];

    if (!lote) {
      return res.status(404).json({ error: 'Lote não encontrado' });
    }

    // Buscar amostras do lote
    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(id);
    const amostrasResult = await query(amostrasQuery, amostrasParams);
    const amostras = amostrasResult.rows;

    // Buscar resultados para cada amostra
    for (const amostra of amostras) {
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
      const resultadosResult = await query(resultadosQuery, resultadosParams);
      amostra.resultados = resultadosResult.rows;
    }

    lote.amostras = amostras;

    // Extrair informações do cliente e criar objeto aninhado
    const cliente = {
      id: lote.clienteId,
      nome: lote.cliente_nome,
      cpf: lote.cliente_cpf,
      email: lote.cliente_email,
      telefone: lote.cliente_telefone,
      cidade: lote.cliente_cidade,
      estado: lote.cliente_estado
    };

    // Remover campos individuais do cliente do objeto lote
    delete lote.cliente_nome;
    delete lote.cliente_cpf;
    delete lote.cliente_email;
    delete lote.cliente_telefone;
    delete lote.cliente_cidade;
    delete lote.cliente_estado;

    // Adicionar objeto cliente ao lote
    lote.cliente = cliente;

    res.json(lote);
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/lotes - Criar novo lote
router.post('/', async (req, res): Promise<any> => {
  try {
    const data = createLoteSchema.parse(req.body);

    // Verificar se cliente existe
    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(data.clienteId);
    const clienteResult = await query(clienteQuery, clienteParams);
    
    if (!clienteResult.rows[0]) {
      return res.status(400).json({ error: 'Cliente não encontrado' });
    }

    // Gerar código se não fornecido
    let codigo = data.codigo;
    if (!codigo) {
      codigo = await getNextLoteNumber(data.modulo);
    } else {
      // Verificar se código já existe
      const { query: codigoQuery, params: codigoParams } = SQL_QUERIES.lotes.findByCodigo(codigo);
      const codigoResult = await query(codigoQuery, codigoParams);
      
      if (codigoResult.rows.length > 0) {
        return res.status(400).json({ error: 'Código de lote já existe' });
      }
    }

    // Criar lote
    const loteData = {
      ...data,
      codigo,
      dataEntrega: new Date(data.dataEntrega),
    };
    const { query: createQuery, params: createParams } = SQL_QUERIES.lotes.create(loteData);
    const result = await query(createQuery, createParams);
    const lote = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'criar',
      entidade: 'lote',
      entidadeId: lote.id,
      entidadeNome: lote.codigo
    });

    res.status(201).json(lote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/lotes/:id - Atualizar lote
router.put('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const data = updateLoteSchema.parse(req.body);

    // Verificar se lote existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.lotes.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Lote não encontrado' });
    }

    // Verificar se código já existe (se estiver sendo alterado)
    if (data.codigo) {
      const { query: codigoQuery, params: codigoParams } = SQL_QUERIES.lotes.findByCodigo(data.codigo);
      const codigoResult = await query(codigoQuery, codigoParams);
      
      if (codigoResult.rows.length > 0 && codigoResult.rows[0].id !== id) {
        return res.status(400).json({ error: 'Código de lote já existe' });
      }
    }

    // Atualizar lote
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.lotes.update(id, data);
    const result = await query(updateQuery, updateParams);
    const lote = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'editar',
      entidade: 'lote',
      entidadeId: lote.id,
      entidadeNome: lote.codigo
    });

    res.json(lote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao atualizar lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/lotes/clean-empty - Deletar lotes vazios (DEVE VIR ANTES DE /:id!)
router.delete('/clean-empty', async (req, res): Promise<any> => {
  try {
    // Buscar lotes sem amostras
    const { query: lotesVaziosQuery, params: lotesVaziosParams } = SQL_QUERIES.lotes.findEmpty();
    const lotesVaziosResult = await query(lotesVaziosQuery, lotesVaziosParams);
    const lotesVazios = lotesVaziosResult.rows;

    if (lotesVazios.length === 0) {
      return res.json({ 
        message: 'Nenhum lote vazio encontrado',
        deletedCount: 0 
      });
    }

    // Deletar lotes vazios
    let deletedCount = 0;
    for (const lote of lotesVazios) {
      const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.lotes.delete(lote.id);
      await query(deleteQuery, deleteParams);
      deletedCount++;
    }

    res.json({ 
      message: `${deletedCount} lote(s) vazio(s) removido(s) com sucesso`,
      deletedCount 
    });
  } catch (error) {
    console.error('Erro ao limpar lotes vazios:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/lotes/next-code/:modulo - Obter próximo código de lote
router.get('/next-code/:modulo', async (req, res): Promise<any> => {
  try {
    const { modulo } = req.params;
    const nextCode = await getNextLoteNumber(modulo);
    res.json({ nextCode });
  } catch (error) {
    console.error('Erro ao gerar próximo código:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/lotes/:id - Deletar lote
router.delete('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { cascade = 'false' } = req.query; // Parâmetro para deleção em cascata

    // Verificar se lote existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.lotes.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Lote não encontrado' });
    }

    // Verificar se tem amostras associadas
    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(id);
    const amostrasResult = await query(amostrasQuery, amostrasParams);
    
    if (amostrasResult.rows.length > 0) {
      if (cascade === 'true') {
        // Deletar em cascata: primeiro os resultados das amostras, depois as amostras, depois o lote
        for (const amostra of amostrasResult.rows) {
          // Deletar resultados da amostra
          const { query: deleteResultadosQuery, params: deleteResultadosParams } = SQL_QUERIES.resultados.deleteByAmostra(amostra.id);
          await query(deleteResultadosQuery, deleteResultadosParams);
          
          // Deletar amostra
          const { query: deleteAmostraQuery, params: deleteAmostraParams } = SQL_QUERIES.amostras.delete(amostra.id);
          await query(deleteAmostraQuery, deleteAmostraParams);
        }
        
        // Deletar lote
        const existingLote = checkResult.rows[0];
        const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.lotes.delete(id);
        await query(deleteQuery, deleteParams);
        
        // Registrar log
        await registrarLog(req, {
          acao: 'deletar',
          entidade: 'lote',
          entidadeId: id,
          entidadeNome: existingLote.codigo
        });
        
        res.status(204).send();
      } else {
        // Contar resultados das amostras para mostrar informações completas
        let totalResultados = 0;
        for (const amostra of amostrasResult.rows) {
          const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
          const resultadosResult = await query(resultadosQuery, resultadosParams);
          totalResultados += resultadosResult.rows.length;
        }
        
        // Retornar informações sobre dados relacionados para o frontend decidir
        return res.status(400).json({ 
          error: 'Lote possui amostras associadas',
          hasRelatedData: true,
          relatedData: {
            amostras: amostrasResult.rows.length,
            resultados: totalResultados
          },
          message: `Este lote possui ${amostrasResult.rows.length} amostra(s) e ${totalResultados} resultado(s) de análise associado(s). Deseja deletar o lote junto com todas as amostras e resultados?`
        });
      }
    } else {
      // Deletar lote normalmente (sem amostras relacionadas)
      const existingLote = checkResult.rows[0];
      const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.lotes.delete(id);
      await query(deleteQuery, deleteParams);
      
      // Registrar log
      await registrarLog(req, {
        acao: 'deletar',
        entidade: 'lote',
        entidadeId: id,
        entidadeNome: existingLote.codigo
      });
      
      res.status(204).send();
    }
  } catch (error) {
    console.error('Erro ao deletar lote:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;