// Script simples para verificar F10
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    // Buscar amostra F10
    const amostra = await prisma.amostra.findFirst({
      where: { codigo: 'F10', categoria: 'foliar' },
      include: { resultados: true }
    })
    
    if (!amostra) {
      console.log('Amostra F10 não encontrada')
      return
    }
    
    console.log('Amostra F10 encontrada:')
    console.log('- ID:', amostra.id)
    console.log('- Código:', amostra.codigo)
    console.log('- Resultados:', amostra.resultados.length)
    
    // Verificar cada resultado
    amostra.resultados.forEach((r, i) => {
      console.log(`\nResultado ${i + 1}:`)
      console.log('- Tipo:', r.tipo)
      console.log('- Valor:', r.valor)
      console.log('- Massa Geral:', r.massaGeral)
      console.log('- Massa N:', r.massaN)
      
      // Verificar se valor é null/undefined
      if (r.valor === null || r.valor === undefined) {
        console.log('❌ VALOR NULL/UNDEFINED')
      }
    })
    
  } catch (error) {
    console.error('Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()




