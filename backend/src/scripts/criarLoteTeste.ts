import { query } from '../database/connection';
import { SQL_QUERIES } from '../database/queries';

async function criarLoteTeste() {
  try {
    console.log('🚀 Iniciando criação de lote de teste...');

    // 1. Buscar ou criar cliente de teste
    let clienteId: string;
    const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findByCpf('00000000000');
    const clienteResult = await query(clienteQuery, clienteParams);
    
    if (clienteResult.rows[0]) {
      clienteId = clienteResult.rows[0].id;
      console.log('✅ Cliente de teste encontrado:', clienteResult.rows[0].nome);
    } else {
      // Criar cliente de teste
      const { query: createClienteQuery, params: createClienteParams } = SQL_QUERIES.clientes.create({
        nome: 'Cliente Teste - Lote Solo',
        cpf: '00000000000',
        email: 'teste@laboratorio.com',
        telefone: '(27) 99999-9999',
        cidade: 'Vitória',
        estado: 'ES'
      });
      const novoCliente = await query(createClienteQuery, createClienteParams);
      clienteId = novoCliente.rows[0].id;
      console.log('✅ Cliente de teste criado');
    }

    // 2. Criar lote de solo
    const codigoLote = `LOTE-TESTE-${Date.now()}`;
    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.create({
      codigo: codigoLote,
      clienteId: clienteId,
      observacoes: 'Lote de teste com 15 amostras de solo para testes de geração de laudos',
      status: 'concluido',
      pago: true,
      modulo: 'solo',
      rotina: true,
      organica: true,
      micronutrientes: true,
      enxofre: true,
      prem: false,
      nitrogenio: false,
      granulometria: false,
      foliar: false
    });
    const loteResult = await query(loteQuery, loteParams);
    const loteId = loteResult.rows[0].id;
    console.log('✅ Lote criado:', codigoLote);

    // 3. Criar 15 amostras
    const amostrasIds: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const { query: amostraQuery, params: amostraParams } = SQL_QUERIES.amostras.create({
        codigo: `TESTE-${i.toString().padStart(3, '0')}`,
        identificacao: `Amostra Teste ${i}`,
        cultura: i % 3 === 0 ? 'Café' : i % 3 === 1 ? 'Milho' : 'Soja',
        localidade: `Localidade Teste ${i}`,
        dataColeta: new Date(2024, 0, i).toISOString(),
        observacoes: `Amostra de teste ${i} para geração de laudos`,
        loteId: loteId,
        tipoAnalise: 'solo',
        rotina: true,
        organica: i % 2 === 0, // Metade com matéria orgânica
        micronutrientes: true,
        enxofre: i % 3 === 0, // Um terço com enxofre
        prem: false,
        nitrogenio: false,
        granulometria: false,
        foliar: false
      });
      const amostraResult = await query(amostraQuery, amostraParams);
      amostrasIds.push(amostraResult.rows[0].id);
      console.log(`✅ Amostra ${i}/15 criada: TESTE-${i.toString().padStart(3, '0')}`);
    }

    // 4. Criar resultados para cada amostra
    const tiposResultados = ['PH', 'P', 'K', 'CA', 'MG', 'NA', 'AL', 'H_AL', 'MO', 'S', 'FE', 'MN', 'CU', 'ZN', 'B'];
    
    for (let i = 0; i < amostrasIds.length; i++) {
      const amostraId = amostrasIds[i];
      
      // Valores de exemplo variados para cada amostra
      const valoresBase = {
        PH: 5.5 + (i * 0.1),
        P: 10 + (i * 2),
        K: 80 + (i * 5),
        CA: 2.5 + (i * 0.1),
        MG: 1.2 + (i * 0.05),
        NA: 0.1 + (i * 0.01),
        AL: 0.5 + (i * 0.05),
        H_AL: 2.0 + (i * 0.1),
        MO: 2.5 + (i * 0.1),
        S: 5.0 + (i * 0.2),
        FE: 50 + (i * 2),
        MN: 20 + (i * 1),
        CU: 2.0 + (i * 0.1),
        ZN: 3.0 + (i * 0.15),
        B: 0.5 + (i * 0.02)
      };

      for (const tipo of tiposResultados) {
        const valor = valoresBase[tipo as keyof typeof valoresBase];
        
        // Criar resultado bruto
        const resultadoData: any = {
          amostraId: amostraId,
          tipo: tipo,
          origem: 'bruto',
          categoria: 'solo',
          unidade: tipo === 'PH' ? 'H₂O' : tipo === 'MO' ? '%' : 'mg/dm³'
        };

        // Adicionar campos específicos baseado no tipo
        if (tipo === 'PH') {
          resultadoData.ph = valor;
        } else if (tipo === 'P') {
          resultadoData.pAbs = valor;
          resultadoData.diluicaoP = 1;
        } else if (tipo === 'K') {
          resultadoData.k = valor;
          resultadoData.diluicaoK = 1;
        } else if (tipo === 'CA') {
          resultadoData.ca = valor;
          resultadoData.diluicaoCa = 1;
        } else if (tipo === 'MG') {
          resultadoData.mg = valor;
          resultadoData.diluicaoMg = 1;
        } else if (tipo === 'NA') {
          resultadoData.na = valor;
          resultadoData.diluicaoNa = 1;
        } else if (tipo === 'AL') {
          resultadoData.al = valor;
        } else if (tipo === 'H_AL') {
          resultadoData.h_al = valor;
          resultadoData.branco = 0.1;
        } else if (tipo === 'MO') {
          resultadoData.mo = valor;
          resultadoData.massaMo = 0.2;
          resultadoData.branco = 0.05;
        } else if (tipo === 'S') {
          resultadoData.s = valor;
        } else if (tipo === 'FE') {
          resultadoData.fe = valor;
          resultadoData.diluicaoFe = 1;
        } else if (tipo === 'MN') {
          resultadoData.mn = valor;
          resultadoData.diluicaoMn = 1;
        } else if (tipo === 'CU') {
          resultadoData.cu = valor;
          resultadoData.diluicaoCu = 1;
        } else if (tipo === 'ZN') {
          resultadoData.zn = valor;
          resultadoData.diluicaoZn = 1;
        } else if (tipo === 'B') {
          resultadoData.b = valor;
          resultadoData.branco = 0.02;
        }

        const { query: resultadoQuery, params: resultadoParams } = SQL_QUERIES.resultados.create(resultadoData);
        await query(resultadoQuery, resultadoParams);
      }
      
      console.log(`✅ Resultados criados para amostra ${i + 1}/15`);
    }

    console.log('🎉 Lote de teste criado com sucesso!');
    console.log(`📦 Lote: ${codigoLote}`);
    console.log(`📊 Amostras: 15`);
    console.log(`🔬 Resultados: ${15 * tiposResultados.length} resultados brutos criados`);
    console.log('\n💡 Os resultados calculados serão gerados automaticamente quando você visualizar os resultados calculados ou gerar o laudo.');

  } catch (error) {
    console.error('❌ Erro ao criar lote de teste:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  criarLoteTeste()
    .then(() => {
      console.log('✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

export { criarLoteTeste };

