const { PrismaClient } = require('@prisma/client');

async function debugF6() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando massa geral da amostra F6...');
    
    // Buscar amostra F6
    const amostra = await prisma.amostra.findFirst({
      where: {
        codigo: 'F6',
        categoria: 'foliar'
      },
      include: {
        resultados: true
      }
    });
    
    if (!amostra) {
      console.log('❌ Amostra F6 não encontrada');
      return;
    }
    
    console.log(`📋 Amostra F6 - ${amostra.identificacao}`);
    
    // Buscar resultado MASSA_GERAL
    const massaGeral = amostra.resultados.find(r => r.tipo === 'MASSA_GERAL');
    if (massaGeral) {
      console.log(`\n⚖️ Massa Geral Bruto:`);
      console.log(`   Valor (campo valor): ${massaGeral.valor}`);
      console.log(`   Valor (campo massaGeral): ${massaGeral.massaGeral}`);
      
      // Calcular fatores
      const valorParaCalculo = massaGeral.massaGeral || massaGeral.valor;
      if (valorParaCalculo) {
        const massaGeralNum = parseFloat(valorParaCalculo);
        console.log(`\n🧮 Valor usado nas fórmulas: ${massaGeralNum}`);
        
        // Fatores de cálculo
        const fatorP = (21 / massaGeralNum) * 5 * 2;
        const fatorK = (21 / massaGeralNum) * 5;
        const fatorMicronutrientes = (21 / massaGeralNum);
        
        console.log(`   Fator P: ${fatorP.toFixed(2)}`);
        console.log(`   Fator K: ${fatorK.toFixed(2)}`);
        console.log(`   Fator Micronutrientes: ${fatorMicronutrientes.toFixed(2)}`);
        
        // Comparar com 0.202
        const fatorP_esperado = (21 / 0.202) * 5 * 2;
        const fatorK_esperado = (21 / 0.202) * 5;
        const fatorMicronutrientes_esperado = (21 / 0.202);
        
        console.log(`\n🔍 Comparação com 0.202:`);
        console.log(`   Diferença P: ${((fatorP / fatorP_esperado - 1) * 100).toFixed(2)}%`);
        console.log(`   Diferença K: ${((fatorK / fatorK_esperado - 1) * 100).toFixed(2)}%`);
        console.log(`   Diferença Micronutrientes: ${((fatorMicronutrientes / fatorMicronutrientes_esperado - 1) * 100).toFixed(2)}%`);
      }
    } else {
      console.log('\n❌ Nenhum resultado de MASSA_GERAL encontrado');
      
      // Listar tipos de resultados
      console.log('\n📋 Tipos encontrados:');
      amostra.resultados.forEach(r => {
        console.log(`   ${r.tipo}: ${r.valor}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugF6();




