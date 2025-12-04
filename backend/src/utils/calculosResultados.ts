// Funções para cálculo de resultados no backend

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
  b_branco?: number
  b_param_a?: number
  b_param_b?: number
  s?: number
  s_branco?: number
  s_param_a?: number
  s_param_b?: number
  prem?: number
  prem_dil?: number
  prem_param_a?: number
  prem_param_b?: number
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
  n?: number
}

export function calcularResultados(dadosBrutos: DadosBrutos): CalculadosResultados {
  const resultados: CalculadosResultados = {}

  // PH = ph (mesmo valor)
  if (dadosBrutos.ph !== undefined) {
    resultados.ph = dadosBrutos.ph
  }

  // P = ((valor do P - B do P)/ A do P)* Dil do P
  if (dadosBrutos.p !== undefined && dadosBrutos.p_param_a !== undefined && 
      dadosBrutos.p_param_b !== undefined && dadosBrutos.p_dil !== undefined) {
    const valorP = dadosBrutos.p
    const paramA = dadosBrutos.p_param_a
    const paramB = dadosBrutos.p_param_b
    const diluicaoP = dadosBrutos.p_dil
    
    if (valorP === 0 || valorP === null || valorP === undefined) {
      resultados.p = 0
    } else if (paramA !== 0) {
      resultados.p = ((valorP - paramB) / paramA) * diluicaoP
    } else {
      resultados.p = 0
    }
  } else if (dadosBrutos.p !== undefined) {
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

  // Ca = Ca * dil * 1,05
  if (dadosBrutos.ca !== undefined && dadosBrutos.ca_dil !== undefined) {
    resultados.ca = dadosBrutos.ca * dadosBrutos.ca_dil * 1.05
  }

  // Mg = Mg * Dil * 1,728
  if (dadosBrutos.mg !== undefined && dadosBrutos.mg_dil !== undefined) {
    resultados.mg = dadosBrutos.mg * dadosBrutos.mg_dil * 1.728
  }

  // Al = SE(valor pH>=5,5;0;SE(Valor Al="";"-";Valor Al))
  if (dadosBrutos.al !== undefined && dadosBrutos.ph !== undefined) {
    if (dadosBrutos.ph >= 5.5) {
      resultados.al = 0
    } else {
      resultados.al = dadosBrutos.al
    }
  } else if (dadosBrutos.al !== undefined) {
    resultados.al = dadosBrutos.al
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

  // Cu = Cu * dil
  if (dadosBrutos.cu !== undefined && dadosBrutos.cu_dil !== undefined) {
    resultados.cu = dadosBrutos.cu * dadosBrutos.cu_dil
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
  if (dadosBrutos.b !== undefined && dadosBrutos.b_param_a !== undefined && 
      dadosBrutos.b_param_b !== undefined && dadosBrutos.b_branco !== undefined) {
    const valorBoro = dadosBrutos.b
    const paramA = dadosBrutos.b_param_a
    const paramB = dadosBrutos.b_param_b
    const brancoBoro = dadosBrutos.b_branco
    
    if (valorBoro > 0 && brancoBoro > 0 && paramA !== 0) {
      const logValor = Math.log10(valorBoro)
      const logBranco = Math.log10(brancoBoro)
      resultados.b = (((2 - logValor - paramB) / paramA) - ((2 - logBranco - paramB) / paramA)) * 6 / 4 * 2
    }
  }

  // S = SE(Valor de S="";"-";((((Valor de S)-B do S)/A do S)-[=(((Branco do S)-B do S)/A do S)])*15/10*2,5)
  if (dadosBrutos.s !== undefined && dadosBrutos.s_branco !== undefined && 
      dadosBrutos.s_param_a !== undefined && dadosBrutos.s_param_b !== undefined) {
    const valorS = dadosBrutos.s
    const brancoS = dadosBrutos.s_branco
    const paramA = dadosBrutos.s_param_a
    const paramB = dadosBrutos.s_param_b
    
    if (valorS === 0 || valorS === null || valorS === undefined) {
      resultados.s = 0
    } else if (paramA !== 0) {
      const parte1 = (valorS - paramB) / paramA
      const parte2 = (brancoS - paramB) / paramA
      resultados.s = (parte1 - parte2) * (15/10) * 2.5
    } else {
      resultados.s = 0
    }
  } else if (dadosBrutos.s !== undefined) {
    resultados.s = dadosBrutos.s
  }

  // PREM = ((valor do PREM-B do Prem)/A do PREM)*Dil Prem
  if (dadosBrutos.prem !== undefined && dadosBrutos.prem_param_a !== undefined && 
      dadosBrutos.prem_param_b !== undefined && dadosBrutos.prem_dil !== undefined) {
    const valorPrem = dadosBrutos.prem
    const paramA = dadosBrutos.prem_param_a
    const paramB = dadosBrutos.prem_param_b
    const diluicaoPrem = dadosBrutos.prem_dil
    
    if (valorPrem === 0 || valorPrem === null || valorPrem === undefined) {
      resultados.prem = 0
    } else if (paramA !== 0) {
      resultados.prem = ((valorPrem - paramB) / paramA) * diluicaoPrem
    } else {
      resultados.prem = 0
    }
  }

  return resultados
}

// Função para preparar dados brutos a partir de resultados do banco
export function prepararDadosBrutos(resultados: any[]): DadosBrutos {
  const dadosBrutos: DadosBrutos = {}
  
  resultados.forEach(resultado => {
    const { tipo, valor, diluicao, massa, branco, al, h_al, param_a, param_b } = resultado
    const valorNum = parseFloat(valor) || 0
    const diluicaoNum = parseFloat(diluicao) || 1
    const massaNum = parseFloat(massa) || 0
    const brancoNum = parseFloat(branco) || 0
    const alNum = parseFloat(al) || 0
    const hAlNum = parseFloat(h_al) || 0
    
    switch (tipo) {
      case 'pH':
        dadosBrutos.ph = valorNum
        break
      case 'P':
        dadosBrutos.p = valorNum
        dadosBrutos.p_dil = diluicaoNum
        dadosBrutos.p_param_a = parseFloat(param_a) || 0
        dadosBrutos.p_param_b = parseFloat(param_b) || 0
        break
      case 'Na':
        dadosBrutos.na = valorNum
        dadosBrutos.na_dil = diluicaoNum
        break
      case 'K':
        dadosBrutos.k = valorNum
        dadosBrutos.k_dil = diluicaoNum
        break
      case 'Ca':
        dadosBrutos.ca = valorNum
        dadosBrutos.ca_dil = diluicaoNum
        break
      case 'Mg':
        dadosBrutos.mg = valorNum
        dadosBrutos.mg_dil = diluicaoNum
        break
      case 'Al':
        dadosBrutos.al = valorNum
        break
      case 'H+Al':
        dadosBrutos.h_al = hAlNum || valorNum
        dadosBrutos.h_al_branco = brancoNum
        break
      case 'MO':
        dadosBrutos.mo = valorNum
        dadosBrutos.mo_massa = massaNum
        dadosBrutos.mo_branco = brancoNum
        break
      case 'Fe':
        dadosBrutos.fe = valorNum
        dadosBrutos.fe_dil = diluicaoNum
        break
      case 'Cu':
        dadosBrutos.cu = valorNum
        dadosBrutos.cu_dil = diluicaoNum
        break
      case 'Zn':
        dadosBrutos.zn = valorNum
        dadosBrutos.zn_dil = diluicaoNum
        break
      case 'Mn':
        dadosBrutos.mn = valorNum
        dadosBrutos.mn_dil = diluicaoNum
        break
      case 'B':
        if (valor && valor !== 'null' && valor !== null && String(valor).trim() !== '') {
          dadosBrutos.b = valorNum
        }
        if (branco && branco !== 'null' && branco !== null && String(branco).trim() !== '') {
          dadosBrutos.b_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a !== null && String(param_a).trim() !== '') {
          dadosBrutos.b_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b !== null && String(param_b).trim() !== '') {
          dadosBrutos.b_param_b = parseFloat(param_b)
        }
        break
      case 'S':
        dadosBrutos.s = valorNum
        if (branco && branco !== 'null' && branco !== null && String(branco).trim() !== '') {
          dadosBrutos.s_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a !== null && String(param_a).trim() !== '') {
          dadosBrutos.s_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b !== null && String(param_b).trim() !== '') {
          dadosBrutos.s_param_b = parseFloat(param_b)
        }
        break
      case 'PREM':
        dadosBrutos.prem = valorNum
        dadosBrutos.prem_dil = diluicaoNum
        dadosBrutos.prem_param_a = parseFloat(param_a) || 0
        dadosBrutos.prem_param_b = parseFloat(param_b) || 0
        break
    }
  })
  
  return dadosBrutos
}

// Função para calcular resultados foliares
export function calcularResultadosFoliar(resultados: any[]): CalculadosResultados {
  // Preparar dados brutos para os cálculos
  const dadosBrutos: any = {}
  
  resultados.forEach(resultado => {
    const { tipo, valor, diluicao, massa, branco, al, h_al, param_a, param_b, massaN, volumeN, brancoN, fatorF, massaGeral, massaBFoliar, diluicaoBFoliar, brancoBFoliar, dilB, brancoB } = resultado
    const valorNum = parseFloat(valor) || 0
    const diluicaoNum = parseFloat(diluicao) || 1
    const massaNum = parseFloat(massa) || 0
    const brancoNum = parseFloat(branco) || 0
    
    switch (tipo) {
      case 'P':
        dadosBrutos.p = valorNum
        dadosBrutos.p_dil = diluicaoNum
        dadosBrutos.p_param_a = parseFloat(param_a) || 0
        dadosBrutos.p_param_b = parseFloat(param_b) || 0
        break
      case 'K':
        dadosBrutos.k = valorNum
        dadosBrutos.k_dil = diluicaoNum
        break
      case 'Ca':
        dadosBrutos.ca = valorNum
        dadosBrutos.ca_dil = diluicaoNum
        break
      case 'Mg':
        dadosBrutos.mg = valorNum
        dadosBrutos.mg_dil = diluicaoNum
        break
      case 'S':
        dadosBrutos.s = valorNum
        dadosBrutos.s_dil = diluicaoNum
        if (branco && branco !== 'null' && branco !== null && String(branco).trim() !== '') {
          dadosBrutos.s_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a !== null && String(param_a).trim() !== '') {
          dadosBrutos.s_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b !== null && String(param_b).trim() !== '') {
          dadosBrutos.s_param_b = parseFloat(param_b)
        }
        break
      case 'Fe':
        dadosBrutos.fe = valorNum
        dadosBrutos.fe_dil = diluicaoNum
        break
      case 'Cu':
        dadosBrutos.cu = valorNum
        dadosBrutos.cu_dil = diluicaoNum
        break
      case 'Zn':
        dadosBrutos.zn = valorNum
        dadosBrutos.zn_dil = diluicaoNum
        break
      case 'Mn':
        dadosBrutos.mn = valorNum
        dadosBrutos.mn_dil = diluicaoNum
        break
      case 'B':
        if (valor && valor !== 'null' && valor !== null && String(valor).trim() !== '') {
          dadosBrutos.b = valorNum
        }
        if (brancoB && brancoB !== 'null' && brancoB !== null && String(brancoB).trim() !== '') {
          dadosBrutos.b_branco = parseFloat(brancoB)
        } else if (brancoBFoliar && brancoBFoliar !== 'null' && brancoBFoliar !== null && String(brancoBFoliar).trim() !== '') {
          dadosBrutos.b_branco = parseFloat(brancoBFoliar)
        } else if (branco && branco !== 'null' && branco !== null && String(branco).trim() !== '') {
          dadosBrutos.b_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a !== null && String(param_a).trim() !== '') {
          dadosBrutos.b_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b !== null && String(param_b).trim() !== '') {
          dadosBrutos.b_param_b = parseFloat(param_b)
        }
        if (massaBFoliar && massaBFoliar !== 'null' && massaBFoliar !== null && String(massaBFoliar).trim() !== '') {
          dadosBrutos.massaBFoliar = parseFloat(massaBFoliar)
        }
        if (dilB && dilB !== 'null' && dilB !== null && String(dilB).trim() !== '') {
          dadosBrutos.b_dil = parseFloat(dilB)
        } else if (diluicaoBFoliar && diluicaoBFoliar !== 'null' && diluicaoBFoliar !== null && String(diluicaoBFoliar).trim() !== '') {
          dadosBrutos.b_dil = parseFloat(diluicaoBFoliar)
        } else if (diluicao && diluicao !== 'null' && diluicao !== null && String(diluicao).trim() !== '') {
          dadosBrutos.b_dil = diluicaoNum
        }
        break
      case 'N':
        if (massaN && massaN !== 'null' && massaN !== null && String(massaN).trim() !== '') {
          dadosBrutos.massaN = parseFloat(massaN)
        }
        if (volumeN && volumeN !== 'null' && volumeN !== null && String(volumeN).trim() !== '') {
          dadosBrutos.volumeN = parseFloat(volumeN)
        }
        if (brancoN && brancoN !== 'null' && brancoN !== null && String(brancoN).trim() !== '') {
          dadosBrutos.brancoN = parseFloat(brancoN)
        }
        if (fatorF && fatorF !== 'null' && fatorF !== null && String(fatorF).trim() !== '') {
          dadosBrutos.fatorF = parseFloat(fatorF)
        }
        break
      case 'MASSA_GERAL':
        dadosBrutos.massaGeral = parseFloat(massaGeral) || parseFloat(valor) || 0
        dadosBrutos.massaGeralBruto = parseFloat(massaGeral) || parseFloat(valor) || 0
        break
    }
  })
  
  // Calcular resultados usando as fórmulas específicas do foliar
  const resultadosCalculados: any = {}
  
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
    resultadosCalculados.p = resultadoP
  }
  
  // K = SE(Massa Geral Bruto="";"";((Valor de K Bruto*(21/Massa Geral Bruto)*5)*Dil K Bruto)/1000)
  if (dadosBrutos.k !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.k_dil !== undefined) {
    const valorKBruto = dadosBrutos.k
    const diluicaoKBruto = dadosBrutos.k_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoK = ((valorKBruto * (21 / massaGeralBruto) * 5) * diluicaoKBruto) / 1000
    resultadosCalculados.k = resultadoK
  }
  
  // Ca = SE(Massa Geral Bruto="";"";(((21/Massa Geral Bruto)*5*(10,5/0,5))*Valor de Ca Bruto*Dil Ca Bruto)/1000)
  if (dadosBrutos.ca !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.ca_dil !== undefined) {
    const valorCaBruto = dadosBrutos.ca
    const diluicaoCaBruto = dadosBrutos.ca_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoCa = (((21 / massaGeralBruto) * 5 * (10.5 / 0.5)) * valorCaBruto * diluicaoCaBruto) / 1000
    resultadosCalculados.ca = resultadoCa
  }
  
  // Mg = SE(Massa Geral Bruto="";"";(((21/Massa Geral Bruto)*5*(10,5/0,5))*Valor Mg Bruto*Dil Mg Bruto)/1000)
  if (dadosBrutos.mg !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.mg_dil !== undefined) {
    const valorMgBruto = dadosBrutos.mg
    const diluicaoMgBruto = dadosBrutos.mg_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoMg = (((21 / massaGeralBruto) * 5 * (10.5 / 0.5)) * valorMgBruto * diluicaoMgBruto) / 1000
    resultadosCalculados.mg = resultadoMg
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
    const parte1 = ((valorSBruto - paramBS) / paramAS)
    const parte2 = ((brancoSBruto - paramBS) / paramAS)
    const resultadoS = ((parte1 - parte2) * ((21 / massaGeralBruto) * 2) * diluicaoSBruto) / 1000
    resultadosCalculados.s = resultadoS
  }
  
  // Fe = SE(Massa Geral Bruto="";"";((21/Massa Geral Bruto)*Valor Fe Bruto*Dil Fe Bruto))
  if (dadosBrutos.fe !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.fe_dil !== undefined) {
    const valorFeBruto = dadosBrutos.fe
    const diluicaoFeBruto = dadosBrutos.fe_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoFe = ((21 / massaGeralBruto) * valorFeBruto * diluicaoFeBruto)
    resultadosCalculados.fe = resultadoFe
  }
  
  // Cu = SE(Massa Geral Bruto="";"";((21/Massa Geral Bruto)*Valor Cu Bruto*Dil Cu Bruto))
  if (dadosBrutos.cu !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.cu_dil !== undefined) {
    const valorCuBruto = dadosBrutos.cu
    const diluicaoCuBruto = dadosBrutos.cu_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoCu = ((21 / massaGeralBruto) * valorCuBruto * diluicaoCuBruto)
    resultadosCalculados.cu = resultadoCu
  }
  
  // Zn = SE(Massa Geral Bruto="";"";((21/Massa Geral Bruto)*Valor Zn Bruto*Dil Zn Bruto))
  if (dadosBrutos.zn !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.zn_dil !== undefined) {
    const valorZnBruto = dadosBrutos.zn
    const diluicaoZnBruto = dadosBrutos.zn_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoZn = ((21 / massaGeralBruto) * valorZnBruto * diluicaoZnBruto)
    resultadosCalculados.zn = resultadoZn
  }
  
  // Mn = SE(Massa Geral Bruto="";"";((21/Massa Geral Bruto)*Valor Mn Bruto*Dil Mn Bruto))
  if (dadosBrutos.mn !== undefined && dadosBrutos.massaGeralBruto !== undefined && 
      dadosBrutos.massaGeralBruto > 0 && dadosBrutos.mn_dil !== undefined) {
    const valorMnBruto = dadosBrutos.mn
    const diluicaoMnBruto = dadosBrutos.mn_dil
    const massaGeralBruto = dadosBrutos.massaGeralBruto
    const resultadoMn = ((21 / massaGeralBruto) * valorMnBruto * diluicaoMnBruto)
    resultadosCalculados.mn = resultadoMn
  }
  
  // B = SEERRO((((2-LOG10(Valor B Bruto)-B do B bruto)/A do B Bruto)-((2-LOG10(Branco do B Bruto)-B do B Bruto)/A do B Bruto))*((25/Massa do B Bruto)*(6/4))*Dil B Bruto;"")
  if (dadosBrutos.b !== undefined && dadosBrutos.massaBFoliar !== undefined && 
      dadosBrutos.massaBFoliar > 0 && dadosBrutos.b_param_a !== undefined && 
      dadosBrutos.b_param_b !== undefined && dadosBrutos.b_branco !== undefined && 
      dadosBrutos.b_dil !== undefined) {
    try {
      const valorBBruto = dadosBrutos.b
      const brancoBBruto = dadosBrutos.b_branco
      const paramAB = dadosBrutos.b_param_a
      const paramBB = dadosBrutos.b_param_b
      const diluicaoBBruto = dadosBrutos.b_dil
      const massaBBruto = dadosBrutos.massaBFoliar
      const parte1 = ((2 - Math.log10(valorBBruto) - paramBB) / paramAB)
      const parte2 = ((2 - Math.log10(brancoBBruto) - paramBB) / paramAB)
      const resultadoB = ((parte1 - parte2) * ((25 / massaBBruto) * (6 / 4)) * diluicaoBBruto)
      resultadosCalculados.b = resultadoB
    } catch (error) {
      console.log('DEBUG Boro - erro no cálculo:', error)
      resultadosCalculados.b = 0
    }
  }
  
  // N = ((Valor N Bruto - Branco do Fator N Bruto) * Fator F calculado * 1.4) / Massa N Bruto
  if (dadosBrutos.massaN !== undefined && dadosBrutos.volumeN !== undefined && 
      dadosBrutos.brancoN !== undefined && dadosBrutos.fatorF !== undefined) {
    const massaN = dadosBrutos.massaN
    const volumeN = dadosBrutos.volumeN
    const brancoN = dadosBrutos.brancoN
    const fatorF = dadosBrutos.fatorF
    if (massaN !== 0) {
      resultadosCalculados.n = ((volumeN - brancoN) * fatorF * 1.4) / massaN
    }
  }
  
  return resultadosCalculados
}
