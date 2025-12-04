import { createContext, useContext, ReactNode } from 'react';
import { useValoresAnalise } from '../hooks/useValoresAnalise';
import { getAnaliseValues } from '../../../shared/types';
import { TipoAnalise } from '../../../shared/types';

interface ValoresAnaliseContextType {
  getValores: (modulo: TipoAnalise) => Record<string, number>;
  isLoading: boolean;
}

const ValoresAnaliseContext = createContext<ValoresAnaliseContextType | undefined>(undefined);

export function ValoresAnaliseProvider({ children }: { children: ReactNode }) {
  const { data: valoresData, isLoading } = useValoresAnalise();

  const getValores = (modulo: TipoAnalise): Record<string, number> => {
    // Se os valores do banco estão disponíveis, usar eles
    if (valoresData && valoresData[modulo]) {
      return valoresData[modulo];
    }
    // Caso contrário, usar valores hardcoded como fallback
    return getAnaliseValues(modulo);
  };

  return (
    <ValoresAnaliseContext.Provider value={{ getValores, isLoading }}>
      {children}
    </ValoresAnaliseContext.Provider>
  );
}

export function useValoresAnaliseContext() {
  const context = useContext(ValoresAnaliseContext);
  if (context === undefined) {
    throw new Error('useValoresAnaliseContext deve ser usado dentro de ValoresAnaliseProvider');
  }
  return context;
}

