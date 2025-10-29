import React, { useState, useRef, useEffect } from 'react'

const CULTURAS_LISTA = [
  'Arábica - Plantio',
  'Arábica < 4 anos',
  'Arábica > 4 anos',
  'Cana',
  'Capineira',
  'Conilon - Plantio',
  'Conilon < 4 anos',
  'Conilon > 4 anos',
  'Essências Florestais',
  'Experimentos',
  'Feijão',
  'Abacate',
  'Banana',
  'Goiaba',
  'Laranja',
  'Abacaxi',
  'Horta',
  'Mandioca',
  'Milho',
  'Tomate',
  'Palmito',
  'Pastagem',
  'Pimenta do Reino',
  'Pomar - Fruteiras',
  'Outros'
]

interface CulturaAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export function CulturaAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'Digite a cultura', 
  className = '',
  required = false
}: CulturaAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredCulturas, setFilteredCulturas] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const filtered = CULTURAS_LISTA.filter(cultura =>
        cultura.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredCulturas(filtered)
      setShowSuggestions(filtered.length > 0 && value !== filtered[0])
    } else {
      setFilteredCulturas([])
      setShowSuggestions(false)
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (cultura: string) => {
    onChange(cultura)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value) {
            const filtered = CULTURAS_LISTA.filter(cultura =>
              cultura.toLowerCase().includes(value.toLowerCase())
            )
            setFilteredCulturas(filtered)
            setShowSuggestions(filtered.length > 0)
          } else {
            setFilteredCulturas(CULTURAS_LISTA)
            setShowSuggestions(true)
          }
        }}
        placeholder={placeholder}
        required={required}
        className={className || 'input w-full'}
        list="cultura-suggestions"
      />
      {showSuggestions && filteredCulturas.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCulturas.map((cultura, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(cultura)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-900 focus:bg-blue-50 focus:text-blue-900 focus:outline-none text-sm"
            >
              {cultura}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

