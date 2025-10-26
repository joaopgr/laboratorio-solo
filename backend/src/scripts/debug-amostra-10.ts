import { query } from '../database/connection';

async function debugAmostra10() {
  try {
    console.log('🔍 Debugando amostra 10...');
    
    // Buscar amostra 10
    const amostraResult = await query(`
      SELECT * FROM amostras 
      WHERE codigo = '10' AND modulo = 'solo'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (amostraResult.rows.length === 0) {
      console.log('❌ Amostra 10 não encontrada');
      return;
    }
    
    const amostra = amostraResult.rows[0];
    console.log(`📋 Amostra 10 encontrada:`);
    console.log(`   ID: ${amostra.id}`);
    console.log(`   Código: ${amostra.codigo}`);
    console.log(`   Identificação: ${amostra.identificacao}`);
    console.log(`   Módulo: ${amostra.modulo}`);
    console.log(`   Cultura: ${amostra.cultura}`);
    console.log(`   Lote ID: ${amostra.loteId}`);
    console.log(`   Status: ${amostra.status}`);
    console.log(`   Criada em: ${amostra.createdAt}`);
    
    // Buscar resultados da amostra 10
    const resultadosResult = await query(`
      SELECT * FROM resultados 
      WHERE "amostraId" = $1 
      ORDER BY "createdAt" DESC
    `, [amostra.id]);
    
    console.log(`\n📊 ${resultadosResult.rows.length} resultados encontrados:`);
    
    resultadosResult.rows.forEach((r: any) => {
      console.log(`\n${r.tipo}:`);
      console.log(`   ID: ${r.id}`);
      console.log(`   Valor: ${r.valor}`);
      console.log(`   Categoria: ${r.categoria}`);
      console.log(`   Data Análise: ${r.dataAnalise}`);
      console.log(`   Criado em: ${r.createdAt}`);
      
      // Mostrar campos específicos se existirem
      const camposEspecificos = [];
      if (r.ph) camposEspecificos.push(`ph: ${r.ph}`);
      if (r.pAbs) camposEspecificos.push(`pAbs: ${r.pAbs}`);
      if (r.kMgL) camposEspecificos.push(`kMgL: ${r.kMgL}`);
      if (r.alCmol) camposEspecificos.push(`alCmol: ${r.alCmol}`);
      if (r.hAl) camposEspecificos.push(`hAl: ${r.hAl}`);
      
      if (camposEspecificos.length > 0) {
        console.log(`   Campos específicos: ${camposEspecificos.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugAmostra10();