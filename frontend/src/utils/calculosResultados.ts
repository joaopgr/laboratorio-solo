// Funções para cálculo de resultados baseado nos dados brutos

export interface DadosBrutos {
  ph?: number
  p?: number
  p_dil?: number
  p_param_a?: number
  p_param_b?: number
  na?: number
  na_dil?: number
  k?: number
  k_dil?: number
  ca?: number
  ca_dil?: number
  mg?: number
  mg_dil?: number
  al?: number
  h_al?: number
  h_al_branco?: number
  mo?: number
  mo_massa?: number
  mo_branco?: number
  fe?: number
  fe_dil?: number
  cu?: number
  cu_dil?: number
  zn?: number
  zn_dil?: number
  mn?: number
  mn_dil?: number
  b?: number
  b_dil?: number
  b_branco?: number
  b_param_a?: number
  b_param_b?: number
  massaBFoliar?: number
  s?: number
  s_dil?: number
  s_branco?: number
  s_param_a?: number
  s_param_b?: number
  prem?: number
  prem_dil?: number
  prem_param_a?: number
  prem_param_b?: number
  // Campos do Nitrogênio (módulo foliar)
  massaN?: number
  volumeN?: number
  brancoN?: number
  fatorF?: number
  // Campo comum para módulo foliar
  massaGeralBruto?: number
}

export interface CalculadosResultados {
  ph?: number
  p?: number
  na?: number
  k?: number
  ca?: number
  mg?: number
  al?: number
  h_al?: number
  sb?: number
  t?: number
  ctc?: number
  v?: number
  m?: number
  mo?: number
  fe?: number
  cu?: number
  zn?: number
  mn?: number
  b?: number
  s?: number
  prem?: number
  n?: number // Resultado calculado do Nitrogênio
}

export function calcularResultados(dadosBrutos: DadosBrutos, _moduloFoliar: boolean = false): CalculadosResultados {
  const resultados: CalculadosResultados = {}
  

  // PH = ph (mesmo valor)
  if (dadosBrutos.ph !== undefined) {
    resultados.ph = dadosBrutos.ph
  }

  // P = SE(valor do P="";"-";((valor do P - B do P)/ A do P)* Dil do P)
  if (dadosBrutos.p !== undefined && dadosBrutos.p_param_a !== undefined && 
      dadosBrutos.p_param_b !== undefined && dadosBrutos.p_dil !== undefined) {
    
    const valorP = dadosBrutos.p
    const paramA = dadosBrutos.p_param_a
    const paramB = dadosBrutos.p_param_b
    const diluicaoP = dadosBrutos.p_dil
    
    // Se valor do P for vazio ou 0, retornar 0 (equivalente ao "-" da fórmula)
    if (valorP === 0 || valorP === null || valorP === undefined) {
      resultados.p = 0
    } else if (paramA !== 0) {
      // Fórmula: ((valor do P - B do P)/ A do P)* Dil do P
      resultados.p = ((valorP - paramB) / paramA) * diluicaoP
    } else {
      resultados.p = 0
    }
  } else if (dadosBrutos.p !== undefined) {
    // Fallback para compatibilidade com dados antigos
    resultados.p = dadosBrutos.p
  }

  // Na = Na * Dil
  if (dadosBrutos.na !== undefined && dadosBrutos.na_dil !== undefined) {
    resultados.na = dadosBrutos.na * dadosBrutos.na_dil
  }

  // K = K * Dil
  if (dadosBrutos.k !== undefined && dadosBrutos.k_dil !== undefined) {
    resultados.k = dadosBrutos.k * dadosBrutos.k_dil
  }

  // Ca = SE([=SE(Valor Ca="";"-";valor Ca*Dil Ca*1,05)]=0;0,1;[=SE(Valor Ca="";"-";Valor Ca*Dil Ca*1,05)])
  if (dadosBrutos.ca !== undefined && dadosBrutos.ca_dil !== undefined) {
    const caCalculado = dadosBrutos.ca * dadosBrutos.ca_dil * 1.05
    resultados.ca = caCalculado === 0 ? 0.1 : caCalculado
  }

  // Mg = SE([=SE(Valor Mg="";"-";valor Mg*Dil Mg*1,05)]=0;0,1;[=SE(Valor Mg="";"-";Valor Mg*Dil Mg*1,728)])
  if (dadosBrutos.mg !== undefined && dadosBrutos.mg_dil !== undefined) {
    const mgCalculado = dadosBrutos.mg * dadosBrutos.mg_dil * 1.728
    resultados.mg = mgCalculado === 0 ? 0.1 : mgCalculado
  }

  // Al = SE(valor pH>=5,5;0;SE(Valor Al="";"-";Valor Al))
  if (dadosBrutos.al !== undefined && dadosBrutos.ph !== undefined) {
    if (dadosBrutos.ph >= 5.5) {
      resultados.al = 0
    } else {
      resultados.al = dadosBrutos.al
    }
  }

  // H+Al = Se o ph for > 7 = 0; se o Branco do H+al for > H+al = 0; Se tiver tudo de acordo, (H+al - Branco) * 1,65
  
  if (dadosBrutos.ph !== undefined && dadosBrutos.h_al !== undefined && dadosBrutos.h_al_branco !== undefined) {
    if (dadosBrutos.ph > 7) {
      resultados.h_al = 0
    } else if (dadosBrutos.h_al_branco > dadosBrutos.h_al) {
      resultados.h_al = 0
    } else {
      resultados.h_al = (dadosBrutos.h_al - dadosBrutos.h_al_branco) * 1.65
    }
  } else {
  }

  // SB = Resultado calculado de Ca + Resultado calculado de Mg + Resultado calculado de K/390 + resultado calculado de NA/230
  const sbCa = resultados.ca || 0
  const sbMg = resultados.mg || 0
  const sbK = (resultados.k || 0) / 390
  const sbNa = (resultados.na || 0) / 230
  resultados.sb = sbCa + sbMg + sbK + sbNa

  // t = sb + al calculado
  resultados.t = resultados.sb + (resultados.al || 0)

  // CTC = SB + H+al calculado
  resultados.ctc = resultados.sb + (resultados.h_al || 0)

  // v = (SB*100) / CTC
  if (resultados.ctc !== undefined && resultados.ctc !== 0) {
    resultados.v = (resultados.sb || 0) * 100 / resultados.ctc
  }

  // m = (al calculado *100) / t
  if (resultados.t !== undefined && resultados.t !== 0) {
    resultados.m = (resultados.al || 0) * 100 / resultados.t
  }

  // MO = ((((branco-valor)*0,5*0,39)/massa)*1,724)*10
  if (dadosBrutos.mo_branco !== undefined && dadosBrutos.mo !== undefined && dadosBrutos.mo_massa !== undefined) {
    resultados.mo = (((dadosBrutos.mo_branco - dadosBrutos.mo) * 0.5 * 0.39) / dadosBrutos.mo_massa) * 1.724 * 10
  }

  // FE = Fe * dil
  if (dadosBrutos.fe !== undefined && dadosBrutos.fe_dil !== undefined) {
    resultados.fe = dadosBrutos.fe * dadosBrutos.fe_dil
  }

  // Cu = SE(valor do Cu bruto="";"-";SE(valor do Cu bruto<0,01;0,1;valor do Cu bruto*dil Cu bruto))
  if (dadosBrutos.cu !== undefined && dadosBrutos.cu_dil !== undefined) {
    const valorCu = dadosBrutos.cu
    const diluicaoCu = dadosBrutos.cu_dil
    
    if (valorCu < 0.01) {
      resultados.cu = 0.1
    } else {
      resultados.cu = valorCu * diluicaoCu
    }
  }

  // Zn = Zn * dil
  if (dadosBrutos.zn !== undefined && dadosBrutos.zn_dil !== undefined) {
    resultados.zn = dadosBrutos.zn * dadosBrutos.zn_dil
  }

  // Mn = Mn * dil
  if (dadosBrutos.mn !== undefined && dadosBrutos.mn_dil !== undefined) {
    resultados.mn = dadosBrutos.mn * dadosBrutos.mn_dil
  }

  // B = (((2-LOG10(valor boro)-B do boro)/A do boro)-[((2-LOG10(branco do boro)-B do boro)/A do boro)])*6/4*2
  if (dadosBrutos.b !== undefined && dadosBrutos.b_branco !== undefined && 
      dadosBrutos.b_param_a !== undefined && dadosBrutos.b_param_b !== undefined) {
    
    const valorBoro = dadosBrutos.b
    const brancoBoro = dadosBrutos.b_branco
    const paramA = dadosBrutos.b_param_a
    const paramB = dadosBrutos.b_param_b
    
    // Verificar se os valores são válidos (maiores que 0 para log)
    if (valorBoro > 0 && brancoBoro > 0 && paramA !== 0) {
      // Primeira parte: ((2-LOG10(valor boro)-B do boro)/A do boro)
      const parte1 = (2 - Math.log10(valorBoro) - paramB) / paramA
      
      // Segunda parte: ((2-LOG10(branco do boro)-B do boro)/A do boro)
      const parte2 = (2 - Math.log10(brancoBoro) - paramB) / paramA
      
      // Resultado final: (parte1 - parte2) * 6/4 * 2
      resultados.b = (parte1 - parte2) * (6/4) * 2
    } else {
      resultados.b = 0
    }
  }

  // S = SE(Valor de S="";"-";((((Valor de S)-B do S)/A do S)-[=(((Branco do S)-B do S)/A do S)])*15/10*2,5)
  if (dadosBrutos.s !== undefined && dadosBrutos.s_branco !== undefined && 
      dadosBrutos.s_param_a !== undefined && dadosBrutos.s_param_b !== undefined) {
    
    const valorS = dadosBrutos.s
    const brancoS = dadosBrutos.s_branco
    const paramA = dadosBrutos.s_param_a
    const paramB = dadosBrutos.s_param_b
    
    // Se valor do S for vazio ou 0, retornar 0 (equivalente ao "-" da fórmula)
    if (valorS === 0 || valorS === null || valorS === undefined) {
      resultados.s = 0
    } else if (paramA !== 0) {
      // Primeira parte: ((Valor de S)-B do S)/A do S
      const parte1 = (valorS - paramB) / paramA
      
      // Segunda parte: ((Branco do S)-B do S)/A do S
      const parte2 = (brancoS - paramB) / paramA
      
      // Resultado final: (parte1 - parte2) * 15/10 * 2.5
      resultados.s = (parte1 - parte2) * (15/10) * 2.5
    } else {
      resultados.s = 0
    }
  } else if (dadosBrutos.s !== undefined) {
    // Fallback para compatibilidade com dados antigos (sem fórmula complexa)
    resultados.s = dadosBrutos.s
  }

  // PREM = SE(valor do Prem="";"-";((valor do PREM-B do Prem)/A do PREM)*Dil Prem)
  if (dadosBrutos.prem !== undefined && dadosBrutos.prem_param_a !== undefined && 
      dadosBrutos.prem_param_b !== undefined && dadosBrutos.prem_dil !== undefined) {
    
    const valorPrem = dadosBrutos.prem
    const paramA = dadosBrutos.prem_param_a
    const paramB = dadosBrutos.prem_param_b
    const diluicaoPrem = dadosBrutos.prem_dil
    
    // Se valor do PREM for vazio ou 0, retornar 0 (equivalente ao "-" da fórmula)
    if (valorPrem === 0 || valorPrem === null || valorPrem === undefined) {
      resultados.prem = 0
    } else if (paramA !== 0) {
      // Fórmula: ((valor do PREM - B do Prem)/A do PREM)*Dil Prem
      resultados.prem = ((valorPrem - paramB) / paramA) * diluicaoPrem
    } else {
      resultados.prem = 0
    }
  } else if (dadosBrutos.prem !== undefined && dadosBrutos.prem_dil !== undefined) {
    // Fallback para compatibilidade com dados antigos
    resultados.prem = dadosBrutos.prem * dadosBrutos.prem_dil
  }

  // N = SE(Massa N Bruto="";"";((Valor N Bruto-Branco do Fator N Bruto)*Fator F calculado*1,4)/Massa N Bruto)
  if (dadosBrutos.massaN !== undefined && dadosBrutos.volumeN !== undefined && 
      dadosBrutos.brancoN !== undefined && dadosBrutos.fatorF !== undefined) {
    
    const massaNBruto = dadosBrutos.massaN
    const valorNBruto = dadosBrutos.volumeN
    const brancoFatorNBruto = dadosBrutos.brancoN
    const fatorFCalculado = dadosBrutos.fatorF
    
    // Se Massa N Bruto estiver vazia, retornar undefined (equivalente ao "" da fórmula)
    if (!massaNBruto || massaNBruto === 0) {
      resultados.n = undefined
    } else {
      // Fórmula: ((Valor N Bruto - Branco do Fator N Bruto) * Fator F calculado * 1.4) / Massa N Bruto
      resultados.n = ((valorNBruto - brancoFatorNBruto) * fatorFCalculado * 1.4) / massaNBruto
    }
  }

  return resultados
}

// Função para formatar números com casas decimais apropriadas
export function formatarResultado(valor: number | undefined | string, casasDecimais: number = 2): string {
  if (valor === undefined || valor === null) {
    return '-'
  }
  
  // Converter para número se necessário
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor
  
  if (isNaN(valorNumerico)) {
    return '-'
  }
  
  return valorNumerico.toFixed(casasDecimais)
}

// Função para arredondar valores
export function arredondar(valor: number | undefined, casasDecimais: number = 2): number | undefined {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return undefined
  }
  return Math.round(valor * Math.pow(10, casasDecimais)) / Math.pow(10, casasDecimais)
}

// Função específica para cálculos do módulo foliar
export function calcularResultadosFoliar(dadosBrutos: DadosBrutos): CalculadosResultados {
  const resultados: CalculadosResultados = {}
  
  
  // P = SE(Massa Geral Bruto="";"";(((Valor P Bruto-B do P bruto)/A do P Bruto)*Dil P Bruto*((21/Massa Geral Bruto)*5*2))/1000)
  if (dadosBrutos.p !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.p_param_a !== undefined && 
      dadosBrutos.p_param_b !== undefined && dadosBrutos.p_dil !== undefined) {
    
    const valorPBruto = dadosBrutos.p
    const brancoPBruto = dadosBrutos.p_param_b
    const paramAP = dadosBrutos.p_param_a
    const diluicaoPBruto = dadosBrutos.p_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    
    const resultadoP = (((valorPBruto - brancoPBruto) / paramAP) * diluicaoPBruto * ((21 / massaGeralBruto) * 5 * 2)) / 1000
    resultados.p = resultadoP
    
  }
  
  // K = SE(Massa Geral Bruto="";"";((Valor de K Bruto*(21/Massa Geral Bruto)*5)*Dil K Bruto)/1000)
  if (dadosBrutos.k !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.k_dil !== undefined) {
    
    const valorKBruto = dadosBrutos.k
    const diluicaoKBruto = dadosBrutos.k_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    
    
    const resultadoK = ((valorKBruto * (21 / massaGeralBruto) * 5) * diluicaoKBruto) / 1000
    resultados.k = resultadoK
    
  }
  
  // Ca = SE(Massa Geral Bruto="";"";(((21/Massa Geral Bruto)*5*(10,5/0,5))*Valor de Ca Bruto*Dil Ca Bruto)/1000)
  if (dadosBrutos.ca !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.ca_dil !== undefined) {
    
    const valorCaBruto = dadosBrutos.ca
    const diluicaoCaBruto = dadosBrutos.ca_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    
    const resultadoCa = (((21 / massaGeralBruto) * 5 * (10.5 / 0.5)) * valorCaBruto * diluicaoCaBruto) / 1000
    resultados.ca = resultadoCa
  }
  
  // Mg = SE(Massa Geral Bruto="";"";(((21/Massa Geral Bruto)*5*(10,5/0,5))*Valor Mg Bruto*Dil Mg Bruto)/1000)
  if (dadosBrutos.mg !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.mg_dil !== undefined) {
    
    const valorMgBruto = dadosBrutos.mg
    const diluicaoMgBruto = dadosBrutos.mg_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    
    const resultadoMg = (((21 / massaGeralBruto) * 5 * (10.5 / 0.5)) * valorMgBruto * diluicaoMgBruto) / 1000
    resultados.mg = resultadoMg
  }
  
  // S = SE(Valor S Bruto="";"";(((Valor S Bruto-B do S Bruto)/A do S Bruto)-((Branco do S Bruto-B do S Bruto)/A do S Bruto))*((21/Massa Geral Bruto)*2)*Dil S Bruto/1000)
  if (dadosBrutos.s !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.s_param_a !== undefined && 
      dadosBrutos.s_param_b !== undefined && dadosBrutos.s_branco !== undefined && 
      dadosBrutos.s_dil !== undefined) {
    
    const valorSBruto = dadosBrutos.s
    const brancoSBruto = dadosBrutos.s_branco
    const paramAS = dadosBrutos.s_param_a
    const paramBS = dadosBrutos.s_param_b
    const diluicaoSBruto = dadosBrutos.s_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    
    const resultadoS = (((valorSBruto - paramBS) / paramAS) - ((brancoSBruto - paramBS) / paramAS)) * ((21 / massaGeralBruto) * 2) * diluicaoSBruto / 1000
    resultados.s = resultadoS
  }
  
  // B (Foliar): usar fórmula-base quando parâmetros disponíveis; caso contrário, não exibir (undefined)
  // (((2-LOG10(valor boro)-B do boro)/A do boro)-((2-LOG10(branco do boro)-B do boro)/A do boro)) * 6/4 * 2
  if (dadosBrutos.b !== undefined && dadosBrutos.b_branco !== undefined && 
      dadosBrutos.b_param_a !== undefined && dadosBrutos.b_param_b !== undefined) {
    const valorBoro = dadosBrutos.b
    const brancoBoro = dadosBrutos.b_branco
    const paramA = dadosBrutos.b_param_a
    const paramB = dadosBrutos.b_param_b
    if (valorBoro > 0 && brancoBoro > 0 && paramA !== 0) {
      const parte1 = (2 - Math.log10(valorBoro) - paramB) / paramA
      const parte2 = (2 - Math.log10(brancoBoro) - paramB) / paramA
      resultados.b = (parte1 - parte2) * (6/4) * 2
    } else {
      resultados.b = undefined
    }
  }
  
  // Micronutrientes (Fe, Zn, Cu, Mn) padrão: valor * diluição
  if (dadosBrutos.fe !== undefined && dadosBrutos.fe_dil !== undefined) {
    resultados.fe = dadosBrutos.fe * dadosBrutos.fe_dil
  }
  if (dadosBrutos.zn !== undefined && dadosBrutos.zn_dil !== undefined) {
    resultados.zn = dadosBrutos.zn * dadosBrutos.zn_dil
  }
  if (dadosBrutos.cu !== undefined && dadosBrutos.cu_dil !== undefined) {
    // Mantém a mesma regra do solo (0.1 se < 0.01 antes da diluição)
    const valorCu = dadosBrutos.cu
    const dilCu = dadosBrutos.cu_dil
    resultados.cu = valorCu < 0.01 ? 0.1 : valorCu * dilCu
  }
  if (dadosBrutos.mn !== undefined && dadosBrutos.mn_dil !== undefined) {
    resultados.mn = dadosBrutos.mn * dadosBrutos.mn_dil
  }
  
  // Nitrogênio (Foliar) – mesma regra usada no cálculo geral
  if (dadosBrutos.massaN !== undefined && dadosBrutos.volumeN !== undefined && 
      dadosBrutos.brancoN !== undefined && dadosBrutos.fatorF !== undefined) {
    const massaNBruto = dadosBrutos.massaN
    const valorNBruto = dadosBrutos.volumeN
    const brancoFatorNBruto = dadosBrutos.brancoN
    const fatorFCalculado = dadosBrutos.fatorF
    if (!massaNBruto || massaNBruto === 0) {
      resultados.n = undefined
    } else {
      resultados.n = ((valorNBruto - brancoFatorNBruto) * fatorFCalculado * 1.4) / massaNBruto
    }
  }
  
  // PREM (mantém solo)
  return resultados
}
