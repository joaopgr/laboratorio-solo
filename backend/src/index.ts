import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

// Middleware
app.use(helmet());

// Configurar CORS para aceitar múltiplas origens do Vercel
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://laboratorio-solo-frontend.vercel.app',
  /\.vercel\.app$/
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (como mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista permitida
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    })) {
      return callback(null, true);
    }
    
    // Para desenvolvimento local, permitir qualquer origem
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
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

// Iniciar servidor
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
