import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
});

// Interface para resultados de query tipados
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  oid: number;
  fields: any[];
}

// Classe para gerenciar conexões e queries
export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = pool;
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Executar query com parâmetros
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Query executada:', { text, duration, rows: result.rowCount });
      return result as QueryResult<T>;
    } catch (error) {
      console.error('Erro na query:', error);
      throw error;
    }
  }

  // Executar query em transação
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obter cliente para operações complexas
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Fechar pool de conexões
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Verificar conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Erro na conexão:', error);
      return false;
    }
  }
}

// Instância singleton
export const db = Database.getInstance();

// Função helper para queries comuns
export const query = <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
  return db.query<T>(text, params);
};

// Função helper para transações
export const transaction = <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  return db.transaction(callback);
};

// Exportar pool para casos especiais
export { pool };

// Testar conexão na inicialização
db.testConnection().then(success => {
  if (success) {
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
  } else {
    console.error('❌ Falha na conexão com PostgreSQL');
  }
});
