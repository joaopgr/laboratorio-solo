import { TestTube, Leaf, Lock } from 'lucide-react'
import { useModule } from '../contexts/ModuleContext'
import { TipoAnalise } from '../../../shared/types'
import { useLocation } from 'react-router-dom'

const moduleIcons = {
  TestTube,
  Leaf
}

const modules = [
  {
    tipo: 'solo' as TipoAnalise,
    nome: 'Análises de Solo',
    descricao: 'Rotina, micronutrientes, matéria orgânica, granulométrica e mais',
    cor: 'green',
    icone: 'TestTube'
  },
  {
    tipo: 'foliar' as TipoAnalise,
    nome: 'Análise Foliar',
    descricao: 'Macro e micronutrientes em folhas',
    cor: 'purple',
    icone: 'Leaf'
  }
]

export function ModuleSelector() {
  const { modulo, setModulo, getModuleInfo } = useModule()
  const location = useLocation()
  const currentModule = getModuleInfo(modulo)
  
  // Detectar se estamos em uma página de detalhes de amostra
  const isAmostraDetailsPage = location.pathname.startsWith('/amostras/') && location.pathname !== '/amostras'

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-bold text-slate-900">
            Módulo Ativo:
          </h2>
          <div className="flex items-center space-x-3">
            {(() => {
              const Icon = moduleIcons[currentModule.icone as keyof typeof moduleIcons]
              return (
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r ${
                  currentModule.cor === 'green' 
                    ? 'from-emerald-50 to-green-100 border border-emerald-200' 
                    : 'from-purple-50 to-violet-100 border border-purple-200'
                } shadow-md`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    currentModule.cor === 'green' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                      : 'bg-gradient-to-r from-emerald-500 to-green-600'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`font-semibold ${
                    currentModule.cor === 'green' ? 'text-emerald-800' : 'text-purple-800'
                  }`}>
                    {currentModule.nome}
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-600">
            {isAmostraDetailsPage ? 'Módulo (fixo):' : 'Alterar módulo:'}
          </span>
          <div className="flex space-x-2">
            {modules.map((module) => {
              const Icon = moduleIcons[module.icone as keyof typeof moduleIcons]
              const isActive = modulo === module.tipo
              const isDisabled = isAmostraDetailsPage && !isActive
              
              return (
                <button
                  key={module.tipo}
                  onClick={() => !isDisabled && setModulo(module.tipo)}
                  disabled={isDisabled}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isDisabled
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : isActive
                      ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-300 text-emerald-800 shadow-lg'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md'
                  }`}
                  title={isDisabled ? 'Módulo fixo para esta amostra' : module.descricao}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{module.nome}</span>
                  {isDisabled && <Lock className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
