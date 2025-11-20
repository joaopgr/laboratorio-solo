// Queries SQL para substituir o Prisma
// Baseado no schema.prisma original

export const SQL_QUERIES = {
  // ===== CLIENTES =====
  clientes: {
    // Buscar todos os clientes com paginação
    findAll: (page: number = 1, limit: number = 50, search?: string) => {
      const offset = (page - 1) * limit;
      let query = `
        SELECT id, nome, cpf, email, telefone, cidade, estado, "createdAt", "updatedAt"
        FROM clientes
      `;
      
      const params: any[] = [];
      
      if (search) {
        query += ` WHERE nome ILIKE $1 OR cpf ILIKE $1 OR email ILIKE $1 OR cidade ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      return { query, params };
    },

    // Contar total de clientes
    count: (search?: string) => {
      let query = 'SELECT COUNT(*) as total FROM clientes';
      const params: any[] = [];
      
      if (search) {
        query += ` WHERE nome ILIKE $1 OR cpf ILIKE $1 OR email ILIKE $1 OR cidade ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      return { query, params };
    },

    // Buscar cliente por ID
    findById: (id: string) => ({
      query: 'SELECT * FROM clientes WHERE id = $1',
      params: [id]
    }),

    // Buscar cliente por CPF (ignora formatação)
    findByCpf: (cpf: string) => ({
      query: `
        SELECT * FROM clientes
        WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g')
      `,
      params: [cpf]
    }),

    // Buscar cliente por email
    findByEmail: (email: string) => ({
      query: 'SELECT * FROM clientes WHERE email = $1',
      params: [email]
    }),

    // Criar cliente
    create: (data: {
      nome: string;
      cpf?: string;
      email?: string;
      telefone?: string;
      cidade: string;
      estado: string;
    }) => ({
      query: `
        INSERT INTO clientes (id, nome, cpf, email, telefone, cidade, estado, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `,
      params: [data.nome, data.cpf, data.email, data.telefone, data.cidade, data.estado]
    }),

    // Atualizar cliente
    update: (id: string, data: Partial<{
      nome: string;
      cpf: string;
      email: string;
      telefone: string;
      cidade: string;
      estado: string;
    }>) => {
      const fields = Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`);
      return {
        query: `
          UPDATE clientes 
          SET ${fields.join(', ')}, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `,
        params: [id, ...Object.values(data)]
      };
    },

    // Deletar cliente
    delete: (id: string) => ({
      query: 'DELETE FROM clientes WHERE id = $1',
      params: [id]
    })
  },

  // ===== LOTES =====
  lotes: {
    // Buscar todos os lotes com cliente e amostras
    findAll: (page: number = 1, limit: number = 50, search?: string, status?: string) => {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          l.*,
          c.nome as cliente_nome,
          c.cpf as cliente_cpf,
          c.email as cliente_email,
          c.telefone as cliente_telefone,
          c.cidade as cliente_cidade,
          c.estado as cliente_estado
        FROM lotes_amostras l
        JOIN clientes c ON l."clienteId" = c.id
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (search) {
        conditions.push(`(l.codigo ILIKE $${params.length + 1} OR c.nome ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`l.status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY l."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      return { query, params };
    },

    // Contar total de lotes
    count: (search?: string, status?: string) => {
      let query = `
        SELECT COUNT(*) as total 
        FROM lotes_amostras l
        JOIN clientes c ON l."clienteId" = c.id
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (search) {
        conditions.push(`(l.codigo ILIKE $${params.length + 1} OR c.nome ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`l.status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      return { query, params };
    },

    // Buscar lote por ID
    findById: (id: string) => ({
      query: `
        SELECT 
          l.*,
          c.nome as cliente_nome,
          c.cpf as cliente_cpf,
          c.email as cliente_email,
          c.telefone as cliente_telefone,
          c.cidade as cliente_cidade,
          c.estado as cliente_estado
        FROM lotes_amostras l
        JOIN clientes c ON l."clienteId" = c.id
        WHERE l.id = $1
      `,
      params: [id]
    }),

    // Buscar lote por código
    findByCodigo: (codigo: string) => ({
      query: 'SELECT * FROM lotes_amostras WHERE codigo = $1',
      params: [codigo]
    }),

    // Criar lote
    create: (data: {
      codigo: string;
      clienteId: string;
      observacoes?: string;
      status?: string;
      pago?: boolean;
      modulo?: string;
      rotina?: boolean;
      organica?: boolean;
      enxofre?: boolean;
      micronutrientes?: boolean;
      prem?: boolean;
      nitrogenio?: boolean;
      granulometria?: boolean;
      foliar?: boolean;
    }) => ({
      query: `
        INSERT INTO lotes_amostras (
          id, codigo, "dataEntrega", observacoes, status, pago, "clienteId", 
          "createdAt", "updatedAt", modulo, rotina, organica, enxofre, 
          micronutrientes, prem, nitrogenio, granulometria, foliar
        )
        VALUES (
          gen_random_uuid(), $1, NOW(), $2, $3, $4, $5, NOW(), NOW(), 
          $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING *
      `,
      params: [
        data.codigo, data.observacoes, data.status || 'pendente', 
        data.pago || false, data.clienteId, data.modulo || 'solo',
        data.rotina || false, data.organica || false, data.enxofre || false,
        data.micronutrientes || false, data.prem || false, data.nitrogenio || false,
        data.granulometria || false, data.foliar || false
      ]
    }),

    // Atualizar lote
    update: (id: string, data: Partial<{
      codigo: string;
      observacoes: string;
      status: string;
      pago: boolean;
      modulo: string;
      rotina: boolean;
      organica: boolean;
      enxofre: boolean;
      micronutrientes: boolean;
      prem: boolean;
      nitrogenio: boolean;
      granulometria: boolean;
      foliar: boolean;
    }>) => {
      const fields = Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`);
      return {
        query: `
          UPDATE lotes_amostras 
          SET ${fields.join(', ')}, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `,
        params: [id, ...Object.values(data)]
      };
    },

    // Deletar lote
    delete: (id: string) => ({
      query: 'DELETE FROM lotes_amostras WHERE id = $1',
      params: [id]
    }),

    // Buscar lotes por cliente
    findByCliente: (clienteId: string) => ({
      query: `
        SELECT 
          l.id,
          l.codigo,
          l.status,
          l."dataEntrega",
          l.pago,
          l.observacoes,
          l.desconto,
          l.modulo,
          COUNT(a.id) as amostras_count
        FROM lotes_amostras l
        LEFT JOIN amostras a ON l.id = a."loteId"
        WHERE l."clienteId" = $1
        GROUP BY l.id, l.codigo, l.status, l."dataEntrega", l.pago, l.observacoes, l.desconto, l.modulo
        ORDER BY l."dataEntrega" DESC
      `,
      params: [clienteId]
    }),

    // Buscar lotes vazios (sem amostras)
    findEmpty: () => ({
      query: `
        SELECT l.*
        FROM lotes_amostras l
        LEFT JOIN amostras a ON l.id = a."loteId"
        WHERE a.id IS NULL
        ORDER BY l."createdAt" DESC
      `,
      params: []
    }),
  },

  // ===== AMOSTRAS =====
  amostras: {
    // Buscar todas as amostras com lote e cliente
    findAll: (page: number = 1, limit: number = 50, search?: string, status?: string) => {
      const offset = (page - 1) * limit;
      let query = `
        SELECT 
          a.*,
          l.codigo as lote_codigo,
          c.nome as cliente_nome
        FROM amostras a
        JOIN lotes_amostras l ON a."loteId" = l.id
        JOIN clientes c ON l."clienteId" = c.id
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (search) {
        conditions.push(`(a.codigo ILIKE $${params.length + 1} OR a.identificacao ILIKE $${params.length + 1} OR c.nome ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`a.status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY a."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      return { query, params };
    },

    // Contar total de amostras
    count: (search?: string, status?: string) => {
      let query = `
        SELECT COUNT(*) as total 
        FROM amostras a
        JOIN lotes_amostras l ON a."loteId" = l.id
        JOIN clientes c ON l."clienteId" = c.id
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (search) {
        conditions.push(`(a.codigo ILIKE $${params.length + 1} OR a.identificacao ILIKE $${params.length + 1} OR c.nome ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`a.status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      return { query, params };
    },

    // Buscar amostra por ID
    findById: (id: string) => ({
      query: `
        SELECT 
          a.*,
          l.codigo as lote_codigo,
          c.nome as cliente_nome
        FROM amostras a
        JOIN lotes_amostras l ON a."loteId" = l.id
        JOIN clientes c ON l."clienteId" = c.id
        WHERE a.id = $1
      `,
      params: [id]
    }),

    // Buscar amostra por código
    findByCodigo: (codigo: string) => ({
      query: 'SELECT * FROM amostras WHERE codigo = $1',
      params: [codigo]
    }),

    // Buscar amostras por lote
    findByLote: (loteId: string) => ({
      query: 'SELECT * FROM amostras WHERE "loteId" = $1 ORDER BY "createdAt"',
      params: [loteId]
    }),

    // Buscar amostras por cliente (através dos lotes)
    findByCliente: (clienteId: string) => ({
      query: `
        SELECT a.*
        FROM amostras a
        JOIN lotes_amostras l ON a."loteId" = l.id
        WHERE l."clienteId" = $1
        ORDER BY a."dataRecebimento" DESC
      `,
      params: [clienteId]
    }),

    // Criar amostra
    create: (data: {
      codigo: string;
      identificacao: string;
      cultura: string;
      loteId: string;
      localidade?: string;
      dataColeta?: Date;
      observacoes?: string;
      rotina?: boolean;
      organica?: boolean;
      status?: string;
      pago?: boolean;
      modulo?: string;
      enxofre?: boolean;
      micronutrientes?: boolean;
      prem?: boolean;
      nitrogenio?: boolean;
      granulometria?: boolean;
      foliar?: boolean;
      propriedade?: string;
      solicitante?: string;
    }) => ({
      query: `
        INSERT INTO amostras (
          id, codigo, identificacao, cultura, "loteId", localidade, "dataColeta", 
          "dataRecebimento", observacoes, rotina, organica, status, pago, 
          "createdAt", "updatedAt", modulo, enxofre, micronutrientes, prem, 
          nitrogenio, granulometria, foliar, propriedade, solicitante
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, 
          NOW(), NOW(), $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *
      `,
      params: [
        data.codigo, data.identificacao, data.cultura, data.loteId, data.localidade,
        data.dataColeta, data.observacoes, data.rotina || false, data.organica || false,
        data.status || 'pendente', data.pago || false, data.modulo || 'solo',
        data.enxofre || false, data.micronutrientes || false, data.prem || false,
        data.nitrogenio || false, data.granulometria || false, data.foliar || false,
        data.propriedade, data.solicitante
      ]
    }),

    // Atualizar amostra
    update: (id: string, data: Partial<{
      codigo: string;
      identificacao: string;
      cultura: string;
      localidade: string;
      dataColeta: Date;
      observacoes: string;
      rotina: boolean;
      organica: boolean;
      status: string;
      pago: boolean;
      modulo: string;
      enxofre: boolean;
      micronutrientes: boolean;
      prem: boolean;
      nitrogenio: boolean;
      granulometria: boolean;
      foliar: boolean;
      propriedade: string;
      solicitante: string;
    }>) => {
      const fields = Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`);
      return {
        query: `
          UPDATE amostras 
          SET ${fields.join(', ')}, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `,
        params: [id, ...Object.values(data)]
      };
    },

    // Deletar amostra
    delete: (id: string) => ({
      query: 'DELETE FROM amostras WHERE id = $1',
      params: [id]
    })
  },

  // ===== RESULTADOS =====
  resultados: {
    // Buscar resultado por amostra
    findByAmostra: (amostraId: string) => ({
      query: 'SELECT * FROM resultados WHERE "amostraId" = $1 ORDER BY "createdAt" DESC',
      params: [amostraId]
    }),

    // Buscar resultado por ID
    findById: (id: string) => ({
      query: 'SELECT * FROM resultados WHERE id = $1',
      params: [id]
    }),

    // Criar resultado
    create: (data: any) => {
      const fields = Object.keys(data).filter(key => data[key] !== undefined);
      const values = fields.map((_, index) => `$${index + 1}`);
      
      return {
        query: `
          INSERT INTO resultados (id, ${fields.map(f => `"${f}"`).join(', ')}, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${values.join(', ')}, NOW(), NOW())
          RETURNING *
        `,
        params: fields.map(field => data[field])
      };
    },

    // Atualizar resultado
    update: (id: string, data: any) => {
      const fields = Object.keys(data).filter(key => data[key] !== undefined);
      const setClause = fields.map((field, index) => `"${field}" = $${index + 2}`);
      
      return {
        query: `
          UPDATE resultados 
          SET ${setClause.join(', ')}, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING *
        `,
        params: [id, ...fields.map(field => data[field])]
      };
    },

    // Deletar resultado
    delete: (id: string) => ({
      query: 'DELETE FROM resultados WHERE id = $1',
      params: [id]
    }),

    // Deletar todos os resultados de uma amostra
    deleteByAmostra: (amostraId: string) => ({
      query: 'DELETE FROM resultados WHERE "amostraId" = $1',
      params: [amostraId]
    }),

    countByCliente: (clienteId: string) => ({
      query: `
        SELECT COUNT(*) as total
        FROM resultados r
        JOIN amostras a ON r."amostraId" = a.id
        JOIN lotes_amostras l ON a."loteId" = l.id
        WHERE l."clienteId" = $1
      `,
      params: [clienteId]
    })
  },

  // ===== USUÁRIOS =====
  usuarios: {
    // Buscar todos os usuários
    findAll: () => ({
      query: 'SELECT id, nome, email, role, ativo, "createdAt" FROM usuarios WHERE ativo = true ORDER BY nome',
      params: []
    }),

    // Buscar usuário por email
    findByEmail: (email: string) => ({
      query: 'SELECT * FROM usuarios WHERE email = $1',
      params: [email]
    }),

    // Buscar usuário por ID
    findById: (id: string) => ({
      query: 'SELECT id, nome, email, role, ativo, "createdAt" FROM usuarios WHERE id = $1',
      params: [id]
    }),

    // Criar usuário
    create: (data: {
      nome: string;
      email: string;
      senha: string;
      role?: string;
      ativo?: boolean;
    }) => ({
      query: `
        INSERT INTO usuarios (id, nome, email, senha, role, ativo, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, nome, email, role, ativo, "createdAt"
      `,
      params: [
        data.nome, 
        data.email, 
        data.senha, 
        data.role || 'analista', 
        data.ativo !== undefined ? data.ativo : true
      ]
    }),

    // Atualizar usuário
    update: (id: string, data: Partial<{
      nome: string;
      email: string;
      senha: string;
      role: string;
      ativo: boolean;
    }>) => {
      const fields = Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`);
      return {
        query: `
          UPDATE usuarios 
          SET ${fields.join(', ')}, "updatedAt" = NOW()
          WHERE id = $1
          RETURNING id, nome, email, role, ativo, "createdAt"
        `,
        params: [id, ...Object.values(data)]
      };
    },

    // Contar usuários
    count: () => ({
      query: 'SELECT COUNT(*) as total FROM usuarios',
      params: []
    })
  },

  // ===== ATIVIDADES =====
  atividades: {
    // Buscar todas as atividades
    findAll: (page: number = 1, limit: number = 50, search?: string, status?: string, prioridade?: string, tipo?: string, nomeUsuarioLogado?: string, modo?: string) => {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM atividades';
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      // Filtrar por modo: 'recebidas' (onde é responsável) ou 'criadas' (onde é criador)
      if (nomeUsuarioLogado) {
        if (modo === 'criadas') {
          // Modo "Criadas": mostrar atividades onde o usuário é o criador
          // Usar TRIM e comparação case-insensitive para garantir match
          // IMPORTANTE: Se criadoPor for NULL ou vazio, não deve aparecer em "Criadas"
          conditions.push(`"criadoPor" IS NOT NULL AND TRIM("criadoPor") ILIKE TRIM($${params.length + 1})`);
          params.push(nomeUsuarioLogado);
        } else {
          // Modo "Recebidas" (padrão): mostrar atividades onde:
          // - responsavel = 'Geral' OU
          // - responsavel contém o nome do usuário logado (ex: "Felipe" ou "Felipe, Anderson")
          const paramIndex1 = params.length + 1;
          const paramIndex2 = params.length + 2;
          const paramIndex3 = params.length + 3;
          const paramIndex4 = params.length + 4;
          conditions.push(`(
            responsavel = $${paramIndex1} OR 
            responsavel ILIKE $${paramIndex2} OR 
            responsavel ILIKE $${paramIndex3} OR 
            responsavel ILIKE $${paramIndex4} OR
            responsavel IS NULL
          )`);
          params.push('Geral', `${nomeUsuarioLogado}%`, `%, ${nomeUsuarioLogado}%`, `%, ${nomeUsuarioLogado}`);
        }
      }
      
      if (search) {
        conditions.push(`(titulo ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1} OR responsavel ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (prioridade) {
        conditions.push(`prioridade = $${params.length + 1}`);
        params.push(prioridade);
      }
      
      if (tipo) {
        conditions.push(`tipo = $${params.length + 1}`);
        params.push(tipo);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY 
        CASE prioridade 
          WHEN 'urgente' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END, "createdAt" DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      return { query, params };
    },

    // Contar atividades
    count: (search?: string, status?: string, prioridade?: string, tipo?: string, nomeUsuarioLogado?: string, modo?: string) => {
      let query = 'SELECT COUNT(*) as total FROM atividades';
      
      const params: any[] = [];
      const conditions: string[] = [];
      
      // Filtrar por modo: 'recebidas' (onde é responsável) ou 'criadas' (onde é criador)
      if (nomeUsuarioLogado) {
        if (modo === 'criadas') {
          // Modo "Criadas": mostrar atividades onde o usuário é o criador
          // Usar TRIM e comparação case-insensitive para garantir match
          // IMPORTANTE: Se criadoPor for NULL ou vazio, não deve aparecer em "Criadas"
          conditions.push(`"criadoPor" IS NOT NULL AND TRIM("criadoPor") ILIKE TRIM($${params.length + 1})`);
          params.push(nomeUsuarioLogado);
        } else {
          // Modo "Recebidas" (padrão): mostrar atividades onde:
          // - responsavel = 'Geral' OU
          // - responsavel contém o nome do usuário logado (ex: "Felipe" ou "Felipe, Anderson")
          const paramIndex1 = params.length + 1;
          const paramIndex2 = params.length + 2;
          const paramIndex3 = params.length + 3;
          const paramIndex4 = params.length + 4;
          conditions.push(`(
            responsavel = $${paramIndex1} OR 
            responsavel ILIKE $${paramIndex2} OR 
            responsavel ILIKE $${paramIndex3} OR 
            responsavel ILIKE $${paramIndex4} OR
            responsavel IS NULL
          )`);
          params.push('Geral', `${nomeUsuarioLogado}%`, `%, ${nomeUsuarioLogado}%`, `%, ${nomeUsuarioLogado}`);
        }
      }
      
      if (search) {
        conditions.push(`(titulo ILIKE $${params.length + 1} OR descricao ILIKE $${params.length + 1} OR responsavel ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (prioridade) {
        conditions.push(`prioridade = $${params.length + 1}`);
        params.push(prioridade);
      }
      
      if (tipo) {
        conditions.push(`tipo = $${params.length + 1}`);
        params.push(tipo);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      return { query, params };
    },

    // Buscar atividade por ID
    findById: (id: string) => ({
      query: 'SELECT * FROM atividades WHERE id = $1',
      params: [id]
    }),

    // Criar atividade
    create: (data: {
      titulo?: string;
      nome?: string;
      descricao?: string;
      tipo?: string;
      prioridade?: string;
      status?: string;
      responsavel?: string;
      prazo?: Date;
    }) => {
      // Tentar usar titulo se disponível, caso contrário usar nome (para compatibilidade)
      const campoTitulo = data.titulo || data.nome || 'Sem título';
      
      return {
        query: `
          INSERT INTO atividades (id, titulo, descricao, tipo, prioridade, status, responsavel, prazo, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `,
        params: [
          campoTitulo,
          data.descricao || null,
          data.tipo || 'tarefa',
          data.prioridade || 'media',
          data.status || 'pendente',
          data.responsavel || null,
          data.prazo || null
        ]
      };
    },

    // Atualizar atividade
    update: (id: string, data: Partial<{
      titulo: string;
      descricao: string;
      tipo: string;
      prioridade: string;
      status: string;
      responsavel: string;
      prazo: Date;
    }>) => {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 2;
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          updates.push(`"${key}" = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });
      
      if (updates.length === 0) {
        // Se não há nada para atualizar, retornar atividade original
        return {
          query: 'SELECT * FROM atividades WHERE id = $1',
          params: [id]
        };
      }
      
      updates.push('"updatedAt" = NOW()');
      
      return {
        query: `
          UPDATE atividades 
          SET ${updates.join(', ')}
          WHERE id = $1
          RETURNING *
        `,
        params: [id, ...values]
      };
    },

    // Deletar atividade
    delete: (id: string) => ({
      query: 'DELETE FROM atividades WHERE id = $1',
      params: [id]
    })
  },

  // ===== LOGS =====
  logs: {
    // Buscar logs com filtros
    findAll: (page: number = 1, limit: number = 50, filters?: {
      usuarioId?: string;
      acao?: string;
      entidade?: string;
      dataInicio?: string;
      dataFim?: string;
    }) => {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM logs_sistema';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (filters?.usuarioId) {
        conditions.push(`"usuarioId" = $${params.length + 1}`);
        params.push(filters.usuarioId);
      }
      
      if (filters?.acao) {
        conditions.push(`acao = $${params.length + 1}`);
        params.push(filters.acao);
      }
      
      if (filters?.entidade) {
        conditions.push(`entidade = $${params.length + 1}`);
        params.push(filters.entidade);
      }
      
      if (filters?.dataInicio) {
        conditions.push(`"createdAt" >= $${params.length + 1}`);
        params.push(filters.dataInicio);
      }
      
      if (filters?.dataFim) {
        conditions.push(`"createdAt" <= $${params.length + 1}`);
        params.push(filters.dataFim);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      return { query, params };
    },
    
    // Contar logs
    count: (filters?: {
      usuarioId?: string;
      acao?: string;
      entidade?: string;
      dataInicio?: string;
      dataFim?: string;
    }) => {
      let query = 'SELECT COUNT(*) as total FROM logs_sistema';
      const params: any[] = [];
      const conditions: string[] = [];
      
      if (filters?.usuarioId) {
        conditions.push(`"usuarioId" = $${params.length + 1}`);
        params.push(filters.usuarioId);
      }
      
      if (filters?.acao) {
        conditions.push(`acao = $${params.length + 1}`);
        params.push(filters.acao);
      }
      
      if (filters?.entidade) {
        conditions.push(`entidade = $${params.length + 1}`);
        params.push(filters.entidade);
      }
      
      if (filters?.dataInicio) {
        conditions.push(`"createdAt" >= $${params.length + 1}`);
        params.push(filters.dataInicio);
      }
      
      if (filters?.dataFim) {
        conditions.push(`"createdAt" <= $${params.length + 1}`);
        params.push(filters.dataFim);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      return { query, params };
    },
    
    // Criar log
    create: (data: {
      usuarioId?: string;
      usuarioNome?: string;
      usuarioEmail?: string;
      acao: string;
      entidade: string;
      entidadeId?: string;
      entidadeNome?: string;
      detalhes?: string;
      ip?: string;
      userAgent?: string;
    }) => ({
      query: `
        INSERT INTO logs_sistema (id, "usuarioId", "usuarioNome", "usuarioEmail", acao, entidade, "entidadeId", "entidadeNome", detalhes, ip, "userAgent", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `,
      params: [
        data.usuarioId || null,
        data.usuarioNome || null,
        data.usuarioEmail || null,
        data.acao,
        data.entidade,
        data.entidadeId || null,
        data.entidadeNome || null,
        data.detalhes || null,
        data.ip || null,
        data.userAgent || null
      ]
    })
  },

  // ===== RELATÓRIOS =====
  relatorios: {
    // Buscar relatórios gerados
    findAll: (page: number = 1, limit: number = 50) => {
      const offset = (page - 1) * limit;
      return {
        query: `
          SELECT * FROM relatorios_gerados 
          ORDER BY "createdAt" DESC 
          LIMIT $1 OFFSET $2
        `,
        params: [limit, offset]
      };
    },

    // Buscar relatório por ID
    findById: (id: string) => ({
      query: 'SELECT * FROM relatorios_gerados WHERE id = $1',
      params: [id]
    }),

    // Criar relatório
    create: (data: {
      tipo: string;
      nome: string;
      filtros?: any;
      dados: any;
      arquivoUrl?: string;
    }) => ({
      query: `
        INSERT INTO relatorios_gerados (id, tipo, nome, filtros, dados, "arquivoUrl", "createdAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
        RETURNING *
      `,
      params: [data.tipo, data.nome, JSON.stringify(data.filtros), JSON.stringify(data.dados), data.arquivoUrl]
    }),

    // Deletar relatório
    delete: (id: string) => ({
      query: 'DELETE FROM relatorios_gerados WHERE id = $1',
      params: [id]
    })
  }
};
