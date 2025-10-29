// Script para criar usuários iniciais
// Execute: node backend/src/scripts/criarUsuarios.js

require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const { query } = require('../dist/database/connection');

const usuarios = [
  {
    nome: 'Felipe',
    email: 'felipevazandrade@gmail.com',
    senha: 'felipe123',
    role: 'admin'
  },
  {
    nome: 'Carlos',
    email: 'cecostapaiva@gmail.com',
    senha: 'carlos123',
    role: 'admin'
  },
  {
    nome: 'Anderson',
    email: 'andersonbessi@gmail.com',
    senha: 'anderson123',
    role: 'admin'
  },
  {
    nome: 'Ikaro',
    email: 'ikaro.neiva@edu.ufes.br',
    senha: 'ikaro123',
    role: 'admin'
  }
];

async function criarUsuarios() {
  try {
    console.log('Iniciando criação de usuários...\n');
    
    for (const usuarioData of usuarios) {
      // Verificar se usuário já existe
      const checkQuery = 'SELECT id FROM usuarios WHERE email = $1';
      const checkResult = await query(checkQuery, [usuarioData.email]);
      
      if (checkResult.rows.length > 0) {
        console.log(`Usuário ${usuarioData.email} já existe. Atualizando senha...`);
        
        // Atualizar senha
        const senhaHash = await bcrypt.hash(usuarioData.senha, 10);
        const updateQuery = `
          UPDATE usuarios 
          SET nome = $1, senha = $2, role = $3, "updatedAt" = NOW()
          WHERE email = $4
        `;
        await query(updateQuery, [usuarioData.nome, senhaHash, usuarioData.role, usuarioData.email]);
        console.log(`✅ Usuário ${usuarioData.nome} atualizado com sucesso!\n`);
      } else {
        // Criar novo usuário
        const senhaHash = await bcrypt.hash(usuarioData.senha, 10);
        const insertQuery = `
          INSERT INTO usuarios (id, nome, email, senha, role, ativo, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())
        `;
        await query(insertQuery, [usuarioData.nome, usuarioData.email, senhaHash, usuarioData.role]);
        console.log(`✅ Usuário ${usuarioData.nome} criado com sucesso!\n`);
      }
    }
    
    console.log('✅ Todos os usuários foram processados!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
    process.exit(1);
  }
}

criarUsuarios();

