// Utilitários para cálculos granulométricos

export interface DadosGranulometricos {
  // Massa dos Recipientes
  massaRecipienteAreiaGrossa?: number
  massaRecipienteAreiaFina?: number
  massaRecipienteSilteArgila?: number
  massaRecipienteArgila?: number
  
  // Massa dos Recipientes + Partículas
  massaRecipientePartAreiaGrossa?: number
  massaRecipientePartAreiaFina?: number
  massaRecipientePartSilteArgila?: number
  massaRecipientePartArgila?: number
  
  // Massas para Fator F
  massaLata?: number
  massaLataSu?: number
  massaLataSs?: number
  
  // TFSA (calculado)
  tfsa?: number
}

export interface ResultadosGranulometricos {
  // Q.D Massa das Partículas
  massaAreiaGrossa?: number
  massaAreiaFina?: number
  massaSilte?: number
  massaArgila?: number
  
  // Correções (diluição)
  correcaoSilte?: number
  correcaoArgila?: number
  
  // Total Recuperado
  totalRecuperado?: number
  
  // Fator F
  tfsa?: number
  tfse?: number
  umidade?: number
  
  // Proporções das Partículas (g/kg)
  proporcaoAreiaGrossa?: number
  proporcaoAreiaFina?: number
  proporcaoSilte?: number
  proporcaoArgila?: number
  
  // Tomada de Decisão
  precisao?: number
  classificacao?: string
  dados?: string
  
  // Classificação Textural
  classificacaoTexturalAreiaGrossa?: number
  classificacaoTexturalAreiaFina?: number
  classificacaoTexturalSilte?: number
  classificacaoTexturalArgila?: number
  classificacaoTexturalTotal?: number
  classificacaoTextural?: string
}

/**
 * Calcula todos os resultados granulométricos baseado nos dados brutos
 */
export function calcularResultadosGranulometricos(dados: DadosGranulometricos): ResultadosGranulometricos {
  const resultados: ResultadosGranulometricos = {}
  
  // Q.D Massa das Partículas
  
  // A. Grossa = Areia grossa bruta de massa dos recipientes+particulas - Areia grossa bruta de massa dos recipientes
  if (dados.massaRecipienteAreiaGrossa && dados.massaRecipientePartAreiaGrossa) {
    resultados.massaAreiaGrossa = dados.massaRecipientePartAreiaGrossa - dados.massaRecipienteAreiaGrossa
  }
  
  // A. Fina = Areia Fina bruta de massa dos recipientes+particulas - Areia Fina bruta de massa dos recipientes
  if (dados.massaRecipienteAreiaFina && dados.massaRecipientePartAreiaFina) {
    resultados.massaAreiaFina = dados.massaRecipientePartAreiaFina - dados.massaRecipienteAreiaFina
  }
  
  // Silte = (Valor do campo Silte+argila bruto de massa dos recipientes mais particulas-Valor do campo Silte+argila bruto de massa dos recipientes-valor calculado de Argila de massa das particulas que vem a seguir como calcula)-0,01
  if (dados.massaRecipientePartSilteArgila && dados.massaRecipienteSilteArgila) {
    // Primeiro calcular a argila
    let argilaCalculada = 0
    if (dados.massaRecipientePartArgila && dados.massaRecipienteArgila) {
      argilaCalculada = (dados.massaRecipientePartArgila - dados.massaRecipienteArgila) - 0.01
    }
    resultados.massaSilte = (dados.massaRecipientePartSilteArgila - dados.massaRecipienteSilteArgila - argilaCalculada) - 0.01
  }
  
  // Argila = (Valor de Argila bruto de Massa dos recipientes mais particulas-valor de argila bruto de massa dos recipientes)-0,01
  if (dados.massaRecipientePartArgila && dados.massaRecipienteArgila) {
    resultados.massaArgila = (dados.massaRecipientePartArgila - dados.massaRecipienteArgila) - 0.01
  }
  
  // Silte (correções(diluição)) = Silte calculado de Massa das particulas * 20
  if (resultados.massaSilte) {
    resultados.correcaoSilte = resultados.massaSilte * 20
  }
  
  // Argila (correções(diluição)) = argila calculado de massa das particulas * 20
  if (resultados.massaArgila) {
    resultados.correcaoArgila = resultados.massaArgila * 20
  }
  
  // Total Recuperado = Areia grossa calculado de Massa das particulas + Silte calculado de (correções(diluição)) + Argila calculado de (correções(diluição))
  resultados.totalRecuperado = (resultados.massaAreiaGrossa || 0) + (resultados.correcaoSilte || 0) + (resultados.correcaoArgila || 0)
  
  // Fator F
  
  // TSFA = Massa Lata+ su bruto - M.Lata bruto
  if (dados.massaLataSu && dados.massaLata) {
    resultados.tfsa = dados.massaLataSu - dados.massaLata
  }
  
  // TFSE = Massa Lata+ ss bruto - M.Lata bruto
  if (dados.massaLataSs && dados.massaLata) {
    resultados.tfse = dados.massaLataSs - dados.massaLata
  }
  
  // Umidade = TSFA calculado / TFSE calculado
  if (resultados.tfsa && resultados.tfse && resultados.tfse !== 0) {
    resultados.umidade = resultados.tfsa / resultados.tfse
  }
  
  // Proporções das Partículas
  
  // A.Grossa = Areia grossa calculado de Massa das particulas*(1000/TFSA bruto)*umidade calculado
  if (resultados.massaAreiaGrossa && dados.tfsa && resultados.umidade && dados.tfsa !== 0) {
    resultados.proporcaoAreiaGrossa = resultados.massaAreiaGrossa * (1000 / dados.tfsa) * resultados.umidade
  }
  
  // A.Fina = Areia Fina calculado de Massa das particulas*(1000/TFSA bruto)*umidade calculado
  if (resultados.massaAreiaFina && dados.tfsa && resultados.umidade && dados.tfsa !== 0) {
    resultados.proporcaoAreiaFina = resultados.massaAreiaFina * (1000 / dados.tfsa) * resultados.umidade
  }
  
  // Silte = Silte calculado de Massa das particulas(correções(diluição))*(1000/TFSA bruto)*umidade calculado
  if (resultados.correcaoSilte && dados.tfsa && resultados.umidade && dados.tfsa !== 0) {
    resultados.proporcaoSilte = resultados.correcaoSilte * (1000 / dados.tfsa) * resultados.umidade
  }
  
  // Argila = Argila calculado de Massa das particulas(correções(diluição))*(1000/TFSA bruto)*umidade calculado
  if (resultados.correcaoArgila && dados.tfsa && resultados.umidade && dados.tfsa !== 0) {
    resultados.proporcaoArgila = resultados.correcaoArgila * (1000 / dados.tfsa) * resultados.umidade
  }
  
  // Tomada de Decisão
  
  // Precisão(%) = (Areia grossa calculada de proporção das particulas + Areia fina calculada de proporção das particulas + silte calculada de proporção das particulas + argila calculada de proporção das particulas)/10
  const somaProporcoes = (resultados.proporcaoAreiaGrossa || 0) + (resultados.proporcaoAreiaFina || 0) + (resultados.proporcaoSilte || 0) + (resultados.proporcaoArgila || 0)
  resultados.precisao = somaProporcoes / 10
  
  // Classificação Textural
  
  // A.Grossa = SEERRO((Areia grossa calculada de proporções das partículas/precisão da tomada de decisão)*10;"-")
  if (resultados.proporcaoAreiaGrossa && resultados.precisao && resultados.precisao !== 0) {
    resultados.classificacaoTexturalAreiaGrossa = (resultados.proporcaoAreiaGrossa / resultados.precisao) * 10
  }
  
  // A.Fina = SEERRO((Areia fina calculada de proporções das partículas/precisão da tomada de decisão)*10;"-")
  if (resultados.proporcaoAreiaFina && resultados.precisao && resultados.precisao !== 0) {
    resultados.classificacaoTexturalAreiaFina = (resultados.proporcaoAreiaFina / resultados.precisao) * 10
  }
  
  // Silte = SEERRO((Silte calculada de proporções das partículas/precisão da tomada de decisão)*10;"-")
  if (resultados.proporcaoSilte && resultados.precisao && resultados.precisao !== 0) {
    resultados.classificacaoTexturalSilte = (resultados.proporcaoSilte / resultados.precisao) * 10
  }
  
  // Argila = SEERRO((Argila calculada de proporções das partículas/precisão da tomada de decisão)*10;"-")
  if (resultados.proporcaoArgila && resultados.precisao && resultados.precisao !== 0) {
    resultados.classificacaoTexturalArgila = (resultados.proporcaoArgila / resultados.precisao) * 10
  }
  
  // Total = SEERRO(A.Grossa calculada de Classificação Textural + A.Fina calculada de Classificação Textural + Silte calculada de Classificação Textural + Argila calculada de Classificação Textural);"-")
  const somaClassificacaoTextural = (resultados.classificacaoTexturalAreiaGrossa || 0) + 
                                   (resultados.classificacaoTexturalAreiaFina || 0) + 
                                   (resultados.classificacaoTexturalSilte || 0) + 
                                   (resultados.classificacaoTexturalArgila || 0)
  if (somaClassificacaoTextural > 0) {
    resultados.classificacaoTexturalTotal = somaClassificacaoTextural
  }
  
  // Classificação = SE(Areia Grossa calculada de classificação textural="-";"-";SEERRO(SE(E(Argila calculada de classificação textural>35;Argila calculada de classificação textural<60);"Argilosa";SE(Argila calculada de classificação textural>60;"Muito Argilosa";SE(E(Argila calculada de classificação textural<35;(Areia grossa calculada de classificação textural+Areia fina calculada de classificação textural)<15);"Siltosa";SE(E(Argila calculada de classificação textural<15;(Areia grossa calculada de classificação textural+Areia fina calculada de classificação textural)>70);"Arenosa";SE(E(Argila calculada de classificação textural<35;(Areia grossa calculada de classificação textural+Areia fina calculada de classificação textural)>15);"Textura média")))));"-"))
  if (resultados.classificacaoTexturalAreiaGrossa !== undefined) {
    const argila = resultados.classificacaoTexturalArgila || 0
    const areiaGrossa = resultados.classificacaoTexturalAreiaGrossa || 0
    const areiaFina = resultados.classificacaoTexturalAreiaFina || 0
    const somaAreias = areiaGrossa + areiaFina
    
    if (argila > 35 && argila < 60) {
      resultados.classificacaoTextural = "Argilosa"
    } else if (argila > 60) {
      resultados.classificacaoTextural = "Muito Argilosa"
    } else if (argila < 35 && somaAreias < 15) {
      resultados.classificacaoTextural = "Siltosa"
    } else if (argila < 15 && somaAreias > 70) {
      resultados.classificacaoTextural = "Arenosa"
    } else if (argila < 35 && somaAreias > 15) {
      resultados.classificacaoTextural = "Textura média"
    } else {
      resultados.classificacaoTextural = "-"
    }
  } else {
    resultados.classificacaoTextural = "-"
  }
  
  // Classificação = SE(OU(classificação bruta = "Siltosa"; classificação bruta= "Arenosa");"VERIFICAR"; "Classificada")
  if (resultados.classificacaoTextural === "Siltosa" || resultados.classificacaoTextural === "Arenosa") {
    resultados.classificacao = "VERIFICAR"
  } else {
    resultados.classificacao = "Classificada"
  }
  
  // Dados = SE(E(92<precisao calculada;precisao calculada<106;silte calculada de proporcoes das particulas>=0;argila calculada de proporcoes das particulas>=0;areia grossa calculada de proporcoes das particulas>=0;umidade calculada>=1);"PROSSEGUIR";"VERIFICAR")
  if (resultados.precisao && resultados.proporcaoSilte !== undefined && resultados.proporcaoArgila !== undefined && 
      resultados.proporcaoAreiaGrossa !== undefined && resultados.umidade) {
    const condicoes = (
      resultados.precisao > 92 && 
      resultados.precisao < 106 && 
      resultados.proporcaoSilte >= 0 && 
      resultados.proporcaoArgila >= 0 && 
      resultados.proporcaoAreiaGrossa >= 0 && 
      resultados.umidade >= 1
    )
    resultados.dados = condicoes ? "PROSSEGUIR" : "VERIFICAR"
  }
  
  return resultados
}


/**
 * Formata um valor numérico com casas decimais específicas
 */
export function formatarValorGranulometrico(valor: number | null | undefined, casasDecimais: number = 4): string {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return '-'
  }
  return valor.toFixed(casasDecimais)
}