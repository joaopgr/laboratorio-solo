import express from 'express';
import dotenv from 'dotenv';
import { db } from './database/connection';

// Importar rotas
import clienteRoutes from './routes/cliente';
import amostraRoutes from './routes/amostra';
import resultadoRoutes from './routes/resultado';
import loteRoutes from './routes/lote';
import authRoutes from './routes/auth';
import relatorioRoutes from './routes/relatorio';
import laudoRoutes from './routes/laudo';
import atividadeRoutes from './routes/atividade';

// Configuração
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - REMOVIDO HELMET TEMPORARIAMENTE PARA DEBUG CORS
// app.use(helmet());

// Middleware CORS manual - adicionar headers em TODAS as respostas
app.use((req, res, next) => {
  // Headers CORS em TODAS as respostas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Responder a OPTIONS (preflight) imediatamente
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  return next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/amostras', amostraRoutes);
app.use('/api/resultados', resultadoRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/laudos', laudoRoutes);
app.use('/api/atividades', atividadeRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Exportar app para uso no Vercel
export default app;

// Iniciar servidor (apenas em ambiente local, não no Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await db.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await db.close();
    process.exit(0);
  });
}
