import { query } from '../database/connection';

async function debugMassaGeralF6() {
  try {
    console.log('🔍 Verificando massa geral da amostra F6...');
    
    // Buscar amostra F6
    const amostraResult = await query(`
      SELECT * FROM amostras 
      WHERE codigo = 'F6' AND modulo = 'foliar'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (amostraResult.rows.length === 0) {
      console.log('❌ Amostra F6 não encontrada');
      return;
    }
    
    const amostra = amostraResult.rows[0];
    console.log(`📋 Amostra F6 - ${amostra.identificacao}`);
    console.log(`   Lote: ${amostra.loteId}`);
    
    // Buscar resultados da amostra F6
    const resultadosResult = await query(`
      SELECT * FROM resultados 
      WHERE "amostraId" = $1 
      ORDER BY "createdAt" DESC
    `, [amostra.id]);
    
    // Buscar resultado MASSA_GERAL
    const massaGeral = resultadosResult.rows.find((r: any) => r.tipo === 'MASSA_GERAL');
    if (massaGeral) {
      console.log(`\n⚖️ Massa Geral Bruto encontrada:`);
      console.log(`   Valor salvo: ${massaGeral.valor}`);
      console.log(`   Tipo: ${massaGeral.tipo}`);
      console.log(`   Categoria: ${massaGeral.categoria}`);
      console.log(`   Data: ${massaGeral.dataAnalise}`);
      
      // Verificar se há campo massaGeral específico
      console.log(`   Campo massaGeral: ${massaGeral.massaGeral}`);
      
      // Calcular o que seria usado nas fórmulas
      const valorParaCalculo = massaGeral.massaGeral || massaGeral.valor;
      console.log(`\n🧮 Valor que seria usado nas fórmulas: ${valorParaCalculo}`);
      
      // Testar alguns cálculos com este valor
      if (valorParaCalculo) {
        const massaGeralNum = parseFloat(valorParaCalculo.toString());
        console.log(`\n📊 Teste de cálculos com massa geral ${massaGeralNum}:`);
        
        // Fator para P: (21 / massaGeralBruto) * 5 * 2
        const fatorP = (21 / massaGeralNum) * 5 * 2;
        console.log(`   Fator P: ${fatorP}`);
        
        // Fator para K: (21 / massaGeralBruto) * 5
        const fatorK = (21 / massaGeralNum) * 5;
        console.log(`   Fator K: ${fatorK}`);
        
        // Fator para Ca/Mg: (21 / massaGeralBruto) * 5 * (10.5 / 0.5)
        const fatorCaMg = (21 / massaGeralNum) * 5 * (10.5 / 0.5);
        console.log(`   Fator Ca/Mg: ${fatorCaMg}`);
        
        // Fator para micronutrientes: (21 / massaGeralBruto)
        const fatorMicronutrientes = (21 / massaGeralNum);
        console.log(`   Fator Micronutrientes: ${fatorMicronutrientes}`);
        
        // Comparar com o valor esperado (0.202)
        console.log(`\n🔍 Comparação com valor esperado (0.202):`);
        const fatorP_esperado = (21 / 0.202) * 5 * 2;
        const fatorK_esperado = (21 / 0.202) * 5;
        const fatorCaMg_esperado = (21 / 0.202) * 5 * (10.5 / 0.5);
        const fatorMicronutrientes_esperado = (21 / 0.202);
        
        console.log(`   Fator P - Atual: ${fatorP.toFixed(2)}, Esperado: ${fatorP_esperado.toFixed(2)}, Diferença: ${((fatorP / fatorP_esperado - 1) * 100).toFixed(2)}%`);
        console.log(`   Fator K - Atual: ${fatorK.toFixed(2)}, Esperado: ${fatorK_esperado.toFixed(2)}, Diferença: ${((fatorK / fatorK_esperado - 1) * 100).toFixed(2)}%`);
        console.log(`   Fator Ca/Mg - Atual: ${fatorCaMg.toFixed(2)}, Esperado: ${fatorCaMg_esperado.toFixed(2)}, Diferença: ${((fatorCaMg / fatorCaMg_esperado - 1) * 100).toFixed(2)}%`);
        console.log(`   Fator Micronutrientes - Atual: ${fatorMicronutrientes.toFixed(2)}, Esperado: ${fatorMicronutrientes_esperado.toFixed(2)}, Diferença: ${((fatorMicronutrientes / fatorMicronutrientes_esperado - 1) * 100).toFixed(2)}%`);
      }
    } else {
      console.log('\n❌ Nenhum resultado de MASSA_GERAL encontrado para F6');
      
      // Listar todos os tipos de resultados encontrados
      console.log('\n📋 Tipos de resultados encontrados:');
      resultadosResult.rows.forEach((r: any) => {
        console.log(`   ${r.tipo}: ${r.valor}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugMassaGeralF6();