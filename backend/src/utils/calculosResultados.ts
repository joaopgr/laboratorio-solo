// Funções para cálculo de resultados no backend

export interface DadosBrutos {
  ph?: number
  p?: number
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
}

export function calcularResultados(dadosBrutos: DadosBrutos): CalculadosResultados {
  const resultados: CalculadosResultados = {}

  // PH = ph (mesmo valor)
  if (dadosBrutos.ph !== undefined) {
    resultados.ph = dadosBrutos.ph
  }

  // P = vamos pular por enquanto (curvas)
  // resultados.p = dadosBrutos.p

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

  // Al = Al (mesmo valor)
  if (dadosBrutos.al !== undefined) {
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

  return resultados
}

// Função para preparar dados brutos a partir de resultados do banco
export function prepararDadosBrutos(resultados: any[]): DadosBrutos {
  const dadosBrutos: DadosBrutos = {}
  
  resultados.forEach(resultado => {
    const { tipo, valor, diluicao, massa, branco, al, h_al } = resultado
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
    }
  })
  
  return dadosBrutos
}
