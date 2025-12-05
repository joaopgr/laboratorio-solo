import express from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
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

// Schemas de validação
const createClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00').min(1, 'CPF é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'UF é obrigatório'),
});

const updateClienteSchema = createClienteSchema.partial();

// GET /api/clientes - Listar todos os clientes
router.get('/', async (req, res): Promise<any> => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Buscar clientes e total
    const { query: clientesQuery, params: clientesParams } = SQL_QUERIES.clientes.findAll(
      pageNum, 
      limitNum, 
      search as string
    );
    
    const { query: countQuery, params: countParams } = SQL_QUERIES.clientes.count(search as string);

    const [clientesResult, countResult] = await Promise.all([
      query(clientesQuery, clientesParams),
      query(countQuery, countParams)
    ]);

    const clientes = clientesResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // Para cada cliente, buscar seus lotes
    for (const cliente of clientes) {
      const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(cliente.id);
      const lotesResult = await query(lotesQuery, lotesParams);
      cliente.lotes = lotesResult.rows;
    }

    res.json({
      clientes: clientes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { include } = req.query;
    
    // Buscar cliente
    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(id);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Incluir dados relacionados se solicitado
    if (include === 'lotes') {
      const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(id);
      const lotesResult = await query(lotesQuery, lotesParams);
      
      // Para cada lote, buscar suas amostras
      for (const lote of lotesResult.rows) {
        const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
        const amostrasResult = await query(amostrasQuery, amostrasParams);
        
        // Para cada amostra, buscar seus resultados
        for (const amostra of amostrasResult.rows) {
          const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
          const resultadosResult = await query(resultadosQuery, resultadosParams);
          amostra.resultados = resultadosResult.rows;
        }
        
        lote.amostras = amostrasResult.rows;
      }
      
      cliente.lotes = lotesResult.rows;
    } else {
      // Buscar todas as amostras do cliente através dos lotes
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByCliente(id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      
      // Para cada amostra, buscar seus resultados
      for (const amostra of amostrasResult.rows) {
        const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostra.id);
        const resultadosResult = await query(resultadosQuery, resultadosParams);
        amostra.resultados = resultadosResult.rows;
      }
      
      cliente.amostras = amostrasResult.rows;
    }

    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res): Promise<any> => {
  try {
    const data = createClienteSchema.parse(req.body);
    
    // Verificar se CPF já existe (apenas se CPF foi fornecido)
    if (data.cpf) {
      const { query: cpfQuery, params: cpfParams } = SQL_QUERIES.clientes.findByCpf(data.cpf);
      const cpfResult = await query(cpfQuery, cpfParams);
      const existingCliente = cpfResult.rows[0];

      if (existingCliente) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    // Limpar campos vazios para evitar problemas com constraints
    const clienteData: any = {
      nome: data.nome,
      cpf: data.cpf,
      cidade: data.cidade,
      estado: data.estado
    };
    if (data.email && data.email.trim() !== '') {
      clienteData.email = data.email;
    }
    if (data.telefone && data.telefone.trim() !== '') {
      clienteData.telefone = data.telefone;
    }

    const { query: createQuery, params: createParams } = SQL_QUERIES.clientes.create(clienteData);
    const result = await query(createQuery, createParams);
    const cliente = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'criar',
      entidade: 'cliente',
      entidadeId: cliente.id,
      entidadeNome: cliente.nome
    });

    res.status(201).json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const data = updateClienteSchema.parse(req.body);
    
    // Verificar se cliente existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.clientes.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    const existingCliente = checkResult.rows[0];

    if (!existingCliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Se CPF está sendo alterado, verificar se já existe
    if (data.cpf && data.cpf !== existingCliente.cpf) {
      const { query: cpfQuery, params: cpfParams } = SQL_QUERIES.clientes.findByCpf(data.cpf);
      const cpfResult = await query(cpfQuery, cpfParams);
      const cpfExists = cpfResult.rows[0];

      if (cpfExists) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    const { query: updateQuery, params: updateParams } = SQL_QUERIES.clientes.update(id, data);
    const result = await query(updateQuery, updateParams);
    const cliente = result.rows[0];

    // Registrar log
    await registrarLog(req, {
      acao: 'editar',
      entidade: 'cliente',
      entidadeId: cliente.id,
      entidadeNome: cliente.nome
    });

    res.json(cliente);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao atualizar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/clientes/:id - Deletar cliente
router.delete('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    
    // Verificar se cliente existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.clientes.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    const existingCliente = checkResult.rows[0];

    if (!existingCliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar se tem lotes/amostras associadas
    const { query: lotesQuery, params: lotesParams } = SQL_QUERIES.lotes.findByCliente(id);
    const lotesResult = await query(lotesQuery, lotesParams);
    
    let totalAmostras = 0;
    for (const lote of lotesResult.rows) {
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      totalAmostras += amostrasResult.rows.length;
    }
    
    if (totalAmostras > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cliente com amostras associadas' 
      });
    }

    const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.clientes.delete(id);
    await query(deleteQuery, deleteParams);

    // Registrar log
    await registrarLog(req, {
      acao: 'deletar',
      entidade: 'cliente',
      entidadeId: id,
      entidadeNome: existingCliente.nome
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
