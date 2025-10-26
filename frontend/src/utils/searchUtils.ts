// Função para normalizar texto removendo acentos e convertendo para minúsculas
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

// Função para verificar se um texto contém outro texto (ignorando acentos e case)
export function containsText(searchText: string, targetText: string): boolean {
  const normalizedSearch = normalizeText(searchText)
  const normalizedTarget = normalizeText(targetText)
  
  return normalizedTarget.includes(normalizedSearch)
}

// Função para filtrar uma lista baseada em um termo de busca
export function filterBySearch<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!searchTerm.trim()) {
    return items
  }

  const normalizedSearch = normalizeText(searchTerm)
  
  return items.filter(item => {
    const searchableText = getSearchableText(item)
    const normalizedTarget = normalizeText(searchableText)
    return normalizedTarget.includes(normalizedSearch)
  })
}







