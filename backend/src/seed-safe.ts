import { query } from './database/connection';
import { SQL_QUERIES } from './database/queries';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Iniciando seed seguro do banco de dados...');

  try {
    // Verificar se já existem dados
    const { query: clientesCountQuery, params: clientesCountParams } = SQL_QUERIES.clientes.count('');
    const clientesCountResult = await query(clientesCountQuery, clientesCountParams);
    const existingClientes = parseInt(clientesCountResult.rows[0].total);

    const { query: amostrasCountQuery, params: amostrasCountParams } = SQL_QUERIES.amostras.findAll(1, 1);
    const amostrasCountResult = await query(amostrasCountQuery, amostrasCountParams);
    const existingAmostras = amostrasCountResult.rows.length;
    
    if (existingClientes > 0 || existingAmostras > 0) {
      console.log('⚠️  Dados já existem no banco!');
      console.log(`   - Clientes: ${existingClientes}`);
      console.log(`   - Amostras: ${existingAmostras}`);
      console.log('   - Pulando seed para preservar dados existentes');
      return;
    }

    // Criar usuários de exemplo
    const adminPassword = await bcrypt.hash('admin123', 10);
    const analistaPassword = await bcrypt.hash('analista123', 10);

    // Verificar se admin já existe
    const { query: adminCheckQuery, params: adminCheckParams } = SQL_QUERIES.usuarios.findByEmail('admin@laboratorio.com');
    const adminCheckResult = await query(adminCheckQuery, adminCheckParams);
    
    if (!adminCheckResult.rows[0]) {
      const { query: adminCreateQuery, params: adminCreateParams } = SQL_QUERIES.usuarios.create({
        nome: 'Administrador',
        email: 'admin@laboratorio.com',
        senha: adminPassword,
        role: 'admin',
        ativo: true
      });
      const adminResult = await query(adminCreateQuery, adminCreateParams);
      console.log('✅ Usuário admin criado:', adminResult.rows[0].email);
    } else {
      console.log('✅ Usuário admin já existe');
    }

    // Verificar se analista já existe
    const { query: analistaCheckQuery, params: analistaCheckParams } = SQL_QUERIES.usuarios.findByEmail('analista@laboratorio.com');
    const analistaCheckResult = await query(analistaCheckQuery, analistaCheckParams);
    
    if (!analistaCheckResult.rows[0]) {
      const { query: analistaCreateQuery, params: analistaCreateParams } = SQL_QUERIES.usuarios.create({
        nome: 'Analista',
        email: 'analista@laboratorio.com',
        senha: analistaPassword,
        role: 'analista',
        ativo: true
      });
      const analistaResult = await query(analistaCreateQuery, analistaCreateParams);
      console.log('✅ Usuário analista criado:', analistaResult.rows[0].email);
    } else {
      console.log('✅ Usuário analista já existe');
    }

    // Criar clientes de exemplo
    const clientesData = [
      {
        nome: 'João Silva',
        cpf: '123.456.789-01',
        email: 'joao.silva@email.com',
        telefone: '(27) 99999-1111',
        cidade: 'Vargem Alta',
        estado: 'ES'
      },
      {
        nome: 'Maria Santos',
        cpf: '987.654.321-02',
        email: 'maria.santos@email.com',
        telefone: '(27) 99999-2222',
        cidade: 'Cachoeiro de Itapemirim',
        estado: 'ES'
      },
      {
        nome: 'Pedro Oliveira',
        cpf: '456.789.123-03',
        email: 'pedro.oliveira@email.com',
        telefone: '(27) 99999-3333',
        cidade: 'Itapemirim',
        estado: 'ES'
      }
    ];

    const clientes = [];
    for (const clienteData of clientesData) {
      // Verificar se cliente já existe
      const { query: clienteCheckQuery, params: clienteCheckParams } = SQL_QUERIES.clientes.findByCpf(clienteData.cpf);
      const clienteCheckResult = await query(clienteCheckQuery, clienteCheckParams);
      
      if (!clienteCheckResult.rows[0]) {
        const { query: clienteCreateQuery, params: clienteCreateParams } = SQL_QUERIES.clientes.create(clienteData);
        const clienteResult = await query(clienteCreateQuery, clienteCreateParams);
        clientes.push(clienteResult.rows[0]);
      }
    }

    console.log('✅ Clientes criados:', clientes.length);

    // Criar lotes de exemplo
    const lotesData = [
      {
        codigo: '1',
        dataEntrega: new Date('2024-01-15'),
        observacoes: 'Lote de exemplo para testes',
        status: 'concluido',
        pago: true,
        clienteId: clientes[0]?.id || '1',
        modulo: 'solo',
        rotina: true,
        organica: true,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: false
      },
      {
        codigo: '2',
        dataEntrega: new Date('2024-01-20'),
        observacoes: 'Lote com análises completas',
        status: 'em_analise',
        pago: false,
        clienteId: clientes[1]?.id || '2',
        modulo: 'solo',
        rotina: true,
        organica: true,
        micronutrientes: true,
        enxofre: true,
        prem: false,
        nitrogenio: true,
        granulometria: true,
        foliar: false
      },
      {
        codigo: 'F1',
        dataEntrega: new Date('2024-01-25'),
        observacoes: 'Lote foliar de exemplo',
        status: 'pendente',
        pago: false,
        clienteId: clientes[2]?.id || '3',
        modulo: 'foliar',
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: true
      }
    ];

    const lotes = [];
    for (const loteData of lotesData) {
      // Verificar se lote já existe
      const { query: loteCheckQuery, params: loteCheckParams } = SQL_QUERIES.lotes.findByCodigo(loteData.codigo);
      const loteCheckResult = await query(loteCheckQuery, loteCheckParams);
      
      if (!loteCheckResult.rows[0]) {
        const { query: loteCreateQuery, params: loteCreateParams } = SQL_QUERIES.lotes.create(loteData);
        const loteResult = await query(loteCreateQuery, loteCreateParams);
        lotes.push(loteResult.rows[0]);
      }
    }

    console.log('✅ Lotes criados:', lotes.length);

    // Criar amostras de exemplo
    const amostrasData = [
      {
        codigo: '1',
        identificacao: 'Amostra Solo 1',
        cultura: 'Café',
        localidade: 'Fazenda São José',
        propriedade: 'Propriedade Rural',
        solicitante: 'João Silva',
        dataColeta: new Date('2024-01-10'),
        observacoes: 'Amostra coletada na profundidade de 0-20cm',
        modulo: 'solo',
        rotina: true,
        organica: true,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: false,
        pago: true,
        loteId: lotes[0]?.id || '1'
      },
      {
        codigo: '2',
        identificacao: 'Amostra Solo 2',
        cultura: 'Milho',
        localidade: 'Sítio Boa Vista',
        propriedade: 'Propriedade Familiar',
        solicitante: 'Maria Santos',
        dataColeta: new Date('2024-01-15'),
        observacoes: 'Amostra coletada na profundidade de 0-20cm',
        modulo: 'solo',
        rotina: true,
        organica: true,
        micronutrientes: true,
        enxofre: true,
        prem: false,
        nitrogenio: true,
        granulometria: true,
        foliar: false,
        pago: false,
        loteId: lotes[1]?.id || '2'
      },
      {
        codigo: 'F1',
        identificacao: 'Amostra Foliar 1',
        cultura: 'Café',
        localidade: 'Fazenda Esperança',
        propriedade: 'Propriedade Comercial',
        solicitante: 'Pedro Oliveira',
        dataColeta: new Date('2024-01-20'),
        observacoes: 'Amostra foliar coletada em folhas maduras',
        modulo: 'foliar',
        rotina: false,
        organica: false,
        micronutrientes: false,
        enxofre: false,
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: true,
        pago: false,
        loteId: lotes[2]?.id || '3'
      }
    ];

    const amostras = [];
    for (const amostraData of amostrasData) {
      // Verificar se amostra já existe
      const { query: amostraCheckQuery, params: amostraCheckParams } = SQL_QUERIES.amostras.findByCodigo(amostraData.codigo);
      const amostraCheckResult = await query(amostraCheckQuery, amostraCheckParams);
      
      if (!amostraCheckResult.rows[0]) {
        const { query: amostraCreateQuery, params: amostraCreateParams } = SQL_QUERIES.amostras.create(amostraData);
        const amostraResult = await query(amostraCreateQuery, amostraCreateParams);
        amostras.push(amostraResult.rows[0]);
      }
    }

    console.log('✅ Amostras criadas:', amostras.length);

    // Criar alguns resultados de exemplo
    const resultadosData = [
      {
        amostraId: amostras[0]?.id || '1',
        tipo: 'pH',
        categoria: 'solo',
        valor: '6.5',
        unidade: '',
        dataAnalise: new Date('2024-01-12'),
        observacoes: 'Análise de pH realizada'
      },
      {
        amostraId: amostras[0]?.id || '1',
        tipo: 'P',
        categoria: 'solo',
        valor: '15.2',
        unidade: 'mg/dm³',
        diluicao: '1',
        dataAnalise: new Date('2024-01-12'),
        observacoes: 'Análise de fósforo realizada'
      },
      {
        amostraId: amostras[0]?.id || '1',
        tipo: 'MO',
        categoria: 'solo',
        valor: '25.8',
        unidade: 'g/kg',
        dataAnalise: new Date('2024-01-12'),
        observacoes: 'Análise de matéria orgânica realizada'
      }
    ];

    const resultados = [];
    for (const resultadoData of resultadosData) {
      const { query: resultadoCreateQuery, params: resultadoCreateParams } = SQL_QUERIES.resultados.create(resultadoData);
      const resultadoResult = await query(resultadoCreateQuery, resultadoCreateParams);
      resultados.push(resultadoResult.rows[0]);
    }

    console.log('✅ Resultados criados:', resultados.length);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Usuários: 2`);
    console.log(`   - Clientes: ${clientes.length}`);
    console.log(`   - Lotes: ${lotes.length}`);
    console.log(`   - Amostras: ${amostras.length}`);
    console.log(`   - Resultados: ${resultados.length}`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  }
}

main();