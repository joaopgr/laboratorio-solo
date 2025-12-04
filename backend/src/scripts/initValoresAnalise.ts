import { query } from '../database/connection';

// Script para inicializar a tabela valores_analise com valores padrão
async function initValoresAnalise() {
  try {
    console.log('🔧 Inicializando tabela valores_analise...');

    // Criar tabela se não existir
    await query(`
      CREATE TABLE IF NOT EXISTS valores_analise (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        modulo VARCHAR(10) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        valor DECIMAL(10, 2) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE(modulo, tipo)
      )
    `);

    console.log('✅ Tabela valores_analise criada/verificada');

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

    // Inserir valores padrão para SOLO
    for (const valor of valoresSolo) {
      await query(`
        INSERT INTO valores_analise (modulo, tipo, valor, "createdAt", "updatedAt")
        VALUES ('solo', $1, $2, NOW(), NOW())
        ON CONFLICT (modulo, tipo) DO NOTHING
      `, [valor.tipo, valor.valor]);
    }

    console.log('✅ Valores padrão para SOLO inseridos');

    // Inserir valores padrão para FOLIAR
    for (const valor of valoresFoliar) {
      await query(`
        INSERT INTO valores_analise (modulo, tipo, valor, "createdAt", "updatedAt")
        VALUES ('foliar', $1, $2, NOW(), NOW())
        ON CONFLICT (modulo, tipo) DO NOTHING
      `, [valor.tipo, valor.valor]);
    }

    console.log('✅ Valores padrão para FOLIAR inseridos');
    console.log('✅ Inicialização concluída!');
  } catch (error) {
    console.error('❌ Erro ao inicializar valores_analise:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initValoresAnalise()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar script:', error);
      process.exit(1);
    });
}

export { initValoresAnalise };

