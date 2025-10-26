import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

async function createTestEmptyLote() {
  console.log('🧪 Criando lote vazio para teste...\n');

  try {
    // Buscar um cliente existente para associar ao lote
    const { query: clientesQuery, params: clientesParams } = SQL_QUERIES.clientes.findAll(1, 1);
    const clientesResult = await query(clientesQuery, clientesParams);
    const cliente = clientesResult.rows[0];

    if (!cliente) {
      console.log('❌ Nenhum cliente encontrado. Crie um cliente primeiro.');
      return;
    }

    // Criar um lote vazio
    const loteData = {
      codigo: 'TESTE_VAZIO',
      dataEntrega: new Date(),
      modulo: 'solo',
      observacoes: 'Lote de teste vazio',
      status: 'pendente',
      pago: false,
      clienteId: cliente.id,
      rotina: false,
      organica: false,
      micronutrientes: false,
      enxofre: false,
      prem: false,
      nitrogenio: false,
      granulometria: false,
      foliar: false
    };

    const { query: createQuery, params: createParams } = SQL_QUERIES.lotes.create(loteData);
    const createResult = await query(createQuery, createParams);
    const novoLote = createResult.rows[0];

    console.log('✅ Lote vazio criado com sucesso!');
    console.log(`• ID: ${novoLote.id}`);
    console.log(`• Código: ${novoLote.codigo}`);
    console.log(`• Cliente: ${cliente.nome}`);
    console.log(`• Amostras: 0`);
    console.log(`• Status: ${novoLote.status}`);

    console.log('\n📝 Este lote pode ser usado para testar a funcionalidade de limpeza de lotes vazios.');

  } catch (error) {
    console.error('❌ Erro ao criar lote vazio:', error);
  }
}

createTestEmptyLote();