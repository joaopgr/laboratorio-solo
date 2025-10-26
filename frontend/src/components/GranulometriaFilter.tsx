import { useState } from 'react'
import { Filter } from 'lucide-react'

interface GranulometriaFilterProps {
  onFilterChange: (filters: {
    granulometria?: boolean
    solo?: boolean
  }) => void
}

export function GranulometriaFilter({ onFilterChange }: GranulometriaFilterProps) {
  const [filters, setFilters] = useState({
    granulometria: false,
    solo: false
  })

  const handleFilterChange = (filterType: 'granulometria' | 'solo', checked: boolean) => {
    const newFilters = { ...filters }
    
    if (checked) {
      // Se marcou granulométrica, desmarca solo
      if (filterType === 'granulometria') {
        newFilters.solo = false
      }
      // Se marcou solo, desmarca granulométrica
      if (filterType === 'solo') {
        newFilters.granulometria = false
      }
    }
    
    newFilters[filterType] = checked
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Filtros de Análise</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="granulometria-filter"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={filters.granulometria}
            onChange={(e) => handleFilterChange('granulometria', e.target.checked)}
          />
          <label htmlFor="granulometria-filter" className="ml-2 block text-sm text-gray-700">
            Apenas Granulométrica
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="solo-filter"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={filters.solo}
            onChange={(e) => handleFilterChange('solo', e.target.checked)}
          />
          <label htmlFor="solo-filter" className="ml-2 block text-sm text-gray-700">
            Apenas Solo (sem granulométrica)
          </label>
        </div>
      </div>
      
      {filters.granulometria && (
        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <strong>Filtro Ativo:</strong> Mostrando apenas análises granulométricas
        </div>
      )}
      
      {filters.solo && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          <strong>Filtro Ativo:</strong> Mostrando apenas análises de solo (sem granulométrica)
        </div>
      )}
    </div>
  )
}

