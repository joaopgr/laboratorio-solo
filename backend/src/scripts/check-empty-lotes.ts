import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

async function checkEmptyLotes() {
  console.log('🔍 Verificando lotes vazios no sistema...\n');

  try {
    // Verificar todos os lotes
    const { query: todosLotesQuery, params: todosLotesParams } = SQL_QUERIES.lotes.findAll(1, 10000);
    const todosLotesResult = await query(todosLotesQuery, todosLotesParams);
    const todosLotes = todosLotesResult.rows;

    console.log(`📊 Total de lotes no sistema: ${todosLotes.length}`);
    
    // Buscar amostras para cada lote
    for (const lote of todosLotes) {
      const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(lote.id);
      const amostrasResult = await query(amostrasQuery, amostrasParams);
      lote.amostras = amostrasResult.rows;

      const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId);
      const clienteResult = await query(clienteQuery, clienteParams);
      lote.cliente = clienteResult.rows[0];

      console.log(`• ${lote.codigo} (${lote.cliente.nome}): ${lote.amostras.length} amostras`);
    }

    // Verificar lotes vazios
    const lotesVazios = todosLotes.filter((lote: any) => lote.amostras.length === 0);

    console.log(`\n🗑️ Lotes vazios: ${lotesVazios.length}`);
    lotesVazios.forEach((lote: any) => {
      console.log(`• ${lote.codigo} (${lote.cliente.nome})`);
    });

    if (lotesVazios.length === 0) {
      console.log('\n✅ Não há lotes vazios para remover.');
    } else {
      console.log('\n🎯 Há lotes vazios que podem ser removidos!');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar lotes vazios:', error);
  }
}

checkEmptyLotes();