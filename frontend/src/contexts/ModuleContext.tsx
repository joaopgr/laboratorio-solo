import { createContext, useContext, useState, ReactNode } from 'react'

export type TipoModulo = 'solo' | 'foliar'

interface ModuleContextType {
  modulo: TipoModulo
  setModulo: (tipo: TipoModulo) => void
  getModuleInfo: (tipo: TipoModulo) => {
    nome: string
    descricao: string
    cor: string
    icone: string
  }
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

interface ModuleProviderProps {
  children: ReactNode
}

export function ModuleProvider({ children }: ModuleProviderProps) {
  // Persistir módulo no localStorage para não perder ao atualizar página
  const [modulo, setModuloState] = useState<TipoModulo>(() => {
    const saved = localStorage.getItem('modulo')
    return (saved === 'foliar' || saved === 'solo') ? saved : 'solo'
  })

  const setModulo = (tipo: TipoModulo) => {
    setModuloState(tipo)
    localStorage.setItem('modulo', tipo)
  }

  const getModuleInfo = (tipo: TipoModulo) => {
    const modules = {
      solo: {
        nome: 'Análises de Solo',
        descricao: 'Rotina, micronutrientes, matéria orgânica, granulométrica e mais',
        cor: 'green',
        icone: 'TestTube'
      },
      foliar: {
        nome: 'Análise Foliar',
        descricao: 'Macro e micronutrientes em folhas',
        cor: 'purple',
        icone: 'Leaf'
      }

    }
    return modules[tipo]
  }

  return (
    <ModuleContext.Provider value={{
      modulo,
      setModulo,
      getModuleInfo
    }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModule() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider')
  }
  return context
}

