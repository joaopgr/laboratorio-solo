import { query } from '../database/connection';

async function debugF6Dados() {
  try {
    console.log('🔍 Debugando dados da amostra F6...');
    
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
    console.log(`📋 Amostra F6 encontrada:`);
    console.log(`   ID: ${amostra.id}`);
    console.log(`   Código: ${amostra.codigo}`);
    console.log(`   Identificação: ${amostra.identificacao}`);
    console.log(`   Módulo: ${amostra.modulo}`);
    console.log(`   Lote ID: ${amostra.loteId}`);
    console.log(`   Criada em: ${amostra.createdAt}`);
    
    // Buscar resultados da amostra F6
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
      if (r.massa) camposEspecificos.push(`massa: ${r.massa}`);
      if (r.diluicao) camposEspecificos.push(`diluicao: ${r.diluicao}`);
      if (r.branco) camposEspecificos.push(`branco: ${r.branco}`);
      if (r.fatorF) camposEspecificos.push(`fatorF: ${r.fatorF}`);
      
      if (camposEspecificos.length > 0) {
        console.log(`   Campos específicos: ${camposEspecificos.join(', ')}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugF6Dados();