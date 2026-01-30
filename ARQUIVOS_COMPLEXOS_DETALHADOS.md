# 🔬 Arquivos Complexos - Explicação Detalhada

Este documento explica em profundidade os arquivos mais complexos do sistema.

---

## 📄 1. `frontend/src/pages/LancamentoResultados.tsx` (2400+ linhas)

### Visão Geral

**O que faz:** Permite lançar resultados laboratoriais de múltiplas amostras de uma vez (lançamento em lote).

**Por que é complexo?**
- Gerencia dezenas de estados diferentes (um para cada tipo de campo)
- Suporta dois módulos diferentes (Solo e Foliar) com campos distintos
- Tem lógica de filtragem, validação e transformação de dados
- Precisa lidar com valores existentes (edição) e novos (criação)

### Estrutura de Estados

**Estados por Amostra (Record<string, string>):**
```typescript
const [valorResultado, setValorResultado] = useState<Record<string, string>>({})
// Exemplo: { "amostra-id-1": "15.5", "amostra-id-2": "16.2" }
```

**Por que Record?**
- Cada amostra tem seu próprio valor
- Chave = ID da amostra, Valor = valor digitado
- Permite atualizar valor de uma amostra sem afetar outras

**Estados Globais (string):**
```typescript
const [brancoLote, setBrancoLote] = useState('')
// Valor único aplicado a TODAS as amostras selecionadas
```

**Por que estados globais?**
- Alguns valores são iguais para todas as amostras (ex: branco, diluição padrão)
- Usuário preenche uma vez, aplica para todas
- Melhor UX (não precisa preencher 100 vezes o mesmo valor)

### Fluxo de Uso

**1. Usuário seleciona tipo de resultado:**
```typescript
const [tipoResultado, setTipoResultado] = useState('')
// Exemplo: 'pH', 'P', 'K', 'MO', etc.
```

**2. Sistema filtra amostras relevantes:**
```typescript
const amostrasRelevantes = amostras.filter(amostra => {
  return amostraSolicitaAnalise(amostra, tipoResultado)
})

// Exemplo: Se tipoResultado = 'pH' e amostra.rotina = true
// → amostra é relevante
```

**3. Usuário preenche valores:**
- Pode preencher individualmente (um por amostra)
- Pode preencher globalmente (aplica para todas)

**4. Ao salvar, transforma em array:**
```typescript
const resultados = amostrasRelevantes.map(amostra => ({
  amostraId: amostra.id,
  tipo: tipoResultado,
  valor: valorResultado[amostra.id] || '',
  diluicao: diluicaoResultado[amostra.id] || diluicaoPadrao,
  branco: brancoResultado[amostra.id] || brancoLote,
  // ... outros campos
}))
```

**5. Envia para backend:**
```typescript
await createResultados.mutateAsync({
  resultados: resultados,
  modulo: tipoAnalise
})
```

### Função `amostraSolicitaAnalise`

**O que faz:** Verifica se uma amostra solicita determinado tipo de análise.

**Lógica:**
```typescript
function amostraSolicitaAnalise(amostra: any, tipo: string): boolean {
  // pH está em "rotina"
  if (tipo === 'pH' && amostra.rotina) return true
  
  // P, K, Ca, Mg estão em "rotina"
  if (['P', 'K', 'Ca', 'Mg'].includes(tipo) && amostra.rotina) return true
  
  // Fe, Zn, Cu, Mn estão em "micronutrientes"
  if (['Fe', 'Zn', 'Cu', 'Mn'].includes(tipo) && amostra.micronutrientes) return true
  
  // MO está em "organica"
  if (tipo === 'MO' && amostra.organica) return true
  
  // ... etc
}
```

**Por que essa função?**
- Amostras podem solicitar diferentes tipos de análise
- Exemplo: Amostra A solicita Rotina + Micronutrientes
- Amostra B solicita só Rotina
- Ao selecionar "Fe" (micronutriente), só mostra Amostra A

### Função `verificarSeJaFoiLancado`

**O que faz:** Verifica se resultados de um tipo já foram lançados para todas as amostras relevantes.

**Lógica:**
```typescript
function verificarSeJaFoiLancado(tipo: string): boolean {
  // 1. Filtra amostras que solicitam esse tipo
  const amostrasRelevantes = amostras.filter(a => 
    amostraSolicitaAnalise(a, tipo)
  )
  
  // 2. Verifica se TODAS têm resultado desse tipo
  const todasTemResultado = amostrasRelevantes.every(amostra => {
    return amostra.resultados?.some(r => r.tipo === tipo)
  })
  
  return todasTemResultado
}
```

**Uso visual:**
- Se `verificarSeJaFoiLancado('pH')` retorna `true`
- Mostra bolinha laranja ao lado de "pH" no filtro
- Indica que pH já foi lançado para todas as amostras

**Por que verificar TODAS?**
- Se 10 amostras solicitam pH, mas só 9 têm resultado
- Não mostra bolinha (ainda falta 1)
- Só mostra quando 100% completo

### Campos Granulométricos

**Por que são especiais?**
- Têm muitos campos (12+ campos por amostra)
- Cálculos complexos (percentuais, classificação textural)
- Validações específicas (ex: soma de percentuais deve ser 100%)

**Estrutura:**
```typescript
// Massas dos recipientes (primeira etapa)
massaRecipienteAreiaGrossa
massaRecipienteAreiaFina
massaRecipienteSilteArgila
massaRecipienteArgila

// Massas com partículas (segunda etapa)
massaRecipientePartAreiaGrossa
massaRecipientePartAreiaFina
// ... etc

// Fatores e massas de lata
tfsa
massaLata
massaLataSu
massaLataSs
```

**Fluxo de preenchimento:**
1. Usuário preenche massas dos recipientes
2. Sistema calcula massas das frações (massa com partícula - massa recipiente)
3. Sistema calcula percentuais
4. Sistema classifica textura (arenoso, argiloso, etc.)

---

## 🧮 2. `backend/src/utils/calculosResultados.ts`

### Visão Geral

**O que faz:** Calcula valores derivados (SB, CTC, V, m) baseado em valores brutos lançados.

### Fórmulas Implementadas

**1. SB (Soma de Bases)**
```typescript
SB = Ca + Mg + K + Na
```
- **O que é:** Soma de todos os cátions trocáveis
- **Unidade:** cmol/dm³
- **Significado:** Quantidade total de bases trocáveis no solo

**2. t (CTC Efetiva)**
```typescript
t = SB + Al
```
- **O que é:** Capacidade de troca catiónica efetiva
- **Inclui:** Bases + Alumínio trocável
- **Significado:** Capacidade real de troca do solo

**3. T (CTC Total)**
```typescript
T = SB + (H+Al)
```
- **O que é:** Capacidade de troca catiónica a pH 7.0
- **Inclui:** Bases + Acidez potencial
- **Significado:** Capacidade máxima de troca do solo

**4. V% (Saturação de Bases)**
```typescript
V = (SB / T) * 100
```
- **O que é:** Percentual de saturação por bases
- **Range:** 0-100%
- **Significado:** 
  - V < 50%: Solo ácido, precisa calagem
  - V > 50%: Solo com boa fertilidade

**5. m% (Saturação de Alumínio)**
```typescript
m = (Al / t) * 100
```
- **O que é:** Percentual de saturação por alumínio
- **Range:** 0-100%
- **Significado:**
  - m > 50%: Solo tóxico, plantas não crescem bem
  - m < 20%: Solo adequado para cultivo

### Por que Essas Fórmulas?

- **Padrão Embrapa:** Fórmulas reconhecidas cientificamente
- **Interpretação:** Valores derivados são mais úteis que valores brutos
- **Recomendações:** Base para recomendar calagem, adubação, etc.

### Quando Calcula?

**1. Ao salvar resultado:**
```typescript
// Usuário salva Ca = 2.5, Mg = 1.0, K = 0.5
// Sistema calcula automaticamente: SB = 4.0
```

**2. Ao atualizar resultado:**
```typescript
// Usuário muda Ca de 2.5 para 3.0
// Sistema recalcula: SB = 4.5 (atualizado)
```

**3. Ao gerar laudo:**
```typescript
// Recalcula tudo para garantir valores corretos
// (pode ter havido mudanças no banco)
```

### Tratamento de Valores Faltantes

**Problema:** Se falta um valor (ex: Na não foi lançado), como calcular SB?

**Solução:**
```typescript
const SB = (parseFloat(ca) || 0) + 
           (parseFloat(mg) || 0) + 
           (parseFloat(k) || 0) + 
           (parseFloat(na) || 0)
```

**Explicação:**
- `parseFloat(ca) || 0`: Se `ca` for `null`/`undefined`, usa `0`
- Permite calcular mesmo com valores faltantes
- **Limitação:** Resultado pode ser impreciso se faltam muitos valores

---

## 📊 3. `frontend/src/utils/calculosGranulometria.ts`

### Visão Geral

**O que faz:** Calcula percentuais e classificação textural baseado em massas granulométricas.

### Fórmulas

**1. Massa de cada fração:**
```typescript
const massaAreiaGrossa = massaRecipienteAreiaGrossa - massaRecipiente
const massaAreiaFina = massaRecipienteAreiaFina - massaRecipiente
const massaSilteArgila = massaRecipienteSilteArgila - massaRecipiente
const massaArgila = massaRecipienteArgila - massaRecipiente
```

**Explicação:**
- Recipiente vazio tem massa X
- Recipiente com partículas tem massa Y
- Massa das partículas = Y - X

**2. Massa total seca:**
```typescript
const massaTotal = massaAreiaGrossa + massaAreiaFina + massaSilteArgila + massaArgila
```

**3. Percentuais:**
```typescript
const percentualAreiaGrossa = (massaAreiaGrossa / massaTotal) * 100
const percentualAreiaFina = (massaAreiaFina / massaTotal) * 100
const percentualSilte = (massaSilteArgila / massaTotal) * 100 - percentualArgila
const percentualArgila = (massaArgila / massaTotal) * 100
```

**4. Classificação textural:**
```typescript
function classificarTextura(areia: number, silte: number, argila: number): string {
  if (argila > 60) return 'Argiloso'
  if (argila > 35 && areia < 45) return 'Argilo-arenoso'
  if (areia > 70) return 'Arenoso'
  // ... mais classificações
}
```

**Triângulo textural:**
- Usa diagrama de classificação textural (padrão científico)
- Baseado em percentuais de Areia, Silte e Argila
- Exemplo: 40% areia + 30% silte + 30% argila = "Franco-argilo-arenoso"

### Por que Calcular no Frontend?

**Feedback imediato:**
- Usuário vê resultado ao preencher campos
- Não precisa salvar para ver classificação
- Melhor UX

**Validação:**
- Soma de percentuais deve ser ~100%
- Se muito diferente, avisa usuário (possível erro de digitação)

---

## 📄 4. `backend/src/routes/laudo.ts`

### Visão Geral

**O que faz:** Gera PDF de laudo laboratorial com todos os dados do cliente, amostras e resultados.

### Fluxo Completo

**1. Recebe requisição:**
```typescript
router.post('/gerar', async (req, res) => {
  const { loteId, tipoAnalise } = req.body
  // ...
})
```

**2. Busca dados do banco:**
```typescript
// Lote
const lote = await db.queries.lotes.findById(loteId)

// Cliente do lote
const cliente = await db.queries.clientes.findById(lote.clienteId)

// Amostras do lote
const amostras = await db.queries.amostras.findByLoteId(loteId)

// Resultados de cada amostra
for (const amostra of amostras) {
  const resultados = await db.queries.resultados.findByAmostraId(amostra.id)
  // ...
}
```

**3. Calcula valores derivados:**
```typescript
// Para cada amostra, recalcula SB, CTC, V, m
const derivados = calcularResultadosDerivados(resultados)
```

**4. Gera HTML:**
```typescript
const html = `
  <html>
    <head>
      <style>
        /* CSS para formatação */
        table { border-collapse: collapse; }
        th { background: #4CAF50; color: white; }
        /* ... */
      </style>
    </head>
    <body>
      <div class="header">
        <img src="logo.png" />
        <h1>Laudo de Análise</h1>
      </div>
      
      <div class="cliente-info">
        <p>Cliente: ${cliente.nome}</p>
        <p>CPF: ${cliente.cpf}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Amostra</th>
            <th>pH</th>
            <th>P</th>
            <th>K</th>
            <!-- ... -->
          </tr>
        </thead>
        <tbody>
          ${amostras.map(amostra => `
            <tr>
              <td>${amostra.codigo}</td>
              <td>${getResultado(amostra, 'pH')}</td>
              <td>${getResultado(amostra, 'P')}</td>
              <!-- ... -->
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="metodologia">
        <h4>METODOLOGIA</h4>
        <p>pH: relação solo-água 1:2,5</p>
        <!-- ... -->
      </div>
    </body>
  </html>
`
```

**5. Converte HTML para PDF:**
```typescript
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args
})

const page = await browser.newPage()
await page.setContent(html)
const pdf = await page.pdf({ 
  format: 'A4',
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
})

await browser.close()
```

**6. Retorna PDF:**
```typescript
res.setHeader('Content-Type', 'application/pdf')
res.setHeader('Content-Disposition', `attachment; filename="laudo_${loteId}.pdf"`)
res.send(pdf)
```

### Por que HTML → PDF?

**Vantagens:**
- Fácil de estilizar com CSS
- Suporta tabelas complexas
- Suporta imagens (logos)
- Puppeteer renderiza perfeitamente

**Alternativas consideradas:**
- **jsPDF**: Limitado, difícil fazer tabelas complexas
- **PDFKit**: Muito verboso, difícil manter
- **HTML → PDF**: Melhor balanço entre facilidade e flexibilidade

### Template Dinâmico

**Diferentes tipos de análise:**
```typescript
if (tipoAnalise === 'granulometrica') {
  // Mostra tabela granulométrica
} else if (modulo === 'foliar') {
  // Mostra tabela foliar
} else {
  // Mostra tabela de solo (padrão)
}
```

**Por que templates diferentes?**
- Campos diferentes por tipo de análise
- Formatação diferente (ex: granulometria tem mais colunas)
- Melhor organização visual

---

## 🔍 5. `backend/src/database/queries.ts`

### Visão Geral

**O que faz:** Centraliza todas as queries SQL em funções organizadas.

### Estrutura

```typescript
export const queries = {
  clientes: {
    create: (data: any) => { /* ... */ },
    findById: (id: string) => { /* ... */ },
    findAll: (filters?: any) => { /* ... */ },
    update: (id: string, data: any) => { /* ... */ },
    delete: (id: string) => { /* ... */ }
  },
  amostras: { /* ... */ },
  resultados: { /* ... */ }
}
```

### Função `create` Genérica

**Problema:** Cada entidade tem campos diferentes. Como criar função genérica?

**Solução:**
```typescript
create: (data: any) => {
  // 1. Filtra campos undefined/null
  const fields = Object.keys(data).filter(key => 
    data[key] !== undefined && data[key] !== null && data[key] !== ''
  )
  
  // 2. Cria placeholders ($1, $2, $3, ...)
  const values = fields.map((_, index) => `$${index + 1}`)
  
  // 3. Monta query
  return {
    query: `
      INSERT INTO clientes (${fields.join(', ')}) 
      VALUES (${values.join(', ')}) 
      RETURNING *
    `,
    params: fields.map(field => data[field])
  }
}
```

**Exemplo de uso:**
```typescript
const result = queries.clientes.create({
  nome: 'João',
  cpf: '123.456.789-00',
  email: 'joao@email.com'
})

// Gera:
// query: "INSERT INTO clientes (nome, cpf, email) VALUES ($1, $2, $3) RETURNING *"
// params: ['João', '123.456.789-00', 'joao@email.com']
```

**Por que filtrar undefined?**
- Se campo não foi preenchido, não inclui no INSERT
- Evita salvar `null` desnecessariamente
- Banco fica mais limpo

### Função `upsert`

**O que é:** "Update or Insert" - atualiza se existe, cria se não existe.

**Por que necessário?**
- Ao salvar resultado, pode ser novo ou atualização
- Evita erro "duplicate key" se já existe
- Simplifica lógica no código que chama

**Implementação:**
```typescript
upsert: (data: any) => {
  const fields = Object.keys(data).filter(key => data[key] !== undefined)
  const values = fields.map((_, i) => `$${i + 1}`)
  const updates = fields.map((f, i) => `${f} = $${i + 1}`)
  
  return {
    query: `
      INSERT INTO resultados (${fields.join(', ')}, "updatedAt")
      VALUES (${values.join(', ')}, NOW())
      ON CONFLICT (amostra_id, tipo) 
      DO UPDATE SET ${updates.join(', ')}, "updatedAt" = NOW()
      RETURNING *
    `,
    params: fields.map(f => data[f])
  }
}
```

**Explicação:**
- `ON CONFLICT`: Se já existe registro com mesmo `amostra_id` e `tipo`
- `DO UPDATE SET`: Atualiza campos existentes
- `RETURNING *`: Retorna registro criado/atualizado

---

## 🎯 Resumo dos Conceitos-Chave

1. **Estados Complexos:** Use `Record<string, T>` para valores por entidade
2. **Cálculos Automáticos:** Sempre recalcule valores derivados ao salvar
3. **Validação Dupla:** Frontend (UX) + Backend (segurança)
4. **Transações SQL:** Use para operações que devem ser atômicas
5. **Templates Dinâmicos:** Diferentes formatos para diferentes tipos de dados
6. **Queries Genéricas:** Reutilize código com funções parametrizadas

---

**Estes são os arquivos mais complexos. Para qualquer outro arquivo específico, posso criar explicação detalhada!**

