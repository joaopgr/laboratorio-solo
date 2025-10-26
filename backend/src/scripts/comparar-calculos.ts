import { query } from '../database/connection';

async function compararCalculos() {
  try {
    console.log('🔍 Comparando cálculos de resultados...');
    
    // Buscar amostra com resultados
    const amostraResult = await query(`
      SELECT * FROM amostras 
      WHERE modulo = 'foliar'
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `);
    
    if (amostraResult.rows.length === 0) {
      console.log('❌ Nenhuma amostra foliar encontrada');
      return;
    }
    
    const amostra = amostraResult.rows[0];
    console.log(`📋 Comparando com amostra: ${amostra.codigo} - ${amostra.identificacao}`);
    
    // Buscar resultados da amostra
    const resultadosResult = await query(`
      SELECT * FROM resultados 
      WHERE "amostraId" = $1 
      ORDER BY "createdAt" DESC
    `, [amostra.id]);
    
    console.log(`📊 ${resultadosResult.rows.length} resultados encontrados`);
    
    // Comparar valores brutos vs calculados
    const resultadosComCalculados = resultadosResult.rows.filter((r: any) => 
      r.valor && (r.bCalculado || r.caCalculado || r.cuCalculado || r.feCalculado || 
      r.kCalculado || r.mgCalculado || r.mnCalculado || r.pCalculado || r.znCalculado)
    );
    
    if (resultadosComCalculados.length > 0) {
      console.log('\n📈 Comparação de valores:');
      resultadosComCalculados.forEach((r: any) => {
        console.log(`\n${r.tipo}:`);
        console.log(`   Valor bruto: ${r.valor}`);
        
        if (r.bCalculado) console.log(`   B calculado: ${r.bCalculado}`);
        if (r.caCalculado) console.log(`   Ca calculado: ${r.caCalculado}`);
        if (r.cuCalculado) console.log(`   Cu calculado: ${r.cuCalculado}`);
        if (r.feCalculado) console.log(`   Fe calculado: ${r.feCalculado}`);
        if (r.kCalculado) console.log(`   K calculado: ${r.kCalculado}`);
        if (r.mgCalculado) console.log(`   Mg calculado: ${r.mgCalculado}`);
        if (r.mnCalculado) console.log(`   Mn calculado: ${r.mnCalculado}`);
        if (r.pCalculado) console.log(`   P calculado: ${r.pCalculado}`);
        if (r.znCalculado) console.log(`   Zn calculado: ${r.znCalculado}`);
      });
    } else {
      console.log('\n❌ Nenhum resultado com valores calculados encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

compararCalculos();