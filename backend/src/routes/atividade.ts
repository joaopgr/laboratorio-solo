import { Router } from 'express';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

const router = Router();

// GET /api/atividades - Listar todas as atividades
router.get('/', async (req, res): Promise<any> => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      search = '', 
      status = '', 
      prioridade = '', 
      tipo = '' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Buscar atividades e total
    const { query: atividadesQuery, params: atividadesParams } = SQL_QUERIES.atividades.findAll(
      pageNum, 
      limitNum, 
      search as string, 
      status as string, 
      prioridade as string, 
      tipo as string
    );
    
    const { query: countQuery, params: countParams } = SQL_QUERIES.atividades.count(
      search as string, 
      status as string, 
      prioridade as string, 
      tipo as string
    );

    const [atividadesResult, countResult] = await Promise.all([
      query(atividadesQuery, atividadesParams),
      query(countQuery, countParams)
    ]);

    const atividades = atividadesResult.rows;
    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: atividades,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/atividades/:id - Buscar atividade por ID
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    const { query: atividadeQuery, params } = SQL_QUERIES.atividades.findById(id);
    const result = await query(atividadeQuery, params);
    const atividade = result.rows[0];

    if (!atividade) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    res.json(atividade);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/atividades - Criar nova atividade
router.post('/', async (req, res): Promise<any> => {
  try {
    const { titulo, descricao, tipo, prioridade, responsavel, prazo } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    // Verificar estrutura da tabela para determinar qual coluna usar
    const schemaQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'atividades' AND table_schema = 'public'
      AND column_name IN ('nome', 'titulo')
      ORDER BY ordinal_position;
    `;
    
    let useNomeColumn = false;
    try {
      const schemaResult = await query(schemaQuery);
      const columnNames = schemaResult.rows.map((r: any) => r.column_name);
      
      if (columnNames.includes('nome') && !columnNames.includes('titulo')) {
        useNomeColumn = true;
        console.log('Tabela atividades ainda usa coluna "nome", ajustando query...');
      }
    } catch (schemaError) {
      console.warn('Erro ao verificar schema da tabela, tentando com coluna "nome":', schemaError);
      // Assumir que usa "nome" como fallback
      useNomeColumn = true;
    }

    try {
      // Criar query apropriada baseada na estrutura da tabela
      let createQuery: string;
      let params: any[];
      
      if (useNomeColumn) {
        // Usar coluna "nome" ao invés de "titulo" (estrutura antiga)
        createQuery = `
          INSERT INTO atividades (id, nome, descricao, tipo, prioridade, status, responsavel, prazo, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `;
        params = [
          titulo, // Inserir titulo na coluna nome
          descricao || null,
          tipo || 'tarefa',
          prioridade || 'media',
          'pendente',
          responsavel || null,
          prazo ? new Date(prazo + 'T00:00:00Z') : null
        ];
      } else {
        // Usar coluna "titulo" (estrutura atualizada)
        const queryObj = SQL_QUERIES.atividades.create({
          titulo,
          descricao,
          tipo: tipo || 'tarefa',
          prioridade: prioridade || 'media',
          responsavel,
          prazo: prazo ? new Date(prazo + 'T00:00:00Z') : undefined
        });
        createQuery = queryObj.query;
        params = queryObj.params;
      }
      
      const result = await query(createQuery, params);
      const atividade = result.rows[0];
      
      // Garantir que a resposta sempre tenha campo "titulo"
      if (atividade.nome && !atividade.titulo) {
        atividade.titulo = atividade.nome;
      }

      res.status(201).json(atividade);
    } catch (dbError: any) {
      console.error('Erro ao criar atividade:', dbError);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar atividade:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/atividades/:id - Atualizar atividade
router.put('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, prioridade, status, responsavel, prazo } = req.body;

    // Verificar se atividade existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.atividades.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    // Atualizar atividade
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.atividades.update(id, {
      titulo,
      descricao,
      tipo,
      prioridade,
      status,
      responsavel,
      prazo: prazo ? new Date(prazo + 'T00:00:00Z') : undefined
    });
    
    const result = await query(updateQuery, updateParams);
    const atividade = result.rows[0];

    res.json(atividade);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/atividades/:id - Excluir atividade
router.delete('/:id', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;

    // Verificar se atividade existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.atividades.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    // Deletar atividade
    const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.atividades.delete(id);
    await query(deleteQuery, deleteParams);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir atividade:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/atividades/:id/status - Atualizar apenas o status
router.patch('/:id/status', async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    // Verificar se atividade existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.atividades.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    // Atualizar apenas o status
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.atividades.update(id, { status });
    const result = await query(updateQuery, updateParams);
    const atividade = result.rows[0];

    res.json(atividade);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
