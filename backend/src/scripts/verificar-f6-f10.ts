import { query } from '../database/connection';

async function verificarF6F10() {
  try {
    console.log('🔍 Verificando amostras F6 e F10...');
    
    // Buscar amostras F6 e F10
    const amostrasResult = await query(`
      SELECT * FROM amostras 
      WHERE codigo IN ('F6', 'F10') AND modulo = 'foliar'
      ORDER BY codigo, "createdAt" DESC
    `);
    
    if (amostrasResult.rows.length === 0) {
      console.log('❌ Nenhuma amostra F6 ou F10 encontrada');
      return;
    }
    
    console.log(`📋 ${amostrasResult.rows.length} amostras encontradas`);
    
    for (const amostra of amostrasResult.rows) {
      console.log(`\n📊 Amostra ${amostra.codigo} - ${amostra.identificacao}`);
      
      // Buscar resultados da amostra
      const resultadosResult = await query(`
        SELECT * FROM resultados 
        WHERE "amostraId" = $1 
        ORDER BY "createdAt" DESC
      `, [amostra.id]);
      
      console.log(`   ${resultadosResult.rows.length} resultados encontrados`);
      
      // Verificar tipos de resultados
      const tipos = [...new Set(resultadosResult.rows.map((r: any) => r.tipo))];
      console.log(`   Tipos: ${tipos.join(', ')}`);
      
      // Verificar resultados calculados
      const calculados = resultadosResult.rows.filter((r: any) => 
        r.bCalculado || r.caCalculado || r.cuCalculado || r.feCalculado || 
        r.kCalculado || r.mgCalculado || r.mnCalculado || r.pCalculado || r.znCalculado
      );
      
      if (calculados.length > 0) {
        console.log(`   ✅ ${calculados.length} resultados calculados encontrados`);
        calculados.forEach((r: any) => {
          const camposCalculados = [];
          if (r.bCalculado) camposCalculados.push(`B: ${r.bCalculado}`);
          if (r.caCalculado) camposCalculados.push(`Ca: ${r.caCalculado}`);
          if (r.cuCalculado) camposCalculados.push(`Cu: ${r.cuCalculado}`);
          if (r.feCalculado) camposCalculados.push(`Fe: ${r.feCalculado}`);
          if (r.kCalculado) camposCalculados.push(`K: ${r.kCalculado}`);
          if (r.mgCalculado) camposCalculados.push(`Mg: ${r.mgCalculado}`);
          if (r.mnCalculado) camposCalculados.push(`Mn: ${r.mnCalculado}`);
          if (r.pCalculado) camposCalculados.push(`P: ${r.pCalculado}`);
          if (r.znCalculado) camposCalculados.push(`Zn: ${r.znCalculado}`);
          console.log(`     ${r.tipo}: ${camposCalculados.join(', ')}`);
        });
      } else {
        console.log(`   ❌ Nenhum resultado calculado encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

verificarF6F10();