import { Router } from 'express';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';
import { authenticateToken, authorizeRoles } from './auth';

const router = Router();

// Schemas de validação
const createUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'analista', 'visualizador']).default('analista'),
  ativo: z.boolean().default(true),
});

const updateUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['admin', 'analista', 'visualizador']).optional(),
  ativo: z.boolean().optional(),
});

// Todas as rotas requerem autenticação e permissão de admin
router.use(authenticateToken, authorizeRoles('admin'));

// GET /api/usuarios - Listar todos os usuários (com senhas para admin)
router.get('/', async (req: any, res): Promise<any> => {
  try {
    const { query: usersQuery, params } = SQL_QUERIES.usuarios.findAllWithInactive();
    const result = await query(usersQuery, params);
    
    const usuarios = result.rows.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      senha: u.senha, // Admin pode ver senhas
      role: u.role,
      ativo: u.ativo,
      createdAt: u.createdAt
    }));
    
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', async (req: any, res): Promise<any> => {
  try {
    const { id } = req.params;
    const { query: userQuery, params } = SQL_QUERIES.usuarios.findByIdWithPassword(id);
    const result = await query(userQuery, params);
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = result.rows[0];
    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha,
      role: usuario.role,
      ativo: usuario.ativo,
      createdAt: usuario.createdAt
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/usuarios - Criar novo usuário
router.post('/', async (req: any, res): Promise<any> => {
  try {
    const data = createUsuarioSchema.parse(req.body);
    
    // Verificar se email já existe
    const { query: existingQuery, params: existingParams } = SQL_QUERIES.usuarios.findByEmail(data.email);
    const existingResult = await query(existingQuery, existingParams);
    const existingUsuario = existingResult.rows[0];

    if (existingUsuario) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário
    const { query: createQuery, params: createParams } = SQL_QUERIES.usuarios.create({
      nome: data.nome,
      email: data.email,
      senha: data.senha, // Senha em texto plano (conforme padrão do sistema)
      role: data.role,
      ativo: data.ativo
    });
    const createResult = await query(createQuery, createParams);
    const usuario = createResult.rows[0];

    // Buscar dados do usuário logado para o log
    const { query: userLogadoQuery, params: userLogadoParams } = SQL_QUERIES.usuarios.findById(req.user.id);
    const userLogadoResult = await query(userLogadoQuery, userLogadoParams);
    const userLogado = userLogadoResult.rows[0];

    // Criar log
    const { query: logQuery, params: logParams } = SQL_QUERIES.logs.create({
      usuarioId: req.user.id,
      usuarioNome: userLogado?.nome || 'Admin',
      usuarioEmail: req.user.email,
      acao: 'criar',
      entidade: 'usuario',
      entidadeId: usuario.id,
      entidadeNome: usuario.nome,
      detalhes: JSON.stringify({ email: usuario.email, role: usuario.role })
    });
    await query(logQuery, logParams);

    res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      senha: data.senha, // Retornar senha para exibição
      role: usuario.role,
      ativo: usuario.ativo,
      createdAt: usuario.createdAt
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', async (req: any, res): Promise<any> => {
  try {
    const { id } = req.params;
    const data = updateUsuarioSchema.parse(req.body);

    // Verificar se usuário existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.usuarios.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se email está sendo atualizado, verificar se não está em uso por outro usuário
    if (data.email) {
      const { query: emailQuery, params: emailParams } = SQL_QUERIES.usuarios.findByEmail(data.email);
      const emailResult = await query(emailQuery, emailParams);
      const existingUsuario = emailResult.rows[0];
      
      if (existingUsuario && existingUsuario.id !== id) {
        return res.status(400).json({ error: 'Email já está em uso por outro usuário' });
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.senha !== undefined) updateData.senha = data.senha;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    // Atualizar usuário
    const { query: updateQuery, params: updateParams } = SQL_QUERIES.usuarios.update(id, updateData);
    const updateResult = await query(updateQuery, updateParams);
    const usuario = updateResult.rows[0];

    // Buscar dados do usuário logado para o log
    const { query: userLogadoQuery, params: userLogadoParams } = SQL_QUERIES.usuarios.findById(req.user.id);
    const userLogadoResult = await query(userLogadoQuery, userLogadoParams);
    const userLogado = userLogadoResult.rows[0];

    // Criar log
    const { query: logQuery, params: logParams } = SQL_QUERIES.logs.create({
      usuarioId: req.user.id,
      usuarioNome: userLogado?.nome || 'Admin',
      usuarioEmail: req.user.email,
      acao: 'atualizar',
      entidade: 'usuario',
      entidadeId: usuario.id,
      entidadeNome: usuario.nome,
      detalhes: JSON.stringify(updateData)
    });
    await query(logQuery, logParams);

    // Buscar senha atualizada se necessário
    const { query: userQuery, params: userParams } = SQL_QUERIES.usuarios.findByIdWithPassword(id);
    const userResult = await query(userQuery, userParams);
    const usuarioCompleto = userResult.rows[0];

    res.json({
      id: usuarioCompleto.id,
      nome: usuarioCompleto.nome,
      email: usuarioCompleto.email,
      senha: usuarioCompleto.senha,
      role: usuarioCompleto.role,
      ativo: usuarioCompleto.ativo,
      createdAt: usuarioCompleto.createdAt
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/usuarios/:id - Deletar usuário (soft delete)
router.delete('/:id', async (req: any, res): Promise<any> => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const { query: checkQuery, params: checkParams } = SQL_QUERIES.usuarios.findById(id);
    const checkResult = await query(checkQuery, checkParams);
    
    if (!checkResult.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuarioAntes = checkResult.rows[0];

    // Deletar usuário (soft delete)
    const { query: deleteQuery, params: deleteParams } = SQL_QUERIES.usuarios.delete(id);
    await query(deleteQuery, deleteParams);

    // Buscar dados do usuário logado para o log
    const { query: userLogadoQuery, params: userLogadoParams } = SQL_QUERIES.usuarios.findById(req.user.id);
    const userLogadoResult = await query(userLogadoQuery, userLogadoParams);
    const userLogado = userLogadoResult.rows[0];

    // Criar log
    const { query: logQuery, params: logParams } = SQL_QUERIES.logs.create({
      usuarioId: req.user.id,
      usuarioNome: userLogado?.nome || 'Admin',
      usuarioEmail: req.user.email,
      acao: 'deletar',
      entidade: 'usuario',
      entidadeId: id,
      entidadeNome: usuarioAntes.nome,
      detalhes: JSON.stringify({ email: usuarioAntes.email, role: usuarioAntes.role })
    });
    await query(logQuery, logParams);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;

