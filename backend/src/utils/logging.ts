import { Request, Response } from 'express';
import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

export interface LogData {
  usuarioId?: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  entidadeNome?: string;
  detalhes?: any;
}

// Função para registrar log
export async function registrarLog(req: Request, logData: LogData): Promise<void> {
  try {
    const usuario = (req as any).user; // Dados do usuário do JWT
    
    // Buscar nome completo do usuário se tiver ID mas não tiver nome
    let usuarioNome = logData.usuarioNome;
    let usuarioEmail = logData.usuarioEmail;
    
    if (usuario?.id && !usuarioNome) {
      try {
        const { query: userQuery, params: userParams } = SQL_QUERIES.usuarios.findById(usuario.id);
        const userResult = await query(userQuery, userParams);
        if (userResult.rows[0]) {
          usuarioNome = userResult.rows[0].nome;
          usuarioEmail = userResult.rows[0].email;
        }
      } catch (err) {
        console.error('Erro ao buscar nome do usuário:', err);
      }
    }
    
    const { query: logQuery, params } = SQL_QUERIES.logs.create({
      usuarioId: usuario?.id || logData.usuarioId,
      usuarioNome: usuarioNome || usuario?.nome,
      usuarioEmail: usuarioEmail || usuario?.email,
      acao: logData.acao,
      entidade: logData.entidade,
      entidadeId: logData.entidadeId,
      entidadeNome: logData.entidadeNome,
      detalhes: logData.detalhes ? JSON.stringify(logData.detalhes) : undefined,
      ip: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.get('user-agent') || undefined
    });
    
    await query(logQuery, params);
  } catch (error) {
    // Não falhar a requisição se o log falhar
    console.error('Erro ao registrar log:', error);
  }
}

// Middleware para logar operações CRUD
export function logMiddleware(entidade: string) {
  return async (req: Request, res: Response, next: any) => {
    // Executar a operação original primeiro
    const originalSend = res.json;
    const originalSendStatus = res.sendStatus;
    
    res.json = function(body: any) {
      // Registrar log após a operação bem-sucedida
      const method = req.method;
      let acao = '';
      
      if (method === 'POST') acao = 'criar';
      else if (method === 'PUT' || method === 'PATCH') acao = 'editar';
      else if (method === 'DELETE') acao = 'deletar';
      
      if (acao && body && !(body as any).error) {
        const entidadeId = req.params.id || body.id;
        const entidadeNome = body.nome || body.codigo || body.email || null;
        
        registrarLog(req, {
          acao,
          entidade,
          entidadeId,
          entidadeNome,
          detalhes: body
        }).catch(err => console.error('Erro ao registrar log:', err));
      }
      
      return originalSend.call(this, body);
    };
    
    res.sendStatus = function(statusCode: number) {
      // Para DELETE que retorna 204
      if (req.method === 'DELETE' && statusCode === 204) {
        const entidadeId = req.params.id;
        
        registrarLog(req, {
          acao: 'deletar',
          entidade,
          entidadeId
        }).catch(err => console.error('Erro ao registrar log:', err));
      }
      
      return originalSendStatus.call(this, statusCode);
    };
    
    next();
  };
}

