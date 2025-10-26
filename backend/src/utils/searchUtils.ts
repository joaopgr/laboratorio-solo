// Função para normalizar texto removendo acentos e convertendo para minúsculas
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

// Função para criar condição de busca normalizada no Prisma
export function createNormalizedSearchCondition(searchTerm: string, fields: string[]) {
  const normalizedSearch = normalizeText(searchTerm)
  
  return fields.map(field => ({
    [field]: {
      contains: normalizedSearch,
      mode: 'insensitive' as const
    }
  }))
}







