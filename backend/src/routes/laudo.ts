import { Router } from 'express'
import { z } from 'zod'
import { query } from '../database/connection'
import { SQL_QUERIES } from '../database/queries'
import * as path from 'path'
import * as fs from 'fs'
import { authenticateToken, authorizeRoles } from './auth'
import QRCode from 'qrcode'
// PDF será gerado no frontend
import { getUfesLogoBase64, getLabLogoBase64, getSeloBase64, getAssinaturaBase64 } from '../utils/imageUtils'

const router = Router()
router.use(authenticateToken, authorizeRoles('admin', 'funcionario', 'estagiario', 'recepcao', 'visitante', 'cliente'))
const pastaLaudos = 'C:\\xampp\\htdocs\\lab\\laudos'

// Função auxiliar para formatar valores (trata 0 como valor válido)
function formatarValor(valor: number | undefined, casasDecimais: number = 2): string {
  if (valor === undefined || valor === null) {
    return '-'
  }
  return valor.toFixed(casasDecimais)
}

// Schema para validação dos dados do laudo
const gerarLaudoSchema = z.object({
  loteId: z.string(),
  tipoAnalise: z.enum(['geral', 'granulometrica', 'foliar']).optional().default('geral')
})

// Função para calcular resultados foliares (mesma lógica do frontend)
function calcularResultadosFoliar(resultados: any[]) {
  // Preparar dados brutos para os cálculos
  const dadosBrutos: any = {}
  
  resultados.forEach(resultado => {
    const { tipo, valor, diluicao, massa, branco, al, h_al, param_a, param_b, massaN, volumeN, brancoN, fatorF, massaGeral, massaBFoliar, diluicaoBFoliar, brancoBFoliar } = resultado
    const valorNum = parseFloat(valor) || 0
    const diluicaoNum = parseFloat(diluicao) || 1
    const massaNum = parseFloat(massa) || 0
    const brancoNum = parseFloat(branco) || 0
    const alNum = parseFloat(al) || 0
    const hAlNum = parseFloat(h_al) || 0
    
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
        if (branco && branco !== 'null' && branco !== null && String(branco).trim() !== '') {
          dadosBrutos.b_branco = brancoNum
        }
        // Também verificar se há brancoBFoliar no resultado
        if (brancoBFoliar && brancoBFoliar !== 'null' && brancoBFoliar !== null && String(brancoBFoliar).trim() !== '') {
          dadosBrutos.b_branco = parseFloat(brancoBFoliar)
        }
        // Priorizar brancoB (nome atual no banco)
        if ((resultado as any).brancoB !== undefined && (resultado as any).brancoB !== null && String((resultado as any).brancoB).trim() !== '') {
          dadosBrutos.b_branco = parseFloat(String((resultado as any).brancoB))
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
        if (diluicao && diluicao !== 'null' && diluicao !== null && String(diluicao).trim() !== '') {
          dadosBrutos.b_dil = diluicaoNum
        }
        // Também verificar se há diluicaoBFoliar no resultado
        if (diluicaoBFoliar && diluicaoBFoliar !== 'null' && diluicaoBFoliar !== null && String(diluicaoBFoliar).trim() !== '') {
          dadosBrutos.b_dil = parseFloat(diluicaoBFoliar)
        }
        // Priorizar dilB (nome atual no banco)
        if ((resultado as any).dilB !== undefined && (resultado as any).dilB !== null && String((resultado as any).dilB).trim() !== '') {
          dadosBrutos.b_dil = parseFloat(String((resultado as any).dilB))
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

// Função para calcular resultados finais (mesma lógica do frontend)
function calcularResultadosFinais(resultados: any[]) {
  // Preparar dados brutos para os cálculos
  const dadosBrutos: any = {}
  
  resultados.forEach(resultado => {
    const { tipo, valor, diluicao, massa, branco, al, h_al, param_a, param_b, massaN, volumeN, brancoN, fatorF, massaGeral, massaBFoliar, diluicaoBFoliar, brancoBFoliar } = resultado
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
      case 'H+Al':
        if (al) dadosBrutos.al = alNum
        if (h_al) dadosBrutos.h_al = hAlNum
        if (branco) dadosBrutos.h_al_branco = brancoNum
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
        if (valor && valor !== 'null' && valor.trim() !== '') {
          dadosBrutos.b = valorNum
        }
        if (branco && branco !== 'null' && branco.trim() !== '') {
          dadosBrutos.b_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a.trim() !== '') {
          dadosBrutos.b_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b.trim() !== '') {
          dadosBrutos.b_param_b = parseFloat(param_b)
        }
        break
      case 'S':
        dadosBrutos.s = valorNum
        if (branco && branco !== 'null' && branco.trim() !== '') {
          dadosBrutos.s_branco = brancoNum
        }
        if (param_a && param_a !== 'null' && param_a.trim() !== '') {
          dadosBrutos.s_param_a = parseFloat(param_a)
        }
        if (param_b && param_b !== 'null' && param_b.trim() !== '') {
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
  
  // Calcular resultados usando a função do frontend
  const resultadosCalculados: any = {}
  
  
  // PH = ph (mesmo valor)
  if (dadosBrutos.ph !== undefined) {
    resultadosCalculados.ph = dadosBrutos.ph
  }
  
  // P = ((valor do P - B do P)/ A do P)* Dil do P
  if (dadosBrutos.p !== undefined && dadosBrutos.p_param_a !== undefined && 
      dadosBrutos.p_param_b !== undefined && dadosBrutos.p_dil !== undefined) {
    const valorP = dadosBrutos.p
    const paramA = dadosBrutos.p_param_a
    const paramB = dadosBrutos.p_param_b
    const diluicaoP = dadosBrutos.p_dil
    
    if (valorP === 0 || valorP === null || valorP === undefined) {
      resultadosCalculados.p = 0
    } else if (paramA !== 0) {
      resultadosCalculados.p = ((valorP - paramB) / paramA) * diluicaoP
    } else {
      resultadosCalculados.p = 0
    }
  } else if (dadosBrutos.p !== undefined) {
    resultadosCalculados.p = dadosBrutos.p
  }
  
  // Na = Na * Dil
  if (dadosBrutos.na !== undefined && dadosBrutos.na_dil !== undefined) {
    resultadosCalculados.na = dadosBrutos.na * dadosBrutos.na_dil
  }
  
  // K = K * Dil
  if (dadosBrutos.k !== undefined && dadosBrutos.k_dil !== undefined) {
    resultadosCalculados.k = dadosBrutos.k * dadosBrutos.k_dil
  }
  
  // Ca = SE([=SE(Valor Ca="";"-";valor Ca*Dil Ca*1,05)]=0;0,1;[=SE(Valor Ca="";"-";Valor Ca*Dil Ca*1,05)])
  if (dadosBrutos.ca !== undefined && dadosBrutos.ca_dil !== undefined) {
    const caCalculado = dadosBrutos.ca * dadosBrutos.ca_dil * 1.05
    resultadosCalculados.ca = caCalculado === 0 ? 0.1 : caCalculado
  }
  
  // Mg = SE([=SE(Valor Mg="";"-";valor Mg*Dil Mg*1,05)]=0;0,1;[=SE(Valor Mg="";"-";Valor Mg*Dil Mg*1,728)])
  if (dadosBrutos.mg !== undefined && dadosBrutos.mg_dil !== undefined) {
    const mgCalculadoIntermediario = dadosBrutos.mg * dadosBrutos.mg_dil * 1.05
    const mgCalculadoFinal = mgCalculadoIntermediario === 0 ? 0.1 : dadosBrutos.mg * dadosBrutos.mg_dil * 1.728
    resultadosCalculados.mg = mgCalculadoFinal
  }
  
  // Al = SE(valor pH>=5,5;0;SE(Valor Al="";"-";Valor Al))
  if (dadosBrutos.al !== undefined && dadosBrutos.ph !== undefined) {
    if (dadosBrutos.ph >= 5.5) {
      resultadosCalculados.al = 0
    } else {
      resultadosCalculados.al = dadosBrutos.al
    }
  }
  
  // H+Al = Se o ph for > 7 = 0; se o Branco do H+al for > H+al = 0; Se tiver tudo de acordo, (H+al - Branco) * 1,65
  if (dadosBrutos.ph !== undefined && dadosBrutos.h_al !== undefined && dadosBrutos.h_al_branco !== undefined) {
    if (dadosBrutos.ph > 7) {
      resultadosCalculados.h_al = 0
    } else if (dadosBrutos.h_al_branco > dadosBrutos.h_al) {
      resultadosCalculados.h_al = 0
    } else {
      resultadosCalculados.h_al = (dadosBrutos.h_al - dadosBrutos.h_al_branco) * 1.65
    }
  }
  
  // SB = Resultado calculado de Ca + Resultado calculado de Mg + Resultado calculado de K/390 + resultado calculado de NA/230
  const sbCa = resultadosCalculados.ca || 0
  const sbMg = resultadosCalculados.mg || 0
  const sbK = (resultadosCalculados.k || 0) / 390
  const sbNa = (resultadosCalculados.na || 0) / 230
  resultadosCalculados.sb = sbCa + sbMg + sbK + sbNa
  
  
  // t = sb + al calculado
  resultadosCalculados.t = resultadosCalculados.sb + (resultadosCalculados.al || 0)
  
  // CTC = SB + H+al calculado
  resultadosCalculados.ctc = resultadosCalculados.sb + (resultadosCalculados.h_al || 0)
  
  // v = (SB*100) / CTC
  if (resultadosCalculados.ctc !== undefined && resultadosCalculados.ctc !== 0) {
    resultadosCalculados.v = (resultadosCalculados.sb || 0) * 100 / resultadosCalculados.ctc
  }
  
  // m = (Al*100) / t
  if (resultadosCalculados.t !== undefined && resultadosCalculados.t !== 0) {
    resultadosCalculados.m = (resultadosCalculados.al || 0) * 100 / resultadosCalculados.t
  }
  
  
  // MO = ((((branco-valor)*0,5*0,39)/massa)*1,724)*10
  if (dadosBrutos.mo_branco !== undefined && dadosBrutos.mo !== undefined && dadosBrutos.mo_massa !== undefined) {
    resultadosCalculados.mo = (((dadosBrutos.mo_branco - dadosBrutos.mo) * 0.5 * 0.39) / dadosBrutos.mo_massa) * 1.724 * 10
  }
  
  // Fe = Fe * Dil
  if (dadosBrutos.fe !== undefined && dadosBrutos.fe_dil !== undefined) {
    resultadosCalculados.fe = dadosBrutos.fe * dadosBrutos.fe_dil
  }
  
  // Cu = SE(valor do Cu bruto="";"-";SE(valor do Cu bruto<0,01;0,1;valor do Cu bruto*dil Cu bruto))
  if (dadosBrutos.cu !== undefined && dadosBrutos.cu_dil !== undefined) {
    const valorCu = dadosBrutos.cu
    const diluicaoCu = dadosBrutos.cu_dil
    resultadosCalculados.cu = valorCu < 0.01 ? 0.1 : valorCu * diluicaoCu
  }
  
  // Zn = Zn * Dil
  if (dadosBrutos.zn !== undefined && dadosBrutos.zn_dil !== undefined) {
    resultadosCalculados.zn = dadosBrutos.zn * dadosBrutos.zn_dil
  }
  
  // Mn = Mn * Dil
  if (dadosBrutos.mn !== undefined && dadosBrutos.mn_dil !== undefined) {
    resultadosCalculados.mn = dadosBrutos.mn * dadosBrutos.mn_dil
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
      resultadosCalculados.b = (((2 - logValor - paramB) / paramA) - ((2 - logBranco - paramB) / paramA)) * 6 / 4 * 2
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
      resultadosCalculados.s = 0
    } else if (paramA !== 0) {
      // Primeira parte: ((Valor de S)-B do S)/A do S
      const parte1 = (valorS - paramB) / paramA
      
      // Segunda parte: ((Branco do S)-B do S)/A do S
      const parte2 = (brancoS - paramB) / paramA
      
      // Resultado final: (parte1 - parte2) * 15/10 * 2.5
      resultadosCalculados.s = (parte1 - parte2) * (15/10) * 2.5
    } else {
      resultadosCalculados.s = 0
    }
  } else if (dadosBrutos.s !== undefined) {
    // Fallback para compatibilidade com dados antigos (sem fórmula complexa)
    resultadosCalculados.s = dadosBrutos.s
  }
  
  // PREM = ((valor do PREM-B do Prem)/A do PREM)*Dil Prem
  if (dadosBrutos.prem !== undefined && dadosBrutos.prem_param_a !== undefined && 
      dadosBrutos.prem_param_b !== undefined && dadosBrutos.prem_dil !== undefined) {
    const valorPrem = dadosBrutos.prem
    const paramA = dadosBrutos.prem_param_a
    const paramB = dadosBrutos.prem_param_b
    const diluicaoPrem = dadosBrutos.prem_dil
    
    if (valorPrem === 0 || valorPrem === null || valorPrem === undefined) {
      resultadosCalculados.prem = 0
    } else if (paramA !== 0) {
      resultadosCalculados.prem = ((valorPrem - paramB) / paramA) * diluicaoPrem
    } else {
      resultadosCalculados.prem = 0
    }
  }
  
  return resultadosCalculados
}

// Função para calcular resultados granulométricos
async function calcularResultadosGranulometricos(amostraId: string) {
  try {
    console.log('🔍 Calculando resultados granulométricos para amostra:', amostraId)
    
    // Buscar todos os resultados granulométricos da amostra
    const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraId)
    const resultadosResult = await query(resultadosQuery, resultadosParams)
    const resultados = resultadosResult.rows
    
    const resultadosGranulo = resultados.filter((r: any) => 
      ['GRAN_MASSA_RECIPIENTES', 'GRAN_MASSA_RECIPIENTES_PARTICULAS', 'GRAN_MASSA_FATOR_F'].includes(r.tipo)
    )
    
    console.log(`📊 Amostra ${amostraId} - Total resultados: ${resultados.length}, Granulométricos: ${resultadosGranulo.length}`)
    console.log('📊 Tipos de resultados granulométricos:', resultadosGranulo.map((r: any) => r.tipo).join(', '))

  // Converter para dados granulométricos
  const dados: any = {}
  
  resultadosGranulo.forEach(resultado => {
    console.log(`📝 Processando ${resultado.tipo} para amostra ${amostraId}:`, {
      massaRecipienteAreiaGrossa: resultado.massaRecipienteAreiaGrossa,
      massaRecipienteAreiaFina: resultado.massaRecipienteAreiaFina,
      massaRecipienteSilteArgila: resultado.massaRecipienteSilteArgila,
      massaRecipienteArgila: resultado.massaRecipienteArgila,
      massaRecipientePartAreiaGrossa: resultado.massaRecipientePartAreiaGrossa,
      massaRecipientePartAreiaFina: resultado.massaRecipientePartAreiaFina,
      massaRecipientePartSilteArgila: resultado.massaRecipientePartSilteArgila,
      massaRecipientePartArgila: resultado.massaRecipientePartArgila,
      tfsa: resultado.tfsa,
      massaLata: resultado.massaLata,
      massaLataSu: resultado.massaLataSu,
      massaLataSs: resultado.massaLataSs
    })
    
    switch (resultado.tipo) {
      case 'GRAN_MASSA_RECIPIENTES':
        // Só atribuir se o valor não for null/undefined
        if (resultado.massaRecipienteAreiaGrossa !== null && resultado.massaRecipienteAreiaGrossa !== undefined) {
          dados.massaRecipienteAreiaGrossa = resultado.massaRecipienteAreiaGrossa
        }
        if (resultado.massaRecipienteAreiaFina !== null && resultado.massaRecipienteAreiaFina !== undefined) {
          dados.massaRecipienteAreiaFina = resultado.massaRecipienteAreiaFina
        }
        if (resultado.massaRecipienteSilteArgila !== null && resultado.massaRecipienteSilteArgila !== undefined) {
          dados.massaRecipienteSilteArgila = resultado.massaRecipienteSilteArgila
        }
        if (resultado.massaRecipienteArgila !== null && resultado.massaRecipienteArgila !== undefined) {
          dados.massaRecipienteArgila = resultado.massaRecipienteArgila
        }
        break
      case 'GRAN_MASSA_RECIPIENTES_PARTICULAS':
        // Só atribuir se o valor não for null/undefined
        if (resultado.massaRecipientePartAreiaGrossa !== null && resultado.massaRecipientePartAreiaGrossa !== undefined) {
          dados.massaRecipientePartAreiaGrossa = resultado.massaRecipientePartAreiaGrossa
        }
        if (resultado.massaRecipientePartAreiaFina !== null && resultado.massaRecipientePartAreiaFina !== undefined) {
          dados.massaRecipientePartAreiaFina = resultado.massaRecipientePartAreiaFina
        }
        if (resultado.massaRecipientePartSilteArgila !== null && resultado.massaRecipientePartSilteArgila !== undefined) {
          dados.massaRecipientePartSilteArgila = resultado.massaRecipientePartSilteArgila
        }
        if (resultado.massaRecipientePartArgila !== null && resultado.massaRecipientePartArgila !== undefined) {
          dados.massaRecipientePartArgila = resultado.massaRecipientePartArgila
        }
        if (resultado.tfsa !== null && resultado.tfsa !== undefined) {
          dados.tfsa = resultado.tfsa
        }
        break
      case 'GRAN_MASSA_FATOR_F':
        // Só atribuir se o valor não for null/undefined
        if (resultado.massaLata !== null && resultado.massaLata !== undefined) {
          dados.massaLata = resultado.massaLata
        }
        if (resultado.massaLataSu !== null && resultado.massaLataSu !== undefined) {
          dados.massaLataSu = resultado.massaLataSu
        }
        if (resultado.massaLataSs !== null && resultado.massaLataSs !== undefined) {
          dados.massaLataSs = resultado.massaLataSs
        }
        break
    }
  })
  
  console.log('📊 Dados brutos coletados:', dados)

  // Calcular resultados granulométricos (mesma lógica do frontend)
  const resultadosGranulometricos: any = {}
  
  // Q.D Massa das Partículas
  // A. Grossa = Areia grossa bruta de massa dos recipientes+particulas - Areia grossa bruta de massa dos recipientes
  if (dados.massaRecipienteAreiaGrossa && dados.massaRecipientePartAreiaGrossa) {
    resultadosGranulometricos.massaAreiaGrossa = dados.massaRecipientePartAreiaGrossa - dados.massaRecipienteAreiaGrossa
  }
  
  // A. Fina = Areia Fina bruta de massa dos recipientes+particulas - Areia Fina bruta de massa dos recipientes
  if (dados.massaRecipienteAreiaFina && dados.massaRecipientePartAreiaFina) {
    resultadosGranulometricos.massaAreiaFina = dados.massaRecipientePartAreiaFina - dados.massaRecipienteAreiaFina
  }
  
  // Silte = (Valor do campo Silte+argila bruto de massa dos recipientes mais particulas-Valor do campo Silte+argila bruto de massa dos recipientes-valor calculado de Argila de massa das particulas que vem a seguir como calcula)-0,01
  if (dados.massaRecipientePartSilteArgila && dados.massaRecipienteSilteArgila) {
    // Primeiro calcular a argila
    let argilaCalculada = 0
    if (dados.massaRecipientePartArgila && dados.massaRecipienteArgila) {
      argilaCalculada = (dados.massaRecipientePartArgila - dados.massaRecipienteArgila) - 0.01
    }
    resultadosGranulometricos.massaSilte = (dados.massaRecipientePartSilteArgila - dados.massaRecipienteSilteArgila - argilaCalculada) - 0.01
  }
  
  // Argila = (Valor de Argila bruto de Massa dos recipientes mais particulas-valor de argila bruto de massa dos recipientes)-0,01
  if (dados.massaRecipientePartArgila && dados.massaRecipienteArgila) {
    resultadosGranulometricos.massaArgila = (dados.massaRecipientePartArgila - dados.massaRecipienteArgila) - 0.01
  }

  // Silte (correções(diluição)) = Silte calculado de Massa das particulas * 20
  if (resultadosGranulometricos.massaSilte) {
    resultadosGranulometricos.correcaoSilte = resultadosGranulometricos.massaSilte * 20
  }
  
  // Argila (correções(diluição)) = argila calculado de massa das particulas * 20
  if (resultadosGranulometricos.massaArgila) {
    resultadosGranulometricos.correcaoArgila = resultadosGranulometricos.massaArgila * 20
  }

  // TFSA e TFSE
  if (dados.massaLataSu && dados.massaLata) {
    resultadosGranulometricos.tfsa = dados.massaLataSu - dados.massaLata
  }
  
  if (dados.massaLataSs && dados.massaLata) {
    resultadosGranulometricos.tfse = dados.massaLataSs - dados.massaLata
  }

  // Umidade
  if (resultadosGranulometricos.tfsa && resultadosGranulometricos.tfse && resultadosGranulometricos.tfse !== 0) {
    resultadosGranulometricos.umidade = resultadosGranulometricos.tfsa / resultadosGranulometricos.tfse
  }

  // Proporções das Partículas (usando TFSA bruto)
  // A.Grossa = Areia grossa calculado de Massa das particulas*(1000/TFSA bruto)*umidade calculado
  if (resultadosGranulometricos.massaAreiaGrossa && dados.tfsa && resultadosGranulometricos.umidade && dados.tfsa !== 0) {
    resultadosGranulometricos.proporcaoAreiaGrossa = resultadosGranulometricos.massaAreiaGrossa * (1000 / dados.tfsa) * resultadosGranulometricos.umidade
  }
  
  // A.Fina = Areia Fina calculado de Massa das particulas*(1000/TFSA bruto)*umidade calculado
  if (resultadosGranulometricos.massaAreiaFina && dados.tfsa && resultadosGranulometricos.umidade && dados.tfsa !== 0) {
    resultadosGranulometricos.proporcaoAreiaFina = resultadosGranulometricos.massaAreiaFina * (1000 / dados.tfsa) * resultadosGranulometricos.umidade
  }
  
  // Silte = Silte calculado de Massa das particulas(correções(diluição))*(1000/TFSA bruto)*umidade calculado
  if (resultadosGranulometricos.correcaoSilte && dados.tfsa && resultadosGranulometricos.umidade && dados.tfsa !== 0) {
    resultadosGranulometricos.proporcaoSilte = resultadosGranulometricos.correcaoSilte * (1000 / dados.tfsa) * resultadosGranulometricos.umidade
  }
  
  // Argila = Argila calculado de Massa das particulas(correções(diluição))*(1000/TFSA bruto)*umidade calculado
  if (resultadosGranulometricos.correcaoArgila && dados.tfsa && resultadosGranulometricos.umidade && dados.tfsa !== 0) {
    resultadosGranulometricos.proporcaoArgila = resultadosGranulometricos.correcaoArgila * (1000 / dados.tfsa) * resultadosGranulometricos.umidade
  }

  // Precisão(%) = (Areia grossa calculada de proporção das particulas + Areia fina calculada de proporção das particulas + silte calculada de proporção das particulas + argila calculada de proporção das particulas)/10
  const somaProporcoes = (resultadosGranulometricos.proporcaoAreiaGrossa || 0) + 
                        (resultadosGranulometricos.proporcaoAreiaFina || 0) + 
                        (resultadosGranulometricos.proporcaoSilte || 0) + 
                        (resultadosGranulometricos.proporcaoArgila || 0)
  resultadosGranulometricos.precisao = somaProporcoes / 10

  // Classificação Textural
  // A.Grossa = (Areia grossa calculada de proporções das partículas/precisão da tomada de decisão)*10
  if (resultadosGranulometricos.proporcaoAreiaGrossa && resultadosGranulometricos.precisao && resultadosGranulometricos.precisao !== 0) {
    resultadosGranulometricos.classificacaoTexturalAreiaGrossa = (resultadosGranulometricos.proporcaoAreiaGrossa / resultadosGranulometricos.precisao) * 10
  }
  
  // A.Fina = (Areia fina calculada de proporções das partículas/precisão da tomada de decisão)*10
  if (resultadosGranulometricos.proporcaoAreiaFina && resultadosGranulometricos.precisao && resultadosGranulometricos.precisao !== 0) {
    resultadosGranulometricos.classificacaoTexturalAreiaFina = (resultadosGranulometricos.proporcaoAreiaFina / resultadosGranulometricos.precisao) * 10
  }
  
  // Silte = (Silte calculada de proporções das partículas/precisão da tomada de decisão)*10
  if (resultadosGranulometricos.proporcaoSilte && resultadosGranulometricos.precisao && resultadosGranulometricos.precisao !== 0) {
    resultadosGranulometricos.classificacaoTexturalSilte = (resultadosGranulometricos.proporcaoSilte / resultadosGranulometricos.precisao) * 10
  }
  
  // Argila = (Argila calculada de proporções das partículas/precisão da tomada de decisão)*10
  if (resultadosGranulometricos.proporcaoArgila && resultadosGranulometricos.precisao && resultadosGranulometricos.precisao !== 0) {
    resultadosGranulometricos.classificacaoTexturalArgila = (resultadosGranulometricos.proporcaoArgila / resultadosGranulometricos.precisao) * 10
  }

  console.log('✅ Resultados granulométricos calculados para amostra', amostraId, ':', resultadosGranulometricos)

  return resultadosGranulometricos

  } catch (error) {
    console.error('❌ Erro ao calcular resultados granulométricos:', error)
    return {}
  }
}

// Função para gerar QR Code com dados de validação do laudo
async function gerarQRCodeLaudo(lote: any, amostras: any[], cliente: any): Promise<string> {
  try {
    const dataGeracao = new Date().toISOString()
    const dadosValidacao = {
      tipo: 'laudo_analise',
      dataGeracao: dataGeracao,
      cliente: {
        nome: cliente?.nome || '',
        cpf: cliente?.cpf || ''
      },
      lote: {
        codigo: lote?.codigo || '',
        id: lote?.id || ''
      },
      amostras: {
        quantidade: amostras?.length || 0,
        codigos: amostras?.map((a: any) => a.codigo) || []
      },
      modulo: lote?.modulo || lote?.tipoAnalise || 'solo'
    }
    
    // Converter para JSON e gerar QR Code
    const jsonDados = JSON.stringify(dadosValidacao)
    const qrCodeDataURL = await QRCode.toDataURL(jsonDados, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 200,
      margin: 2
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error)
    // Retornar string vazia em caso de erro para não quebrar o laudo
    return ''
  }
}

// Função para gerar HTML do laudo (template completo)
async function gerarPDFLaudoSobrio(lote: any, amostras: any[], resultados: any[], tipoAnalise: string, cliente: any, modulo: string = 'solo') {
  try {
    // Gerar QR Code de validação
    const qrCodeBase64 = await gerarQRCodeLaudo(lote, amostras, cliente)
    const dataGeracao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // HTML do QR Code (se gerado com sucesso)
    const qrCodeHTML = qrCodeBase64 ? `
    <div class="qrcode-container">
        <div class="qrcode-title">Validação Digital</div>
        <img src="${qrCodeBase64}" alt="QR Code de Validação" class="qrcode-image">
        <div class="qrcode-info">
            <p><strong>Data de Geração:</strong> ${dataGeracao}</p>
            <p><strong>Cliente:</strong> ${cliente?.nome || 'N/A'}</p>
            <p><strong>Lote:</strong> ${lote?.codigo || 'N/A'} | <strong>Amostras:</strong> ${amostras?.length || 0}</p>
            <p style="font-size: 7px; margin-top: 5px; font-style: italic;">Este QR Code contém informações de validação do laudo. Escaneie para verificar a autenticidade do documento.</p>
        </div>
    </div>` : ''
    
    // Agrupar resultados por amostra e calcular resultados finais
    const resultadosCalculadosPorAmostra: Record<string, any> = {}
    let amostrasOrdenadas = [...amostras]
    
    if (tipoAnalise === 'granulometrica') {
      // Para granulométrica, calcular resultados granulométricos e filtrar apenas amostras com resultados
      const amostrasComResultados = []
      
      for (const amostra of amostras) {
        const calculados = await calcularResultadosGranulometricos(amostra.id)
        
        // Verificar se a amostra tem dados granulométricos válidos
        // Verificar se pelo menos uma das massas das partículas foi calculada
        const temDados = calculados.massaAreiaGrossa !== undefined ||
                        calculados.massaAreiaFina !== undefined ||
                        calculados.massaSilte !== undefined ||
                        calculados.massaArgila !== undefined
        
        console.log(`🔍 Amostra ${amostra.codigo}: temDados=${temDados}, calculados=`, Object.keys(calculados))
        
        // Incluir a amostra sempre, mesmo sem dados, para mostrar no laudo
        // Se não tiver dados, vai mostrar "-" na tabela
        resultadosCalculadosPorAmostra[amostra.id] = calculados
        amostrasComResultados.push(amostra)
      }
      
      // Ordenar apenas as amostras com resultados por código (numérico)
      amostrasOrdenadas = amostrasComResultados.sort((a, b) => {
        const codigoA = a.codigo
        const codigoB = b.codigo
        
        // Para códigos com F (foliar), extrair números
        if (/^F\d+$/.test(codigoA) && /^F\d+$/.test(codigoB)) {
          const numA = parseInt(codigoA.replace('F', ''))
          const numB = parseInt(codigoB.replace('F', ''))
          return numA - numB  // Ordem crescente para laudo
        }
        
        // Para códigos numéricos
        if (/^\d+$/.test(codigoA) && /^\d+$/.test(codigoB)) {
          return parseInt(codigoA) - parseInt(codigoB)  // Ordem crescente para laudo
        }
        
        // Para outros códigos, usar comparação de strings
        return codigoA.localeCompare(codigoB)
      })
    } else {
      // Para laudo geral, calcular resultados tradicionais
      amostrasOrdenadas = amostrasOrdenadas.sort((a, b) => {
        const codigoA = a.codigo
        const codigoB = b.codigo
        
        // Para códigos com F (foliar), extrair números
        if (/^F\d+$/.test(codigoA) && /^F\d+$/.test(codigoB)) {
          const numA = parseInt(codigoA.replace('F', ''))
          const numB = parseInt(codigoB.replace('F', ''))
          return numA - numB  // Ordem crescente para laudo
        }
        
        // Para códigos numéricos
        if (/^\d+$/.test(codigoA) && /^\d+$/.test(codigoB)) {
          return parseInt(codigoA) - parseInt(codigoB)  // Ordem crescente para laudo
        }
        
        // Para outros códigos, usar comparação de strings
        return codigoA.localeCompare(codigoB)
      })
      
      amostrasOrdenadas.forEach(amostra => {
        const resultadosAmostra = resultados.filter((r: any) => r.amostraId === amostra.id)
        
        // Debug: log dos resultados para diagnóstico
        if (modulo === 'foliar' && resultadosAmostra.length > 0) {
          console.log(`🔍 Laudo Foliar - Amostra ${amostra.codigo}: ${resultadosAmostra.length} resultados brutos encontrados`)
          console.log(`   Tipos: ${resultadosAmostra.map((r: any) => r.tipo).join(', ')}`)
          console.log(`   Resultados brutos:`, resultadosAmostra.map((r: any) => ({ tipo: r.tipo, valor: r.valor, categoria: r.categoria })))
        }
        
        // Usar calcularResultadosFoliar se módulo é foliar OU se tipoAnalise é foliar
        const usarFoliar = modulo === 'foliar' || tipoAnalise === 'foliar'
        const calculados = usarFoliar ? calcularResultadosFoliar(resultadosAmostra) : calcularResultadosFinais(resultadosAmostra)
        
        // Debug: log dos resultados calculados
        if (usarFoliar) {
          const calculadosKeys = Object.keys(calculados).filter(k => calculados[k] !== undefined && calculados[k] !== null && !Number.isNaN(calculados[k]))
          console.log(`   ✅ Resultados calculados para ${amostra.codigo}: ${calculadosKeys.length > 0 ? calculadosKeys.join(', ') : 'NENHUM'}`)
          if (calculadosKeys.length > 0) {
            const valores = calculadosKeys.reduce((acc, key) => {
              acc[key] = calculados[key]
              return acc
            }, {} as any)
            console.log(`   📊 Valores calculados:`, JSON.stringify(valores, null, 2))
          } else {
            console.log(`   ⚠️ NENHUM resultado calculado para ${amostra.codigo}!`)
            console.log(`   🔍 Resultados brutos disponíveis:`, resultadosAmostra.map((r: any) => ({ tipo: r.tipo, valor: r.valor })))
          }
        }
        
        resultadosCalculadosPorAmostra[amostra.id] = calculados
      })
    }

    
    // Gerar HTML com design original completo
    const htmlContent = `
    <!DOCTYPE html>
<html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laudo de Análise ${modulo === 'foliar' ? 'Foliar' : 'de Solo'}</title>
      <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 5px;
            background: white;
            color: #000;
            font-size: 10px;
            line-height: 1.0;
        }
        
        .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            height: 80px;
            position: relative;
            width: 100%;
            overflow: visible;
        }
        
        .header-logo {
            height: 70px;
            width: 70px;
            object-fit: contain;
            flex-shrink: 0;
            display: block;
        }
        
        .header-content {
            text-align: center;
            flex: 1;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .header-logo-left {
            position: absolute !important;
            left: 20px !important;
            top: 5px !important;
            height: 70px !important;
            width: 70px !important;
            object-fit: contain !important;
            z-index: 1000 !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        .header-logo-right {
            position: absolute !important;
            right: 20px !important;
            top: -20px !important;
            height: 120px !important;
            width: 100px !important;
            object-fit: contain !important;
            z-index: 1000 !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        
        .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 3px 0;
            color: #000;
            text-transform: uppercase;
            line-height: 1.2;
        }
        
        .header h2 {
            font-size: 12px;
            font-weight: 600;
            margin: 2px 0;
            color: #000;
            line-height: 1.1;
        }
        
        .header h3 {
            font-size: 10px;
            margin: 2px 0;
            color: #000;
            line-height: 1.1;
        }
        
        .contact {
            font-size: 10px;
            margin-top: 2px;
            margin-bottom: 8px;
            color: #000;
            font-weight: 600;
            line-height: 1.4;
        }
        
        .client-info {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
            padding: 8px 5px;
            padding-bottom: 10px;
            background-color: white;
            border-radius: 3px;
            border: 1px solid #000;
        }
        
        .client-left {
            flex: 1;
        }
        
        .client-right {
            flex: 1;
            text-align: right;
        }
        
        .client-row {
            margin: 3px 0;
            font-size: 10px;
            line-height: 1.3;
        }
        
        .client-label {
            font-weight: bold;
            color: #000;
        }
        
        .client-value {
            color: #000;
            font-weight: 600;
        }
        
        .table-container {
            margin: 8px 0;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
            font-size: 10px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        td, th {
            border: 1px solid #000;
            padding: 3px 2px;
            text-align: center;
            vertical-align: middle;
        }
        
        th {
            background-color: white;
            color: #000;
            font-weight: bold;
            font-size: 9px;
            border: 2px solid #000;
        }
        
        .table-title {
            background-color: white;
            color: #000;
            font-weight: bold;
            text-align: center;
            padding: 6px;
            margin: 12px 0 6px 0;
            border-radius: 3px;
            font-size: 11px;
            text-transform: uppercase;
            border: 2px solid #000;
        }
        
        .unit-row {
            background-color: white;
            font-size: 8px;
            font-style: italic;
            color: #000;
            border: 1px solid #000;
            text-transform: none;
        }
        
        .data-row {
            background-color: white;
        }
        
        .data-row:nth-child(even) {
            background-color: white;
        }
        
        .data-row:hover {
            background-color: #f8f9fa;
        }
        
        .methodology {
            margin: 15px 0;
            font-size: 9px;
            line-height: 1.2;
            text-align: justify;
            background-color: white;
            padding: 10px;
            border-radius: 3px;
            border: 2px solid #000;
        }
        
        .methodology h4 {
            font-size: 10px;
            font-weight: bold;
            margin: 8px 0 6px 0;
            color: #000;
            text-transform: uppercase;
        }
        
        .methodology p {
            margin: 2px 0;
        }
        
        .observations {
            margin: 12px 0;
            font-size: 9px;
            line-height: 1.2;
            background-color: white;
            padding: 8px;
            border: 2px solid #000;
            border-radius: 3px;
        }
        
        .legal-disclaimer {
            margin: 12px 0;
            font-size: 8px;
            line-height: 1.2;
            color: #000;
            text-align: justify;
            background-color: white;
            padding: 8px;
            border-radius: 3px;
            border: 1px solid #000;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #000;
            text-align: right;
            font-size: 9px;
        }
        
        .footer-images {
            position: relative;
            margin-top: 5px;
            padding: 5px 0;
            height: 60px;
        }
        
        .footer-image {
            height: 60px;
            width: auto;
            object-fit: contain;
        }
        
        .footer-selo {
            position: absolute;
            left: 0;
            bottom: 0px;
            text-align: left;
        }
        
        .footer-assinatura {
            position: absolute;
            right: 0;
            bottom: 0px;
            text-align: right;
        }
        
        .qrcode-container {
            margin-top: 20px;
            padding: 15px;
            border: 2px solid #000;
            border-radius: 5px;
            background-color: white;
            text-align: center;
        }
        
        .qrcode-title {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #000;
            text-transform: uppercase;
        }
        
        .qrcode-image {
            width: 150px;
            height: 150px;
            margin: 0 auto;
            display: block;
            border: 1px solid #000;
        }
        
        .qrcode-info {
            font-size: 8px;
            margin-top: 8px;
            color: #000;
            line-height: 1.3;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 8px;
            }
            
        }
      </style>
    </head>
    <body>
      <div class="header">
            <img src="${getLabLogoBase64()}" alt="Logo Laboratório" class="header-logo header-logo-left">
            <div class="header-content">
                <h1>LABORATÓRIO DE ANÁLISES DE SOLOS E PLANTAS</h1>
                <h2>UNIVERSIDADE FEDERAL DO ESPÍRITO SANTO</h2>
                <h2>CENTRO DE CIÊNCIAS AGRÁRIAS E ENGENHARIAS</h2>
                <h2>DEPARTAMENTO DE AGRONOMIA</h2>
                <div class="contact">Alto universitário, Caixa Postal 16, Tel: (28) 98805-6596</div>
      </div>
            <img src="${getUfesLogoBase64()}" alt="Logo UFES" class="header-logo header-logo-right">
      </div>

    <div class="client-info">
        <div class="client-left">
            <div class="client-row"><span class="client-label">Proprietário:</span> <span class="client-value">${cliente?.nome || 'N/A'}</span></div>
            <div class="client-row"><span class="client-label">Propriedade:</span> <span class="client-value">${amostrasOrdenadas[0]?.propriedade || 'Não informado'}</span></div>
            <div class="client-row"><span class="client-label">Solicitante:</span> <span class="client-value">${amostrasOrdenadas[0]?.solicitante || 'Não informado'}</span></div>
        </div>
        <div class="client-right">
            <div class="client-row"><span class="client-label">Entrada:</span> <span class="client-value">${lote.dataEntrega ? new Date(lote.dataEntrega).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span></div>
            <div class="client-row"><span class="client-label">Local:</span> <span class="client-value">${cliente?.cidade || 'N/A'} - ${cliente?.estado || 'N/A'}</span></div>
        </div>
      </div>

    ${tipoAnalise === 'granulometrica' ? `
    <div class="table-title">ANÁLISE GRANULOMÉTRICA - CLASSIFICAÇÃO TEXTURAL</div>
    <div class="table-container">
        <table>
          <thead>
            <tr>
                    <th>REF.</th>
                    <th>Referência do cliente</th>
                    <th>Areia Grossa</th>
                    <th>Areia Fina</th>
                    <th>Silte</th>
                    <th>Argila</th>
                    <th>Classificação Textural</th>
                </tr>
                <tr class="unit-row">
                    <th>LAB</th>
                    <th></th>
                    <th colspan="4">%</th>
                    <th></th>
            </tr>
          </thead>
          <tbody>
                ${amostrasOrdenadas.map((amostra) => {
                  const dadosCalculados = resultadosCalculadosPorAmostra[amostra.id] || {}
                  
                  // Calcular classificação textural (mesma lógica do frontend)
                  let classificacaoTextural = '-'
                  if (dadosCalculados.classificacaoTexturalAreiaGrossa !== undefined) {
                    const argila = dadosCalculados.classificacaoTexturalArgila || 0
                    const areiaGrossa = dadosCalculados.classificacaoTexturalAreiaGrossa || 0
                    const areiaFina = dadosCalculados.classificacaoTexturalAreiaFina || 0
                    const somaAreias = areiaGrossa + areiaFina
                    
                    if (argila > 35 && argila < 60) {
                      classificacaoTextural = "Argilosa"
                    } else if (argila > 60) {
                      classificacaoTextural = "Muito Argilosa"
                    } else if (argila < 35 && somaAreias < 15) {
                      classificacaoTextural = "Siltosa"
                    } else if (argila < 15 && somaAreias > 70) {
                      classificacaoTextural = "Arenosa"
                    } else if (argila < 35 && somaAreias > 15) {
                      classificacaoTextural = "Textura média"
                    } else {
                      classificacaoTextural = "-"
                    }
                  } else {
                    classificacaoTextural = "-"
                  }
                  
                  // Verificar se há dados calculados
                  const temDados = dadosCalculados.massaAreiaGrossa !== undefined ||
                                  dadosCalculados.massaAreiaFina !== undefined ||
                                  dadosCalculados.massaSilte !== undefined ||
                                  dadosCalculados.massaArgila !== undefined
                  
                  console.log(`📊 Amostra ${amostra.codigo} - temDados=${temDados}, dados=${JSON.stringify(dadosCalculados)}`)
                  
                  return `
                <tr class="data-row">
                    <td>${amostra.codigo}</td>
                    <td>${amostra.identificacao}</td>
                    <td>${dadosCalculados.classificacaoTexturalAreiaGrossa !== undefined ? dadosCalculados.classificacaoTexturalAreiaGrossa.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.classificacaoTexturalAreiaFina !== undefined ? dadosCalculados.classificacaoTexturalAreiaFina.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.classificacaoTexturalSilte !== undefined ? dadosCalculados.classificacaoTexturalSilte.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.classificacaoTexturalArgila !== undefined ? dadosCalculados.classificacaoTexturalArgila.toFixed(2) : '-'}</td>
                    <td>${classificacaoTextural}</td>
                </tr>
                `
                }).join('')}
          </tbody>
        </table>
      </div>
    ` : modulo === 'foliar' ? `
    <div class="table-title">ANÁLISE FOLIAR</div>
    <div class="table-container">
        <table>
          <thead>
            <tr>
                    <th>REF.</th>
                    <th>N g.Kg⁻¹</th>
                    <th>P g/Kg</th>
                    <th>K g/Kg</th>
                    <th>Ca g/Kg</th>
                    <th>Mg g/Kg</th>
                    <th>S g/Kg</th>
                    <th>Fe mg/Kg</th>
                    <th>Cu mg/Kg</th>
                    <th>Zn mg/Kg</th>
                    <th>Mn mg/Kg</th>
                    <th>B mg/Kg</th>
            </tr>
          </thead>
          <tbody>
                ${amostrasOrdenadas.map((amostra) => {
                  const dadosCalculados = resultadosCalculadosPorAmostra[amostra.id] || {}
                  return `
                <tr class="data-row">
                    <td>${amostra.codigo}</td>
                    <td>${dadosCalculados.n ? dadosCalculados.n.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.p ? dadosCalculados.p.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.k ? dadosCalculados.k.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.ca ? dadosCalculados.ca.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.mg ? dadosCalculados.mg.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.s ? dadosCalculados.s.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.fe ? dadosCalculados.fe.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.cu ? dadosCalculados.cu.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.zn ? dadosCalculados.zn.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.mn ? dadosCalculados.mn.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.b ? dadosCalculados.b.toFixed(2) : '-'}</td>
                </tr>
                `
                }).join('')}
            </tbody>
        </table>
    </div>
    ` : `
    <div class="table-title">ROTINA</div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>REF.</th>
                    <th>Referência do cliente</th>
                    <th>pH</th>
                    <th>P</th>
                    <th>Na</th>
                    <th>K</th>
                    <th>Ca</th>
                    <th>Mg</th>
                    <th>Al</th>
                    <th>H + Al</th>
        </tr>
                <tr class="unit-row">
                    <th>LAB</th>
                    <th></th>
                    <th>H₂O</th>
                    <th colspan="3">mg/dm³</th>
                    <th colspan="4">cmolc/dm³</th>
                </tr>
            </thead>
            <tbody>
                ${amostrasOrdenadas.map((amostra) => {
                  const dadosCalculados = resultadosCalculadosPorAmostra[amostra.id] || {}
                  return `
                <tr class="data-row">
                    <td>${amostra.codigo}</td>
                    <td>${amostra.identificacao}</td>
                    <td>${dadosCalculados.ph ? dadosCalculados.ph.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.p ? dadosCalculados.p.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.na ? dadosCalculados.na.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.k ? dadosCalculados.k.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.ca ? dadosCalculados.ca.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.mg ? dadosCalculados.mg.toFixed(2) : '-'}</td>
                    <td>${formatarValor(dadosCalculados.al)}</td>
                    <td>${dadosCalculados.h_al ? dadosCalculados.h_al.toFixed(2) : '-'}</td>
                </tr>
                `
                }).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="table-title">DADOS GERAIS</div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>REF.</th>
                    <th>SB</th>
                    <th>t</th>
                    <th>CTC7,0</th>
                    <th>V</th>
                    <th>m</th>
                    <th>Fe</th>
                    <th>Cu</th>
                    <th>Zn</th>
                    <th>Mn</th>
                    <th>B</th>
                    <th>S</th>
                    <th>M.O.</th>
                    <th>P rem</th>
                </tr>
                <tr class="unit-row">
                    <th>LAB</th>
                    <th colspan="3">cmol/dm³</th>
                    <th colspan="2">%</th>
                    <th colspan="6">mg/dm³</th>
                    <th>g/Kg</th>
                    <th>mg/L</th>
                </tr>
            </thead>
            <tbody>
                ${amostrasOrdenadas.map((amostra) => {
                  const dadosCalculados = resultadosCalculadosPorAmostra[amostra.id] || {}
                  return `
                <tr class="data-row">
                    <td>${amostra.codigo}</td>
                    <td>${dadosCalculados.sb ? dadosCalculados.sb.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.t ? dadosCalculados.t.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.ctc ? dadosCalculados.ctc.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.v ? dadosCalculados.v.toFixed(2) : '-'}</td>
                    <td>${formatarValor(dadosCalculados.m)}</td>
                    <td>${dadosCalculados.fe ? dadosCalculados.fe.toFixed(4) : '-'}</td>
                    <td>${dadosCalculados.cu ? dadosCalculados.cu.toFixed(4) : '-'}</td>
                    <td>${dadosCalculados.zn ? dadosCalculados.zn.toFixed(4) : '-'}</td>
                    <td>${dadosCalculados.mn ? dadosCalculados.mn.toFixed(4) : '-'}</td>
                    <td>${dadosCalculados.b ? dadosCalculados.b.toFixed(4) : '-'}</td>
                    <td>${dadosCalculados.s ? dadosCalculados.s.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.mo ? dadosCalculados.mo.toFixed(2) : '-'}</td>
                    <td>${dadosCalculados.prem ? dadosCalculados.prem.toFixed(2) : '-'}</td>
                </tr>
                `
                }).join('')}
          </tbody>
        </table>
      </div>
    `}
    
    <div class="methodology">
        <h4>METODOLOGIA</h4>
        ${tipoAnalise === 'granulometrica' ? `
        <p><strong>Método utilizado:</strong> Agitação lenta a 50 rpm por 16 horas, com agitador tipo Wagner; dispersante químico: NaOH 0,1 mol/L e determinação das frações silte e argila pelo método da pipeta.</p>
        ` : modulo === 'foliar' ? `
        <p><strong>N:</strong> Digestão sulfúrica, destilação e determinação por titulometria | <strong>B:</strong> Calcinação e determinação por colorimetria | <strong>K:</strong> Digestão nitro-perclórica e determinação por fotometria de chama | <strong>P e S:</strong> Digestão nitro-perclórica e determinação por colorimetria | <strong>Ca, Mg, Fe, Cu, Zn e Mn:</strong> Digestão nitro-perclórica e determinação por absorção atômica.</p>
        ` : `
        <p><strong>pH:</strong> relação solo-água 1:2,5 | <strong>P:</strong> extrator Mehlich 1 e determinação por colorimetria | <strong>Na e K:</strong> extrator Mehlich-1 e determinação por fotometria de chama | <strong>Ca e Mg:</strong> extrator KCl 1 mol/L e determinação por espectrometria de absorção atómica | <strong>Al:</strong> extrator KCl 1 mol/L e determinação por titulometria | <strong>H+Al:</strong> extrator Acetato de Cálcio 0,5 mol/L pH 7,0 e determinação por titulometria | <strong>SB:</strong> Soma de bases trocáveis | <strong>t:</strong> capacidade de troca catiónica efetiva | <strong>CTC7,0 (T):</strong> capacidade de troca catiónica a pH 7,0 | <strong>V:</strong> Índice de saturação de bases | <strong>m:</strong> Índice de saturação por alumínio | <strong>Fe, Cu, Zn e Mn:</strong> extrator Mehlich-1 e determinação por espectrometria de absorção atómica | <strong>B:</strong> extração por água quente e determinação por colorimetria | <strong>Matéria Orgânica:</strong> oxidação de carbono via úmida com dicromato de potássio em meio ácido (H2SO4) | <strong>P rem (fósforo remanescente):</strong> solução de CaCl2 0,01 mol/L contendo 60 mg/L de P</p>
        `}
        </div>

    <div class="observations">
        <strong>Obs:</strong> As amostras ficarão armazenadas por um período de dois meses antes de serem descartadas.
        </div>

    <div class="legal-disclaimer">
        <p>De acordo com o Código Penal, art. 297 a falsificação ou alteração, no todo ou em parte, de documento público, acarreta multa e pena com reclusão de dois a seis anos.</p>
        </div>

    ${qrCodeHTML}
    
    <div class="footer-images">
        <div class="footer-selo">
            <img src="${getSeloBase64()}" alt="Selo" class="footer-image">
        </div>
        <div class="footer-assinatura">
            <img src="${getAssinaturaBase64()}" alt="Assinatura" class="footer-image">
        </div>
      </div>
    </body>
</html>`
    
    return htmlContent
    
  } catch (error) {
    console.error('Erro ao gerar HTML sóbrio:', error)
    throw error
  }
}

// POST /api/laudos/gerar-lote - Gerar laudos em lote
// Esta rota DEVE vir antes de /gerar para evitar conflito de roteamento
router.post('/gerar-lote', async (req, res): Promise<any> => {
  try {
    const { loteIds, tipoAnalise } = req.body

    if (!loteIds || !Array.isArray(loteIds) || loteIds.length === 0) {
      return res.status(400).json({ error: 'Lista de lotes inválida' })
    }

    const resultados = []
    let sucessos = 0
    let falhas = 0

    for (const loteId of loteIds) {
      try {
        // Gerar HTML para cada lote
    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(loteId)
    const loteResult = await query(loteQuery, loteParams)
    const lote = loteResult.rows[0]

    if (!lote) {
          resultados.push({ loteId, success: false, error: 'Lote não encontrado' })
          falhas++
          continue
    }

    let cliente
    if (lote.cliente) {
      cliente = lote.cliente
    } else {
      const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId)
      const clienteResult = await query(clienteQuery, clienteParams)
      cliente = clienteResult.rows[0]
    }

    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(loteId)
    const amostrasResult = await query(amostrasQuery, amostrasParams)
    const amostras = amostrasResult.rows

    if (amostras.length === 0) {
          resultados.push({ loteId, success: false, error: 'Lote não possui amostras' })
          falhas++
          continue
    }

    const amostraIds = amostras.map((a: any) => a.id)
        const resultadosArray: any[] = []
    for (const amostraId of amostraIds) {
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraId)
      const resultadosResult = await query(resultadosQuery, resultadosParams)
          resultadosArray.push(...resultadosResult.rows)
        }

        // Detectar módulo corretamente (foliar ou solo)
        const moduloDetectado = lote.modulo || lote.tipoAnalise || (amostras[0]?.modulo || amostras[0]?.tipoAnalise) || 'solo'
        
        const htmlContent = await gerarPDFLaudoSobrio(lote, amostras, resultadosArray, tipoAnalise || 'geral', cliente, moduloDetectado)

        resultados.push({
          loteId,
          success: true,
          html: htmlContent
        })
        sucessos++
      } catch (error) {
        console.error(`Erro ao gerar laudo para lote ${loteId}:`, error)
        resultados.push({
          loteId,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
        falhas++
      }
    }

    res.json({
      success: true,
      resultados,
      sucessos,
      falhas
    })
  } catch (error) {
    console.error('Erro ao gerar laudos em lote:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// POST /api/laudos/gerar - Gerar laudo
router.post('/gerar', async (req: any, res): Promise<any> => {
  try {
    const { loteId, tipoAnalise } = gerarLaudoSchema.parse(req.body)

    // Buscar dados do lote
    const { query: loteQuery, params: loteParams } = SQL_QUERIES.lotes.findById(loteId)
    const loteResult = await query(loteQuery, loteParams)
    const lote = loteResult.rows[0]

    if (!lote) {
      return res.status(404).json({ error: 'Lote não encontrado' })
    }

    // Se o usuário é um cliente, verificar se o lote pertence a ele
    if (req.user?.role === 'cliente') {
      const clienteId = req.user?.clienteId
      if (!clienteId || lote.clienteId !== clienteId) {
        return res.status(403).json({ error: 'Você não tem permissão para gerar laudo deste lote' })
      }
    }

    // Buscar dados do cliente (já vem aninhado no lote, mas podemos buscar caso não venha)
    let cliente
    if (lote.cliente) {
      cliente = lote.cliente
    } else {
      const { query: clienteQuery, params: clienteParams } = SQL_QUERIES.clientes.findById(lote.clienteId)
      const clienteResult = await query(clienteQuery, clienteParams)
      cliente = clienteResult.rows[0]
    }

    // Buscar amostras do lote
    const { query: amostrasQuery, params: amostrasParams } = SQL_QUERIES.amostras.findByLote(loteId)
    const amostrasResult = await query(amostrasQuery, amostrasParams)
    const amostras = amostrasResult.rows

    if (amostras.length === 0) {
      return res.status(400).json({ error: 'Lote não possui amostras' })
    }

    // Buscar resultados para cada amostra
    const amostraIds = amostras.map((a: any) => a.id)
    const resultados: any[] = []
    for (const amostraId of amostraIds) {
      const { query: resultadosQuery, params: resultadosParams } = SQL_QUERIES.resultados.findByAmostra(amostraId)
      const resultadosResult = await query(resultadosQuery, resultadosParams)
      resultados.push(...resultadosResult.rows)
    }

    // Detectar módulo corretamente (foliar ou solo)
    // Se tipoAnalise é 'foliar', forçar módulo foliar
    let moduloDetectado = lote.modulo || lote.tipoAnalise || (amostras[0]?.modulo || amostras[0]?.tipoAnalise) || 'solo'
    
    // Se tipoAnalise é 'foliar', garantir que o módulo seja foliar
    if (tipoAnalise === 'foliar') {
      moduloDetectado = 'foliar'
    }
    
    // Log para debug
    console.log(`📋 Gerando laudo - Lote: ${lote.codigo}, Módulo detectado: ${moduloDetectado}, Tipo análise: ${tipoAnalise}, Total resultados: ${resultados.length}`)
    
    // Gerar HTML do laudo
    const htmlContent = await gerarPDFLaudoSobrio(lote, amostras, resultados, tipoAnalise, cliente, moduloDetectado)
    
    // Retornar HTML para o frontend gerar o PDF
    // O PDF será gerado no frontend usando jsPDF ou html2canvas
    res.json({
      success: true,
      html: htmlContent,
      tipo: 'html',
      lote: {
        clienteNome: cliente?.nome || '',
        codigo: amostras[0]?.codigo || '',
        modulo: lote.modulo
      },
      tipoAnalise
    })
    return
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors
      })
    }
    
    console.error('Erro ao gerar laudo:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/laudos/:arquivo - Servir arquivo de laudo
router.get('/:arquivo', (req, res) => {
  try {
    const { arquivo } = req.params
    const caminhoArquivo = path.join(pastaLaudos, arquivo)

    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' })
    }

    return res.download(caminhoArquivo)
  } catch (error) {
    console.error('Erro ao servir arquivo:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// GET /api/laudos - Listar arquivos de laudo
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(pastaLaudos)) {
      fs.mkdirSync(pastaLaudos, { recursive: true })
    }

    const arquivos = fs.readdirSync(pastaLaudos)
      .filter(arquivo => arquivo.endsWith('.pdf'))
      .map(arquivo => {
        const caminhoCompleto = path.join(pastaLaudos, arquivo)
        const stats = fs.statSync(caminhoCompleto)
        return {
          nome: arquivo,
          tamanho: stats.size,
          dataCriacao: stats.birthtime,
          dataModificacao: stats.mtime,
          url: `/api/laudos/${arquivo}`
        }
      })
      .sort((a, b) => b.dataModificacao.getTime() - a.dataModificacao.getTime())

    res.json({
      arquivos,
      total: arquivos.length
    })
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router