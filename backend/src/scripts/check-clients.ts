import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

async function checkClients() {
  console.log('🔍 Verificando clientes existentes...\n');

  try {
    const { query: clientesQuery, params } = SQL_QUERIES.clientes.findAll(1, 1000);
    const result = await query(clientesQuery, params);
    const clientes = result.rows;

    console.log(`📊 Total de clientes: ${clientes.length}`);
    clientes.forEach((cliente: any) => {
      console.log(`• ID: ${cliente.id}`);
      console.log(`• Nome: ${cliente.nome}`);
      console.log(`• Email: ${cliente.email}`);
      console.log('---');
    });

    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado!');
    } else {
      console.log(`✅ Use o ID do primeiro cliente: ${clientes[0].id}`);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar clientes:', error);
  }
}

checkClients();