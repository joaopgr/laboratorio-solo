import { query } from '../database/connection';

// Script para atualizar/inserir valores na tabela valores_analise
async function updateValoresAnalise() {
  try {
    console.log('🔧 Atualizando valores_analise...');

    // Valores padrão para SOLO
    const valoresSolo = [
      { tipo: 'rotina', valor: 15 },
      { tipo: 'organica', valor: 10 },
      { tipo: 'micronutrientes', valor: 20 },
      { tipo: 'prem', valor: 12 },
      { tipo: 'enxofre', valor: 10 },
      { tipo: 'nitrogenio', valor: 10 },
      { tipo: 'granulometria', valor: 30 }
    ];

    // Valores padrão para FOLIAR
    const valoresFoliar = [
      { tipo: 'rotina', valor: 15 },
      { tipo: 'organica', valor: 0 },
      { tipo: 'micronutrientes', valor: 15 },
      { tipo: 'prem', valor: 0 },
      { tipo: 'enxofre', valor: 15 },
      { tipo: 'nitrogenio', valor: 15 },
      { tipo: 'granulometria', valor: 0 }
    ];

    // Atualizar/inserir valores para SOLO (usando ON CONFLICT DO UPDATE)
    for (const valor of valoresSolo) {
      await query(`
        INSERT INTO valores_analise (modulo, tipo, valor, "createdAt", "updatedAt")
        VALUES ('solo', $1, $2, NOW(), NOW())
        ON CONFLICT (modulo, tipo) 
        DO UPDATE SET valor = $2, "updatedAt" = NOW()
      `, [valor.tipo, valor.valor]);
      console.log(`✅ ${valor.tipo} (solo): R$ ${valor.valor}`);
    }

    console.log('✅ Valores para SOLO atualizados');

    // Atualizar/inserir valores para FOLIAR
    for (const valor of valoresFoliar) {
      await query(`
        INSERT INTO valores_analise (modulo, tipo, valor, "createdAt", "updatedAt")
        VALUES ('foliar', $1, $2, NOW(), NOW())
        ON CONFLICT (modulo, tipo) 
        DO UPDATE SET valor = $2, "updatedAt" = NOW()
      `, [valor.tipo, valor.valor]);
      console.log(`✅ ${valor.tipo} (foliar): R$ ${valor.valor}`);
    }

    console.log('✅ Valores para FOLIAR atualizados');
    
    // Verificar valores inseridos
    const checkResult = await query('SELECT * FROM valores_analise ORDER BY modulo, tipo');
    console.log(`\n📊 Total de valores no banco: ${checkResult.rows.length}`);
    checkResult.rows.forEach((row: any) => {
      console.log(`  - ${row.modulo}.${row.tipo}: R$ ${row.valor}`);
    });
    
    console.log('\n✅ Atualização concluída!');
  } catch (error) {
    console.error('❌ Erro ao atualizar valores_analise:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateValoresAnalise()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export { updateValoresAnalise };

