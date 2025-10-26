import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, FileText } from 'lucide-react'

interface FoliarFormProps {
  amostraId: string
  onSave: (data: any) => void
  onGenerateReport: () => void
}

const foliarSchema = z.object({
  // Fator N
  fatorF: z.number().min(0),
  curvaSA: z.number(),
  curvaSB: z.number(),
  vBranco: z.number().min(0),
  
  // Curva P
  curvaPA: z.number(),
  curvaPB: z.number(),
  curvaBA: z.number(),
  curvaBB: z.number(),
  
  // Determinação de F
  massaTris: z.number().min(0),
  vTitulado: z.number().min(0),
  
  // Macronutrientes
  massaN: z.number().min(0),
  volTit: z.number().min(0),
  massaGeral: z.number().min(0),
  pAbs: z.number().min(0),
  diluicaoP: z.number().min(1),
  kMgL: z.number().min(0),
  diluicaoK: z.number().min(1),
  caMgL: z.number().min(0),
  diluicaoCa: z.number().min(1),
  mgMgL: z.number().min(0),
  diluicaoMg: z.number().min(1),
  sAbs: z.number().min(0),
  diluicaoS: z.number().min(1),
  brancoS: z.number().min(0),
  
  // Micronutrientes
  feMgL: z.number().min(0),
  diluicaoFe: z.number().min(1),
  cuMgL: z.number().min(0),
  diluicaoCu: z.number().min(1),
  znMgL: z.number().min(0),
  diluicaoZn: z.number().min(1),
  mnMgL: z.number().min(0),
  diluicaoMn: z.number().min(1),
  massaB: z.number().min(0),
  bTrans: z.number().min(0),
  diluicaoB: z.number().min(1),
  brancoB: z.number().min(0),
})

type FoliarFormData = z.infer<typeof foliarSchema>

export function FoliarForm({ amostraId, onSave, onGenerateReport }: FoliarFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<FoliarFormData>({
    resolver: zodResolver(foliarSchema),
    defaultValues: {
      fatorF: 0.9988,
      curvaSA: 0.0267,
      curvaSB: -0.0064,
      vBranco: 0.05,
      curvaPA: 0.5007,
      curvaPB: 0.0005,
      curvaBA: 0.4487,
      curvaBB: 0.0094,
      massaTris: 0.1212,
      vTitulado: 9.95,
      massaN: 0,
      volTit: 0,
      massaGeral: 0,
      pAbs: 0,
      diluicaoP: 4,
      kMgL: 0,
      diluicaoK: 1,
      caMgL: 0,
      diluicaoCa: 1,
      mgMgL: 0,
      diluicaoMg: 1,
      sAbs: 0,
      diluicaoS: 2,
      brancoS: 0,
      feMgL: 0,
      diluicaoFe: 1,
      cuMgL: 0,
      diluicaoCu: 1,
      znMgL: 0,
      diluicaoZn: 1,
      mnMgL: 0,
      diluicaoMn: 1,
      massaB: 0,
      bTrans: 0,
      diluicaoB: 1,
      brancoB: 0,
    }
  })

  const [calculations, setCalculations] = useState({
    n: 0,
    p: 0,
    k: 0,
    ca: 0,
    mg: 0,
    s: 0,
    fe: 0,
    cu: 0,
    zn: 0,
    mn: 0,
    b: 0,
  })

  const calculateResults = () => {
    const formData = watch()
    
    // N = (Vol. Tit. * Fator F * 14.007) / Massa Geral
    const n = (formData.volTit * formData.fatorF * 14.007) / formData.massaGeral
    
    // P = ((P Abs - Curva P B) / Curva P A) * Diluição P
    const p = ((formData.pAbs - formData.curvaPB) / formData.curvaPA) * formData.diluicaoP
    
    // K = K (mg/L) * Diluição K
    const k = formData.kMgL * formData.diluicaoK
    
    // Ca = Ca (mg/L) * Diluição Ca
    const ca = formData.caMgL * formData.diluicaoCa
    
    // Mg = Mg (mg/L) * Diluição Mg
    const mg = formData.mgMgL * formData.diluicaoMg
    
    // S = ((S Abs - Branco S) * Curva S A + Curva S B) * Diluição S
    const s = ((formData.sAbs - formData.brancoS) * formData.curvaSA + formData.curvaSB) * formData.diluicaoS
    
    // Fe = Fe (mg/L) * Diluição Fe
    const fe = formData.feMgL * formData.diluicaoFe
    
    // Cu = Cu (mg/L) * Diluição Cu
    const cu = formData.cuMgL * formData.diluicaoCu
    
    // Zn = Zn (mg/L) * Diluição Zn
    const zn = formData.znMgL * formData.diluicaoZn
    
    // Mn = Mn (mg/L) * Diluição Mn
    const mn = formData.mnMgL * formData.diluicaoMn
    
    // B = ((B Trans - Branco B) * Curva B A + Curva B B) * Diluição B
    const b = ((formData.bTrans - formData.brancoB) * formData.curvaBA + formData.curvaBB) * formData.diluicaoB
    
    setCalculations({
      n,
      p,
      k,
      ca,
      mg,
      s,
      fe,
      cu,
      zn,
      mn,
      b,
    })
  }

  const onSubmit = (data: FoliarFormData) => {
    const resultData = {
      ...data,
      ...calculations,
      amostraId,
      categoria: 'foliar' as const,
    }
    onSave(resultData)
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Análise Foliar</h3>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Parâmetros de Cálculo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Fator N */}
              <div className="card bg-green-50">
                <div className="card-header">
                  <h4 className="text-lg font-semibold text-green-800">Fator N</h4>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fator F
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('fatorF', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('fatorF', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva S A
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaSA', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaSA', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        V Branco (mL)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-resultado"
                        {...register('vBranco', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('vBranco', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva S B
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaSB', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaSB', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Curva P */}
              <div className="card bg-green-50">
                <div className="card-header">
                  <h4 className="text-lg font-semibold text-green-800">Curva P</h4>
                </div>
                <div className="card-content">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva P A
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaPA', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaPA', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva P B
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaPB', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaPB', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva B A
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaBA', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaBA', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Curva B B
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('curvaBB', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('curvaBB', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Determinação de F */}
              <div className="card bg-yellow-50">
                <div className="card-header">
                  <h4 className="text-lg font-semibold text-yellow-800">Determinação de F</h4>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Massa TRIS (g)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        className="input-resultado"
                        {...register('massaTris', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('massaTris', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        V titulado (mL)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-resultado"
                        {...register('vTitulado', { valueAsNumber: true })}
                        onChange={(e) => {
                          setValue('vTitulado', parseFloat(e.target.value) || 0)
                          calculateResults()
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MACRONUTRIENTES */}
            <div className="card">
              <div className="card-header">
                <h4 className="text-lg font-semibold text-gray-800">MACRONUTRIENTES</h4>
              </div>
              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Massa N (g)</th>
                        <th>Vol. Tit.</th>
                        <th>Massa Geral (g)</th>
                        <th>P (Abs.)</th>
                        <th>Diluição P</th>
                        <th>K (mg/L)</th>
                        <th>Diluição K</th>
                        <th>Ca (mg/L)</th>
                        <th>Diluição Ca</th>
                        <th>Mg (mg/L)</th>
                        <th>Diluição Mg</th>
                        <th>S (Abs.)</th>
                        <th>Dil. S</th>
                        <th>Branco S</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="input-resultado"
                            {...register('massaN', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('massaN', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-resultado"
                            {...register('volTit', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('volTit', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="input-resultado"
                            {...register('massaGeral', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('massaGeral', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="input-resultado"
                            {...register('pAbs', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('pAbs', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoP', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoP', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-resultado"
                            {...register('kMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('kMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoK', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoK', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('caMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('caMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoCa', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoCa', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('mgMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('mgMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoMg', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoMg', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="input-resultado"
                            {...register('sAbs', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('sAbs', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoS', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoS', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.001"
                            className="input-resultado"
                            {...register('brancoS', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('brancoS', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* MICRONUTRIENTES */}
            <div className="card">
              <div className="card-header">
                <h4 className="text-lg font-semibold text-gray-800">MICRONUTRIENTES</h4>
                <p className="text-sm text-gray-600">Ferro, Cobre, Zinco, Manganês e Boro</p>
              </div>
              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Fe (mg/L)</th>
                        <th>Diluição Fe</th>
                        <th>Cu (mg/L)</th>
                        <th>Diluição Cu</th>
                        <th>Zn (mg/L)</th>
                        <th>Diluição Zn</th>
                        <th>Mn (mg/L)</th>
                        <th>Diluição Mn</th>
                        <th>Massa B</th>
                        <th>B (Trans.)</th>
                        <th>Dil. B</th>
                        <th>Branco B</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('feMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('feMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoFe', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoFe', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('cuMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('cuMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoCu', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoCu', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('znMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('znMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoZn', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoZn', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('mnMgL', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('mnMgL', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoMn', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoMn', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.0001"
                            className="input-resultado"
                            {...register('massaB', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('massaB', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-resultado"
                            {...register('bTrans', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('bTrans', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="input-resultado"
                            {...register('diluicaoB', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('diluicaoB', parseFloat(e.target.value) || 1)
                              calculateResults()
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="input-resultado"
                            {...register('brancoB', { valueAsNumber: true })}
                            onChange={(e) => {
                              setValue('brancoB', parseFloat(e.target.value) || 0)
                              calculateResults()
                            }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RESULTADOS FINAIS */}
            <div className="card">
              <div className="card-header">
                <h4 className="text-lg font-semibold text-gray-800">Resultados Finais</h4>
              </div>
              <div className="card-content">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>N (g.Kg⁻¹)</th>
                        <th>P (g/Kg)</th>
                        <th>K (g/Kg)</th>
                        <th>Ca (g/Kg)</th>
                        <th>Mg (g/Kg)</th>
                        <th>S (g/Kg)</th>
                        <th>Fe (mg/Kg)</th>
                        <th>Cu (mg/Kg)</th>
                        <th>Zn (mg/Kg)</th>
                        <th>Mn (mg/Kg)</th>
                        <th>B (mg/Kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-center font-semibold">{calculations.n.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.p.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.k.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.ca.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.mg.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.s.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.fe.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.cu.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.zn.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.mn.toFixed(2)}</td>
                        <td className="text-center font-semibold">{calculations.b.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onGenerateReport}
                className="btn btn-outline flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Laudo
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

