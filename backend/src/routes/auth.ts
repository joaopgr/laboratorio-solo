import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

const router = express.Router();

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'analista', 'visualizador']).default('analista'),
});

const clientLoginSchema = z.object({
  cpf: z.string().min(11, 'CPF é obrigatório'),
  senha: z.string().min(11, 'Senha é obrigatória'),
});

export const authorizeRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }
    next();
  };
};

// Middleware de autenticação
export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth/login - Login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    
    // Buscar usuário
    const { query: userQuery, params } = SQL_QUERIES.usuarios.findByEmail(email);
    const result = await query(userQuery, params);
    const usuario = result.rows[0];

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha (comparação direta, sem hash)
    if (senha !== usuario.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email, 
        role: usuario.role,
        tipo: 'funcionario'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tipo: 'funcionario'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login-cliente - Login para clientes via CPF
router.post('/login-cliente', async (req, res): Promise<any> => {
  try {
    const { cpf, senha } = clientLoginSchema.parse(req.body);
    const cpfDigits = cpf.replace(/\D/g, '');
    const senhaDigits = senha.replace(/\D/g, '');

    if (!cpfDigits || cpfDigits.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    if (!senhaDigits || senhaDigits.length !== 11) {
      return res.status(400).json({ error: 'Senha inválida' });
    }

    if (cpfDigits !== senhaDigits) {
      return res.status(401).json({ error: 'CPF e senha não conferem' });
    }

    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findByCpf(cpfDigits);
    const clienteResult = await query(clienteQuery, clienteParams);
    const cliente = clienteResult.rows[0];

    if (!cliente) {
      return res.status(401).json({ error: 'CPF não encontrado' });
    }

    const token = jwt.sign(
      {
        clienteId: cliente.id,
        role: 'cliente',
        tipo: 'cliente'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email,
        role: 'cliente',
        tipo: 'cliente'
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro no login de cliente:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register - Registrar usuário
router.post('/register', async (req, res): Promise<any> => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Verificar se email já existe
    const { query: existingQuery, params: existingParams } = SQL_QUERIES.usuarios.findByEmail(data.email);
    const existingResult = await query(existingQuery, existingParams);
    const existingUsuario = existingResult.rows[0];

    if (existingUsuario) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário (senha em texto plano)
    const { query: createQuery, params: createParams } = SQL_QUERIES.usuarios.create({
      ...data,
      senha: data.senha // Sem hash
    });
    const createResult = await query(createQuery, createParams);
    const usuario = createResult.rows[0];

    res.status(201).json(usuario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
router.get('/me', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const role = req.user?.role;

    if (role === 'cliente') {
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

      return res.json({
        id: cliente.id,
        nome: cliente.nome,
        cpf: cliente.cpf,
        email: cliente.email,
        role: 'cliente',
        tipo: 'cliente'
      });
    }

    const { query: userQuery, params } = SQL_QUERIES.usuarios.findById(req.user.id);
    const result = await query(userQuery, params);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      tipo: 'funcionario'
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout - Logout (apenas para invalidar token no frontend)
router.post('/logout', (req, res): any => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// GET /api/auth/users - Listar todos os usuários (apenas para listagem de logs)
router.get('/users', authenticateToken, authorizeRoles('admin', 'analista', 'visualizador'), async (req, res): Promise<any> => {
  try {
    const { query: usersQuery, params } = SQL_QUERIES.usuarios.findAll();
    const result = await query(usersQuery, params);
    
    const usuarios = result.rows.map((u: any) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      role: u.role,
      ativo: u.ativo
    }));
    
    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
