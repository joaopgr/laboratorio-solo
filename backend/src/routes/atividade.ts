import { Router } from 'express';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { authenticateToken, authorizeRoles } from './auth';

const router = Router();

router.use(authenticateToken, authorizeRoles('admin', 'analista', 'visualizador'));

// Função helper para mapear nome -> titulo nas respostas
function mapearAtividadeParaFrontend(atividade: any): any {
  if (!atividade) return atividade;
  
  const atividadMapeada = { ...atividade };
  // Se tem nome mas não tem titulo, copiar nome para titulo
  if (atividadMapeada.nome && !atividadMapeada.titulo) {
    atividadMapeada.titulo = atividadMapeada.nome;
  }
  return atividadMapeada;
}

// GET /api/atividades - Listar todas as atividades
router.get('/', async (req: any, res): Promise<any> => {
  try {
    const { 
      page = '1', 
      limit = '50', 
      search = '', 
      status = '', 
      prioridade = '', 
      tipo = '',
      modo = 'recebidas' // 'recebidas' ou 'criadas'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Buscar nome do usuário logado para filtrar atividades
    const { query: userQuery, params: userParams } = SQL_QUERIES.usuarios.findById(req.user.id);
    const userResult = await query(userQuery, userParams);
    const usuarioLogado = userResult.rows[0];
    const nomeUsuarioLogado = usuarioLogado?.nome?.trim() || '';
    
    console.log('🔍 Buscando atividades - Usuário logado:', {
      userId: req.user.id,
      nomeUsuarioLogado: nomeUsuarioLogado,
      modo: modo,
      queryParams: { page, limit, search, status, prioridade, tipo }
    });
    
    // Log da query que será executada
    const { query: atividadesQueryDebug, params: atividadesParamsDebug } = SQL_QUERIES.atividades.findAll(
      pageNum, 
      limitNum, 
      search as string, 
      status as string, 
      prioridade as string, 
      tipo as string,
      nomeUsuarioLogado,
      modo as string
    );
    console.log('📋 Query que será executada:', atividadesQueryDebug);
    console.log('📋 Parâmetros:', atividadesParamsDebug);

    // Buscar atividades e total (com filtro por responsável ou criador)
    const { query: atividadesQuery, params: atividadesParams } = SQL_QUERIES.atividades.findAll(
      pageNum, 
      limitNum, 
      search as string, 
      status as string, 
      prioridade as string, 
      tipo as string,
      nomeUsuarioLogado, // Passar nome do usuário para filtrar
      modo as string // 'recebidas' ou 'criadas'
    );
    
    const { query: countQuery, params: countParams } = SQL_QUERIES.atividades.count(
      search as string, 
      status as string, 
      prioridade as string, 
      tipo as string,
      nomeUsuarioLogado, // Passar nome do usuário para filtrar
      modo as string // 'recebidas' ou 'criadas'
    );

    const [atividadesResult, countResult] = await Promise.all([
      query(atividadesQuery, atividadesParams),
      query(countQuery, countParams)
    ]);

    const atividades = atividadesResult.rows.map(mapearAtividadeParaFrontend);
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

    res.json(mapearAtividadeParaFrontend(atividade));
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/atividades - Criar nova atividade
router.post('/', async (req: any, res): Promise<any> => {
  try {
    const { titulo, descricao, tipo, prioridade, responsavel, prazo } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    // Buscar nome do usuário que está criando a atividade
    const { query: userQuery, params: userParams } = SQL_QUERIES.usuarios.findById(req.user.id);
    const userResult = await query(userQuery, userParams);
    const usuarioCriador = userResult.rows[0];
    const nomeCriador = usuarioCriador?.nome?.trim() || '';
    
    console.log('🔍 Criando atividade - Usuário criador:', {
      userId: req.user.id,
      nomeCriador: nomeCriador,
      responsavel: responsavel
    });

    // Verificar estrutura da tabela para determinar qual coluna usar
    const schemaQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'atividades' AND table_schema = 'public'
      AND column_name IN ('nome', 'titulo');
    `;
    
    let useNomeColumn = false;
    try {
      const schemaResult = await query(schemaQuery);
      const columnNames = schemaResult.rows.map((r: any) => r.column_name);
      
      console.log('Colunas encontradas na tabela atividades:', columnNames);
      
      // Se existe "nome" mas não "titulo", usar "nome"
      if (columnNames.includes('nome') && !columnNames.includes('titulo')) {
        useNomeColumn = true;
        console.log('✅ Tabela atividades usa coluna "nome" - ajustando query para usar "nome"');
      } else if (columnNames.includes('titulo') && !columnNames.includes('nome')) {
        useNomeColumn = false;
        console.log('✅ Tabela atividades usa coluna "titulo" - usando query padrão');
      } else if (columnNames.includes('nome') && columnNames.includes('titulo')) {
        // Se ambos existem, priorizar titulo mas também preencher nome para compatibilidade
        useNomeColumn = true;
        console.log('⚠️ Tabela atividades tem AMBAS as colunas - usando "nome" para compatibilidade');
      } else {
        // Assumir "nome" como padrão por segurança
        useNomeColumn = true;
        console.log('⚠️ Nenhuma coluna encontrada - assumindo "nome" como padrão');
      }
    } catch (schemaError) {
      console.error('❌ Erro ao verificar schema da tabela:', schemaError);
      // Assumir que usa "nome" como fallback seguro
      useNomeColumn = true;
      console.log('Usando "nome" como fallback devido ao erro de schema');
    }

    // SEMPRE usar coluna "nome" por enquanto, já que o script pode não ter sido executado completamente
    // A detecção acima está sendo usada apenas para logging
    const useNomeForcado = true; // Forçar uso de "nome" até migração completa
    
    // Verificar se coluna "criadoPor" existe
    const checkCriadoPorQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'atividades' AND table_schema = 'public'
      AND column_name = 'criadoPor';
    `;
    let temCriadoPor = false;
    try {
      const criadoPorResult = await query(checkCriadoPorQuery);
      temCriadoPor = criadoPorResult.rows.length > 0;
      console.log('🔍 Coluna criadoPor existe?', temCriadoPor);
    } catch (err) {
      console.log('⚠️ Erro ao verificar coluna criadoPor:', err);
    }
    
    try {
      // Criar query usando "nome" sempre (estrutura atual do banco)
      let createQuery: string;
      let params: any[];
      
      if (temCriadoPor) {
        createQuery = `
          INSERT INTO atividades (id, nome, descricao, tipo, prioridade, status, responsavel, "criadoPor", prazo, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING *
        `;
        params = [
          titulo || 'Sem título',
          descricao || null,
          tipo || 'tarefa',
          prioridade || 'media',
          'pendente',
          responsavel || null,
          nomeCriador || null, // Campo criadoPor
          prazo ? new Date(prazo + 'T00:00:00Z') : null
        ];
      } else {
        // Se coluna não existe, criar sem ela (compatibilidade)
        console.warn('⚠️ Coluna criadoPor não existe - criando atividade sem esse campo');
        createQuery = `
          INSERT INTO atividades (id, nome, descricao, tipo, prioridade, status, responsavel, prazo, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `;
        params = [
          titulo || 'Sem título',
          descricao || null,
          tipo || 'tarefa',
          prioridade || 'media',
          'pendente',
          responsavel || null,
          prazo ? new Date(prazo + 'T00:00:00Z') : null
        ];
      }
      
      console.log('📝 Executando INSERT com params:', { 
        titulo: params[0], 
        descricao: params[1], 
        tipo: params[2],
        prioridade: params[3],
        status: params[4],
        responsavel: params[5],
        criadoPor: temCriadoPor ? params[6] : 'N/A (coluna não existe)',
        temCriadoPor
      });
      
      const result = await query(createQuery, params);
      const atividade = result.rows[0];
      
      console.log('✅ Atividade criada:', {
        id: atividade.id,
        titulo: atividade.nome || atividade.titulo,
        criadoPor: atividade.criadoPor || 'NULL',
        responsavel: atividade.responsavel
      });

      res.status(201).json(mapearAtividadeParaFrontend(atividade));
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

    // Atualizar atividade - usar "nome" ao invés de "titulo"
    const updateData: any = {};
    if (titulo !== undefined) updateData.nome = titulo; // Mapear titulo -> nome
    if (descricao !== undefined) updateData.descricao = descricao;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (prioridade !== undefined) updateData.prioridade = prioridade;
    if (status !== undefined) updateData.status = status;
    if (responsavel !== undefined) updateData.responsavel = responsavel;
    if (prazo !== undefined) updateData.prazo = prazo ? new Date(prazo + 'T00:00:00Z') : null;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;
    
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        updates.push(`"${key}" = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (updates.length === 0) {
      // Se não há nada para atualizar, retornar atividade original
      const { query: findQuery, params: findParams } = SQL_QUERIES.atividades.findById(id);
      const findResult = await query(findQuery, findParams);
      return res.json(mapearAtividadeParaFrontend(findResult.rows[0]));
    }
    
    updates.push('"updatedAt" = NOW()');
    
    const updateQuery = `
      UPDATE atividades 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(updateQuery, [id, ...values]);
    const atividade = result.rows[0];

    res.json(mapearAtividadeParaFrontend(atividade));
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
    const updateQuery = `
      UPDATE atividades 
      SET status = $2, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(updateQuery, [id, status]);
    const atividade = result.rows[0];

    res.json(mapearAtividadeParaFrontend(atividade));
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
