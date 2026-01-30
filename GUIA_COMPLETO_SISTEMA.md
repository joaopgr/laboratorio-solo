# 🎓 Guia Completo do Sistema - Laboratório de Análises de Solo

## 📋 Índice
1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Ponto de Entrada - Backend](#2-ponto-de-entrada---backend)
3. [Ponto de Entrada - Frontend](#3-ponto-de-entrada---frontend)
4. [Sistema de Autenticação](#4-sistema-de-autenticação)
5. [Contextos e Estado Global](#5-contextos-e-estado-global)
6. [Estrutura de Rotas e Navegação](#6-estrutura-de-rotas-e-navegação)
7. [Fluxo Completo: Cliente → Lote → Amostra → Resultado → Laudo](#7-fluxo-completo)
8. [Cálculos e Processamento de Dados](#8-cálculos-e-processamento-de-dados)
9. [Geração de Laudos PDF](#9-geração-de-laudos-pdf)
10. [Relatórios e Dashboards](#10-relatórios-e-dashboards)

---

## 1. Visão Geral e Arquitetura

### 1.1 Decisão de Arquitetura: Monorepo

**Por que monorepo?**
- **Organização**: Mantém frontend e backend no mesmo repositório, facilitando versionamento conjunto
- **Tipos Compartilhados**: Permite compartilhar interfaces TypeScript entre frontend e backend via pasta `shared/`
- **Deploy Coordenado**: Facilita sincronização de versões entre API e interface

**Estrutura:**
```
lab/
├── backend/     # API REST (Node.js + Express + TypeScript)
├── frontend/    # SPA (React + Vite + TypeScript)
├── shared/      # Tipos TypeScript compartilhados
└── scripts/     # Scripts de manutenção
```

### 1.2 Stack Tecnológica

**Backend:**
- **Express.js**: Framework web minimalista e flexível para APIs REST
- **TypeScript**: Type safety, melhor autocompletar e menos bugs em produção
- **PostgreSQL**: Banco relacional robusto, ideal para dados estruturados de laboratório
- **Zod**: Validação de schemas em runtime, garantindo dados válidos antes de salvar

**Frontend:**
- **React 18**: Biblioteca para interfaces, com hooks modernos
- **Vite**: Build tool ultra-rápido (vs Webpack), melhor DX (Developer Experience)
- **React Query**: Gerencia cache de requisições, sincronização automática, loading states
- **Tailwind CSS**: Utility-first CSS, desenvolvimento rápido sem escrever CSS customizado

**Por que essas escolhas?**
- **TypeScript**: Projeto complexo com muitos tipos (Amostra, Resultado, Cliente) - type safety previne erros
- **React Query**: Sistema tem muitas listas (amostras, lotes, resultados) - cache reduz requisições desnecessárias
- **PostgreSQL**: Dados relacionais complexos (Cliente → Lote → Amostra → Resultado) - SQL é ideal

---

## 2. Ponto de Entrada - Backend

### 2.1 Arquivo: `backend/src/index.ts`

**Este é o primeiro arquivo que você criaria ao iniciar o projeto.**

```typescript
import express from 'express';
import dotenv from 'dotenv';
import { db } from './database/connection';
```

**Explicação:**
- `express`: Cria o servidor HTTP que recebe requisições
- `dotenv`: Carrega variáveis de ambiente do arquivo `.env` (DATABASE_URL, JWT_SECRET, etc.)
- `db`: Conexão com PostgreSQL (vamos ver depois)

**Por que começar aqui?**
- Todo backend precisa de um servidor HTTP
- Express é padrão da indústria, muita documentação e comunidade
- Variáveis de ambiente separam configuração de código (segurança)

### 2.2 Configuração do Servidor

```typescript
const app = express();
const PORT = process.env.PORT || 3001;
```

**Decisões:**
- `PORT` via variável de ambiente: permite diferentes portas em dev/prod sem alterar código
- Fallback `3001`: padrão quando não há variável definida

### 2.3 Middleware CORS

```typescript
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  return next();
});
```

**O que é CORS?**
- **Cross-Origin Resource Sharing**: Permite que frontend (localhost:3000) faça requisições para backend (localhost:3001)
- Sem CORS, navegador bloqueia requisições entre origens diferentes

**Por que manual?**
- Controle total sobre headers
- Alguns middlewares (como helmet) podem causar problemas em produção (Vercel)

**OPTIONS request:**
- Navegador envia requisição "preflight" antes de POST/PUT para verificar permissões
- Resposta 204 (No Content) confirma que é permitido

### 2.4 Middleware de Parsing

```typescript
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**O que faz:**
- `express.json()`: Converte body de requisições JSON em objeto JavaScript
- `express.urlencoded()`: Converte dados de formulários HTML

**Exemplo:**
```javascript
// Cliente envia: { "nome": "João", "cpf": "123.456.789-00" }
// Express transforma em: req.body = { nome: "João", cpf: "123.456.789-00" }
```

### 2.5 Registro de Rotas

```typescript
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/amostras', amostraRoutes);
// ... etc
```

**Padrão REST:**
- `/api/auth` → autenticação (login, registro)
- `/api/clientes` → CRUD de clientes
- `/api/amostras` → CRUD de amostras
- Prefixo `/api` separa rotas da API de rotas estáticas (se houver)

**Por que separar em arquivos?**
- **Organização**: Cada domínio (cliente, amostra) em seu próprio arquivo
- **Manutenibilidade**: Fácil encontrar código relacionado
- **Escalabilidade**: Time pode trabalhar em rotas diferentes sem conflitos

### 2.6 Tratamento de Erros

```typescript
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
  });
});
```

**O que faz:**
- Captura erros não tratados em qualquer rota
- Em **desenvolvimento**: mostra mensagem detalhada (útil para debug)
- Em **produção**: mensagem genérica (não expõe detalhes internos)

**Por que importante?**
- Previne que erros quebrem o servidor
- Retorna resposta JSON consistente mesmo em caso de erro

---

## 3. Ponto de Entrada - Frontend

### 3.1 Arquivo: `frontend/src/main.tsx`

**Este é o primeiro arquivo do frontend que executa.**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
```

**Explicação:**
- `ReactDOM.createRoot`: Nova API do React 18 para renderizar componentes
- `QueryClientProvider`: Fornece React Query para toda a aplicação
- `BrowserRouter`: Habilita roteamento (navegação entre páginas)
- `Toaster`: Componente para exibir notificações (toasts)

### 3.2 Configuração do React Query

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Tenta novamente 1 vez se falhar
      refetchOnWindowFocus: false, // Não recarrega ao focar janela
      staleTime: 5 * 60 * 1000,   // Dados "frescos" por 5 minutos
      gcTime: 10 * 60 * 1000,     // Cache mantido por 10 minutos
    },
  },
})
```

**Por que essas configurações?**
- **retry: 1**: Se rede falhar, tenta 1 vez (não fica tentando infinitamente)
- **refetchOnWindowFocus: false**: Evita recarregar dados toda vez que usuário volta à aba
- **staleTime: 5min**: Dados considerados atualizados por 5min (evita requisições desnecessárias)
- **gcTime: 10min**: Mantém dados em cache por 10min após não usar (melhor performance)

**Exemplo prático:**
```typescript
// Usuário abre página de Clientes
const { data } = useQuery(['clientes'], fetchClientes)
// React Query faz requisição e guarda em cache

// Usuário navega para Amostras e volta para Clientes em 2 minutos
// React Query NÃO faz nova requisição (dados ainda "frescos")
// Retorna dados do cache (mais rápido!)
```

### 3.3 Renderização da Aplicação

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

**Hierarquia de Providers:**
1. **QueryClientProvider**: Envolve tudo para que qualquer componente possa usar `useQuery`
2. **BrowserRouter**: Envolve tudo para que rotas funcionem
3. **App**: Componente principal com rotas
4. **Toaster**: Renderizado uma vez, aparece em todas as páginas

**React.StrictMode:**
- Em desenvolvimento, executa componentes 2x para detectar bugs
- Não afeta produção

---

## 4. Sistema de Autenticação

### 4.1 Arquivo: `frontend/src/contexts/AuthContext.tsx`

**Context API do React para gerenciar estado de autenticação globalmente.**

**Por que Context?**
- Múltiplas páginas precisam saber se usuário está logado
- Evita passar `user` como prop por toda a árvore de componentes
- Centraliza lógica de login/logout

### 4.2 Fluxo de Autenticação

**1. Login (`frontend/src/pages/Login.tsx`):**
```typescript
const { login } = useAuth()
await login(email, password)
```

**2. Backend valida (`backend/src/routes/auth.ts`):**
```typescript
// Busca usuário no banco
const user = await db.query('SELECT * FROM usuarios WHERE email = $1', [email])

// Compara senha com hash
const isValid = await bcrypt.compare(password, user.senha)

// Gera token JWT
const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET)
```

**3. Frontend armazena token:**
```typescript
localStorage.setItem('token', token)
```

**Por que JWT?**
- **Stateless**: Servidor não precisa guardar sessões
- **Escalável**: Funciona em múltiplos servidores (serverless)
- **Seguro**: Token assinado, não pode ser falsificado

**Por que localStorage?**
- Persiste entre recarregamentos de página
- Alternativa seria cookies (mas JWT em cookie tem riscos de XSS)

### 4.3 Proteção de Rotas

**Arquivo: `frontend/src/components/ProtectedRoute.tsx`**

```typescript
<ProtectedRoute allowedRoles={['admin', 'funcionario']}>
  <Dashboard />
</ProtectedRoute>
```

**O que faz:**
- Verifica se usuário está autenticado
- Verifica se role do usuário está em `allowedRoles`
- Se não, redireciona para `/login`

**Por que componente wrapper?**
- Reutilizável: aplica proteção em qualquer rota
- DRY (Don't Repeat Yourself): não precisa verificar autenticação em cada página

---

## 5. Contextos e Estado Global

### 5.1 ModuleContext (`frontend/src/contexts/ModuleContext.tsx`)

**Gerencia qual módulo está ativo: Solo ou Foliar.**

**Por que necessário?**
- Sistema tem 2 módulos com funcionalidades diferentes
- Módulo Solo: análises de solo (pH, P, K, etc.)
- Módulo Foliar: análises foliares (N, B, etc.)
- Interface muda baseado no módulo selecionado

**Exemplo de uso:**
```typescript
const { modulo } = useModule()

// Em uma página de resultados
if (modulo === 'solo') {
  // Mostra campos de solo
} else {
  // Mostra campos foliares
}
```

### 5.2 ValoresAnaliseContext

**Armazena valores padrão de análise (diluições, fatores, etc.)**

**Por que Context?**
- Valores são usados em múltiplas páginas
- Evita fazer requisição toda vez que precisa do valor
- Carrega uma vez, usa em todo lugar

---

## 6. Estrutura de Rotas e Navegação

### 6.1 Arquivo: `frontend/src/App.tsx`

**Define todas as rotas da aplicação.**

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<Layout />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="clientes" element={<Clientes />} />
    {/* ... */}
  </Route>
</Routes>
```

**Estrutura:**
- `/login`: Página pública (não precisa autenticação)
- `/`: Layout com sidebar (precisa autenticação)
  - Rotas filhas renderizam dentro do Layout

**Por que Layout wrapper?**
- Sidebar e Header aparecem em todas as páginas internas
- Não precisa repetir em cada página
- Mudança no layout afeta todas as páginas automaticamente

### 6.2 Componente Layout

**Arquivo: `frontend/src/components/Layout.tsx`**

```typescript
<Layout>
  <Sidebar />
  <Header />
  <main>
    <Outlet /> {/* Renderiza a rota filha aqui */}
  </main>
</Layout>
```

**Outlet:**
- Componente do React Router que renderiza a rota filha
- Quando navega para `/clientes`, `<Clientes />` renderiza no lugar do `<Outlet />`

---

## 7. Fluxo Completo: Cliente → Lote → Amostra → Resultado → Laudo

### 7.1 Passo 1: Cadastro de Cliente

**Arquivo: `frontend/src/pages/Clientes.tsx`**

**O que faz:**
- Lista todos os clientes
- Botão "Novo Cliente" abre formulário

**Componente: `frontend/src/components/ClienteForm.tsx`**

**Validação com Zod:**
```typescript
const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  email: z.string().email('Email inválido').optional(),
})
```

**Por que Zod?**
- Validação em runtime (não só TypeScript)
- Mensagens de erro customizadas
- Mesmo schema pode ser usado no frontend e backend

**Hook: `frontend/src/hooks/useClientes.ts`**

```typescript
const createCliente = useMutation({
  mutationFn: (data) => api.post('/clientes', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['clientes']) // Recarrega lista
    toast.success('Cliente criado!')
  }
})
```

**React Query Mutations:**
- `useMutation`: Para operações que modificam dados (POST, PUT, DELETE)
- `invalidateQueries`: Marca cache como "stale", força recarregar na próxima vez

**Backend: `backend/src/routes/cliente.ts`**

```typescript
router.post('/', async (req, res) => {
  const data = createClienteSchema.parse(req.body) // Valida com Zod
  const result = await db.queries.clientes.create(data)
  res.json(result)
})
```

**Por que validar no backend também?**
- Frontend pode ser burlado (usuário pode enviar dados inválidos via Postman)
- Backend é a última linha de defesa

### 7.2 Passo 2: Criação de Lote

**Arquivo: `frontend/src/pages/Lotes.tsx`**

**O que é um Lote?**
- Agrupa múltiplas amostras de um mesmo cliente
- Tem status financeiro (pago/pendente)
- Define tipos de análise (Rotina, Micronutrientes, etc.)

**Fluxo:**
1. Seleciona cliente
2. Define tipos de análise
3. Cria lote
4. Adiciona amostras ao lote

**Backend: `backend/src/routes/lote.ts`**

```typescript
router.post('/', async (req, res) => {
  const lote = await db.queries.lotes.create({
    clienteId: req.body.clienteId,
    tiposAnalise: req.body.tiposAnalise,
    status: 'pendente'
  })
  res.json(lote)
})
```

### 7.3 Passo 3: Cadastro de Amostras

**Arquivo: `frontend/src/pages/Amostras.tsx`**

**O que é uma Amostra?**
- Representa uma amostra física de solo/folha
- Pertence a um lote
- Tem código, identificação, cultura

**Relacionamento:**
```
Cliente (1) → (N) Lotes
Lote (1) → (N) Amostras
Amostra (1) → (N) Resultados
```

**Por que relacionamento assim?**
- Um cliente pode ter vários lotes
- Um lote agrupa várias amostras
- Uma amostra pode ter vários resultados (pH, P, K, etc.)

### 7.4 Passo 4: Lançamento de Resultados

**Arquivo: `frontend/src/pages/LancamentoResultados.tsx`**

**Duas formas de lançar:**
1. **Individual**: Uma amostra por vez
2. **Em Lote**: Múltiplas amostras de uma vez

**Por que duas formas?**
- Individual: útil para correções, valores específicos
- Em Lote: eficiente quando todas amostras têm mesmo tipo de análise

**Fluxo em Lote:**
```typescript
// 1. Seleciona tipo de resultado (ex: "pH")
const [tipoResultado, setTipoResultado] = useState('pH')

// 2. Filtra amostras que solicitam esse tipo
const amostrasFiltradas = amostras.filter(a => a.rotina) // pH está em "rotina"

// 3. Usuário preenche valores para cada amostra
const [valores, setValores] = useState({})

// 4. Ao salvar, envia array de resultados
const resultados = amostras.map(a => ({
  amostraId: a.id,
  tipo: 'pH',
  valor: valores[a.id]
}))

await createResultados.mutateAsync({ resultados })
```

**Backend processa em lote:**
```typescript
router.post('/lote', async (req, res) => {
  const { resultados } = req.body
  
  // Usa transação para garantir que tudo salva ou nada salva
  await db.query('BEGIN')
  try {
    for (const resultado of resultados) {
      await db.queries.resultados.upsert(resultado)
    }
    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
})
```

**Por que transação?**
- Se uma amostra falhar, todas são revertidas
- Evita dados inconsistentes (ex: 5 de 10 amostras salvas)

### 7.5 Passo 5: Cálculos Automáticos

**Arquivo: `backend/src/utils/calculosResultados.ts`**

**O que faz:**
- Calcula valores derivados (SB, CTC, V, m, etc.) baseado em valores brutos
- Executa automaticamente ao salvar resultados

**Exemplo:**
```typescript
// Usuário lança: Ca, Mg, K, Al, H+Al
// Sistema calcula automaticamente:
const SB = Ca + Mg + K           // Soma de Bases
const t = SB + Al                 // CTC Efetiva
const T = SB + H_Al               // CTC Total
const V = (SB / T) * 100         // Saturação de Bases (%)
const m = (Al / t) * 100          // Saturação de Alumínio (%)
```

**Por que calcular no backend?**
- Garante que cálculos são sempre corretos
- Frontend pode ter bugs, usuário pode modificar
- Backend é fonte da verdade

**Quando calcula?**
- Ao salvar resultado novo
- Ao atualizar resultado existente
- Ao gerar laudo (recalcula tudo para garantir)

### 7.6 Passo 6: Geração de Laudo

**Arquivo: `backend/src/routes/laudo.ts`**

**Fluxo:**
1. Usuário seleciona lote
2. Backend busca: cliente, amostras, resultados
3. Gera HTML com template
4. Converte HTML para PDF
5. Retorna PDF para download

**Template HTML:**
```typescript
const html = `
  <html>
    <head>
      <style>
        /* CSS para formatação */
      </style>
    </head>
    <body>
      <h1>Laudo de Análise</h1>
      <p>Cliente: ${cliente.nome}</p>
      <table>
        <!-- Tabela com resultados -->
      </table>
    </body>
  </html>
`
```

**Conversão para PDF:**
```typescript
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  args: chromium.args
})

const page = await browser.newPage()
await page.setContent(html)
const pdf = await page.pdf({ format: 'A4' })
```

**Por que Puppeteer?**
- Renderiza HTML como navegador real
- Suporta CSS avançado (flexbox, grid)
- Alternativas (html-pdf) têm limitações

**Por que chromium no Vercel?**
- Vercel é serverless (sem sistema operacional completo)
- `@sparticuz/chromium` é Chromium compilado para Lambda
- Permite usar Puppeteer em ambiente serverless

---

## 8. Cálculos e Processamento de Dados

### 8.1 Cálculos de Solo

**Arquivo: `backend/src/utils/calculosResultados.ts`**

**Fórmulas implementadas:**

1. **SB (Soma de Bases)**
   ```typescript
   SB = Ca + Mg + K + Na
   ```
   - Soma todos os cátions trocáveis
   - Unidade: cmol/dm³

2. **CTC Efetiva (t)**
   ```typescript
   t = SB + Al
   ```
   - Capacidade de troca catiónica efetiva
   - Inclui alumínio trocável

3. **CTC Total (T)**
   ```typescript
   T = SB + (H+Al)
   ```
   - Capacidade de troca catiónica a pH 7.0
   - Inclui acidez potencial

4. **Saturação de Bases (V%)**
   ```typescript
   V = (SB / T) * 100
   ```
   - Percentual de saturação por bases
   - Indica fertilidade do solo

5. **Saturação de Alumínio (m%)**
   ```typescript
   m = (Al / t) * 100
   ```
   - Percentual de saturação por alumínio
   - Indica toxicidade

**Por que essas fórmulas?**
- Padrão da Embrapa (Empresa Brasileira de Pesquisa Agropecuária)
- Métodos científicos reconhecidos
- Necessário para interpretação correta dos resultados

### 8.2 Cálculos Granulométricos

**Arquivo: `frontend/src/utils/calculosGranulometria.ts`**

**O que calcula:**
- Percentuais de Areia Grossa, Areia Fina, Silte, Argila
- Classificação textural do solo (arenoso, argiloso, etc.)

**Fórmulas:**
```typescript
// Massa de cada fração
const massaAreiaGrossa = massaRecipienteAreiaGrossa - massaRecipiente
const massaAreiaFina = massaRecipienteAreiaFina - massaRecipiente
// ... etc

// Percentuais
const percentualAreiaGrossa = (massaAreiaGrossa / massaTotal) * 100
```

**Por que calcular no frontend?**
- Usuário vê resultado imediatamente ao preencher
- Feedback visual (não precisa salvar para ver)
- Backend também recalcula ao salvar (validação)

---

## 9. Geração de Laudos PDF

### 9.1 Estrutura do Laudo

**Arquivo: `backend/src/routes/laudo.ts` - função `gerarPDFLaudoSobrio`**

**Seções do laudo:**
1. **Cabeçalho**: Logo, nome do laboratório, data
2. **Dados do Cliente**: Nome, CPF, endereço
3. **Tabela de Resultados**: Valores por amostra
4. **Metodologia**: Métodos utilizados
5. **Observações**: Informações importantes
6. **Rodapé**: Assinatura, QR Code

### 9.2 Template HTML

**Por que HTML?**
- Fácil de estilizar com CSS
- Suporta tabelas complexas
- Puppeteer renderiza perfeitamente

**CSS inline vs arquivo separado:**
- Usamos CSS inline no template
- Puppeteer não carrega arquivos externos facilmente
- Tudo em uma string HTML é mais portável

### 9.3 QR Code

**Por que QR Code?**
- Permite verificar autenticidade do laudo
- Link para página de validação
- Previne falsificação

**Geração:**
```typescript
import QRCode from 'qrcode'

const qrCodeDataUrl = await QRCode.toDataURL(
  `https://laboratorio.com/validar/${laudoId}`
)
```

---

## 10. Relatórios e Dashboards

### 10.1 Dashboard

**Arquivo: `frontend/src/pages/Dashboard.tsx`**

**O que mostra:**
- Estatísticas gerais (total de clientes, lotes, amostras)
- Gráficos de produtividade
- Pendências (lotes não pagos, amostras sem resultado)

**Por que importante?**
- Visão geral rápida do estado do laboratório
- Identifica gargalos (ex: muitos lotes pendentes)
- Ajuda na tomada de decisão

### 10.2 Relatórios

**Arquivo: `frontend/src/pages/Relatorios.tsx`**

**Funcionalidades:**
- Filtros avançados (data, cliente, tipo de análise)
- Exportação em Excel
- Exportação em PDF

**Exportação Excel:**
```typescript
import * as XLSX from 'xlsx'

const worksheet = XLSX.utils.json_to_sheet(dados)
const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados')
XLSX.writeFile(workbook, 'relatorio.xlsx')
```

**Por que Excel?**
- Formato universal, abre em qualquer lugar
- Clientes podem usar para análises próprias
- Fácil de compartilhar

---

## 📚 Próximos Passos para Estudo

1. **Comece pelo backend:**
   - `backend/src/index.ts` → `backend/src/database/connection.ts` → `backend/src/routes/cliente.ts`

2. **Depois frontend:**
   - `frontend/src/main.tsx` → `frontend/src/App.tsx` → `frontend/src/pages/Login.tsx`

3. **Siga o fluxo de uso:**
   - Login → Dashboard → Clientes → Lotes → Amostras → Resultados → Laudos

4. **Estude os hooks:**
   - `frontend/src/hooks/useClientes.ts` (padrão usado em todos os hooks)
   - `frontend/src/hooks/useAmostras.ts`
   - `frontend/src/hooks/useResultados.ts`

5. **Entenda os cálculos:**
   - `backend/src/utils/calculosResultados.ts`
   - `frontend/src/utils/calculosGranulometria.ts`

---

## 🎯 Conceitos-Chave para TCC

1. **Arquitetura Monorepo**: Organização de código
2. **REST API**: Padrão de comunicação frontend/backend
3. **React Query**: Gerenciamento de estado assíncrono
4. **TypeScript**: Type safety
5. **Zod**: Validação de dados
6. **JWT**: Autenticação stateless
7. **PostgreSQL**: Banco relacional
8. **Puppeteer**: Geração de PDF
9. **Transações SQL**: Consistência de dados
10. **Context API**: Estado global no React

---

**Este guia cobre os fundamentos. Para cada arquivo específico, posso criar explicações detalhadas linha por linha. Qual parte você gostaria de aprofundar primeiro?**

