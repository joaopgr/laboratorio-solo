// Vercel Serverless Function
// Este arquivo é usado apenas no deploy do Vercel

// Importar e configurar Express
import express from 'express';
import dotenv from 'dotenv';
import { db } from '../backend/src/database/connection';

// Importar rotas
import authRoutes from '../backend/src/routes/auth';
import clienteRoutes from '../backend/src/routes/cliente';
import amostraRoutes from '../backend/src/routes/amostra';
import resultadoRoutes from '../backend/src/routes/resultado';
import loteRoutes from '../backend/src/routes/lote';
import relatorioRoutes from '../backend/src/routes/relatorio';
import laudoRoutes from '../backend/src/routes/laudo';
import atividadeRoutes from '../backend/src/routes/atividade';

// Configurar
dotenv.config();
const app = express();

// Middleware CORS manual - ADICIONAR HEADERS EM TODAS AS RESPOSTAS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

export default app;

