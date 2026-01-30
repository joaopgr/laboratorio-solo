# 🔨 Fluxo de Criação do Sistema - Passo a Passo

Este documento segue a ordem lógica de criação do sistema, como se você estivesse construindo do zero.

---

## 📦 FASE 1: Setup Inicial e Backend Base

### Arquivo 1: `backend/package.json`

**O que é:** Arquivo de configuração do Node.js que define dependências e scripts.

**Por que começar aqui?**
- Define quais bibliotecas você vai usar
- Configura scripts de desenvolvimento (`npm run dev`)

**Decisões importantes:**
```json
{
  "dependencies": {
    "express": "^4.18.2",        // Servidor HTTP
    "pg": "^8.16.3",             // Cliente PostgreSQL
    "zod": "^3.22.4",            // Validação
    "jsonwebtoken": "^9.0.2",    // Autenticação JWT
    "bcryptjs": "^2.4.3"         // Hash de senhas
  }
}
```

**Por que essas bibliotecas?**
- **Express**: Padrão da indústria, muita documentação
- **pg**: Cliente oficial do PostgreSQL, performático
- **Zod**: Validação type-safe, melhor que Joi/Yup
- **JWT**: Autenticação stateless (não precisa sessões)
- **bcryptjs**: Hash seguro de senhas (não armazena senha em texto)

---

### Arquivo 2: `backend/src/database/connection.ts`

**O que faz:** Estabelece conexão com banco de dados PostgreSQL.

**Código:**
```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  close: () => pool.end()
}
```

**Explicação linha por linha:**

1. **`import { Pool } from 'pg'`**
   - Pool = conjunto de conexões reutilizáveis
   - Mais eficiente que criar conexão nova a cada requisição

2. **`connectionString: process.env.DATABASE_URL`**
   - URL do banco vem de variável de ambiente
   - Formato: `postgresql://user:password@host:port/database`
   - **Por que variável de ambiente?** Segurança - não commita credenciais no código

3. **`ssl: { rejectUnauthorized: false }`**
   - Em produção (Vercel, Supabase), banco requer SSL
   - `rejectUnauthorized: false` aceita certificado auto-assinado
   - Em desenvolvimento, geralmente não precisa SSL

4. **`db.query`**
   - Função wrapper que usa o pool
   - Permite trocar implementação depois sem mudar código que usa

**Por que Pool?**
- Criar conexão é custoso (latência de rede)
- Pool mantém conexões abertas, reutiliza
- Exemplo: 10 requisições simultâneas = 1 conexão reutilizada (vs 10 conexões novas)

---

### Arquivo 3: `backend/src/database/queries.ts`

**O que faz:** Funções para fazer queries SQL de forma organizada.

**Estrutura:**
```typescript
export const queries = {
  clientes: {
    create: (data: any) => { /* SQL INSERT */ },
    findById: (id: string) => { /* SQL SELECT */ },
    update: (id: string, data: any) => { /* SQL UPDATE */ }
  },
  amostras: { /* ... */ },
  resultados: { /* ... */ }
}
```

**Por que organizar assim?**
- **Separação de responsabilidades**: Cada entidade (cliente, amostra) tem suas queries
- **Reutilização**: Múltiplas rotas podem usar `queries.clientes.findById`
- **Manutenibilidade**: Fácil encontrar query relacionada a cliente

**Exemplo de query:**
```typescript
create: (data: any) => {
  const fields = Object.keys(data).filter(k => data[k] !== undefined)
  const values = fields.map((_, i) => `$${i + 1}`)
  
  return {
    query: `INSERT INTO clientes (${fields.join(', ')}) VALUES (${values.join(', ')}) RETURNING *`,
    params: fields.map(f => data[f])
  }
}
```

**Explicação:**
- `Object.keys(data)`: Pega nomes dos campos (ex: `['nome', 'cpf', 'email']`)
- `filter`: Remove campos `undefined` (não inclui no INSERT)
- `values.map((_, i) => `$${i + 1}`)`: Cria `['$1', '$2', '$3']` para prepared statements
- **Prepared statements**: Previne SQL injection (segurança)

**SQL Injection - Por que importante?**
```typescript
// ❌ PERIGOSO (não fazer):
const query = `SELECT * FROM clientes WHERE nome = '${nome}'`
// Se nome = "'; DROP TABLE clientes; --"
// Query vira: SELECT * FROM clientes WHERE nome = ''; DROP TABLE clientes; --'

// ✅ SEGURO (prepared statement):
const query = `SELECT * FROM clientes WHERE nome = $1`
const params = [nome]
// PostgreSQL trata 'nome' como valor, não como código SQL
```

---

### Arquivo 4: `backend/src/index.ts`

**O que faz:** Ponto de entrada do servidor, configura Express e registra rotas.

**Já explicado no guia anterior, mas resumo:**
1. Cria app Express
2. Configura middlewares (CORS, JSON parser)
3. Registra rotas (`/api/clientes`, `/api/amostras`, etc.)
4. Tratamento de erros global
5. Inicia servidor na porta 3001

**Ordem de middlewares importa:**
```typescript
app.use(cors)           // 1. CORS primeiro (permite requisições)
app.use(express.json()) // 2. Parse JSON (precisa vir antes das rotas)
app.use('/api', routes) // 3. Rotas por último
app.use(errorHandler)   // 4. Error handler por último (captura erros das rotas)
```

**Por que essa ordem?**
- CORS precisa processar antes de qualquer coisa
- JSON parser precisa processar antes das rotas (rotas usam `req.body`)
- Error handler precisa ser último (captura erros de tudo acima)

---

## 🔐 FASE 2: Autenticação

### Arquivo 5: `backend/src/routes/auth.ts`

**O que faz:** Rotas de autenticação (login, registro, validação de token).

**Rota de Login:**
```typescript
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  
  // 1. Busca usuário no banco
  const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email])
  const user = result.rows[0]
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  
  // 2. Compara senha com hash
  const isValid = await bcrypt.compare(password, user.senha)
  
  if (!isValid) {
    return res.status(401).json({ error: 'Credenciais inválidas' })
  }
  
  // 3. Gera token JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  )
  
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
})
```

**Explicação passo a passo:**

1. **Busca usuário:**
   - Query SQL busca por email (email é único)
   - Se não encontrar, retorna erro 401 (não autorizado)

2. **Compara senha:**
   - **NUNCA** armazena senha em texto plano
   - Armazena hash (bcrypt) no banco
   - `bcrypt.compare` compara senha digitada com hash
   - Hash é unidirecional (não dá para reverter)

3. **Gera token JWT:**
   - Token contém: `{ id, role }` (dados do usuário)
   - Assinado com `JWT_SECRET` (só servidor conhece)
   - Expira em 24h (segurança - token roubado expira)

**Por que JWT?**
- **Stateless**: Servidor não guarda sessão
- **Escalável**: Funciona em múltiplos servidores (serverless)
- **Portável**: Cliente guarda token, envia em cada requisição

**Fluxo completo:**
```
1. Cliente envia: { email: "joao@email.com", password: "123456" }
2. Backend valida credenciais
3. Backend retorna: { token: "eyJhbGc..." }
4. Frontend guarda token em localStorage
5. Próximas requisições incluem: Header: { Authorization: "Bearer eyJhbGc..." }
6. Backend valida token antes de processar requisição
```

---

### Arquivo 6: `frontend/src/services/api.ts`

**O que faz:** Configuração do Axios (cliente HTTP) com interceptors.

**Código:**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor: adiciona token em TODAS as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: trata erros 401 (token inválido/expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

**Explicação:**

1. **`axios.create`**
   - Cria instância do Axios com configuração padrão
   - `baseURL`: Todas as requisições começam com essa URL
   - Exemplo: `api.get('/clientes')` → `http://localhost:3001/api/clientes`

2. **Interceptor de Request:**
   - Executa ANTES de enviar requisição
   - Pega token do localStorage
   - Adiciona header `Authorization: Bearer <token>`
   - **Por que interceptor?** Não precisa adicionar token manualmente em cada requisição

3. **Interceptor de Response:**
   - Executa DEPOIS de receber resposta
   - Se erro 401 (não autorizado): token inválido/expirado
   - Remove token e redireciona para login
   - **Por que automático?** Usuário não precisa fazer logout manual

**Exemplo de uso:**
```typescript
// Sem interceptor (trabalhoso):
const token = localStorage.getItem('token')
axios.get('/api/clientes', {
  headers: { Authorization: `Bearer ${token}` }
})

// Com interceptor (automático):
api.get('/clientes') // Token adicionado automaticamente!
```

---

### Arquivo 7: `frontend/src/contexts/AuthContext.tsx`

**O que faz:** Context React para gerenciar estado de autenticação globalmente.

**Código:**
```typescript
interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Ao montar componente, verifica se tem token salvo
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Valida token com backend
      api.get('/auth/me').then(res => {
        setUser(res.data.user)
      }).catch(() => {
        localStorage.removeItem('token')
      }).finally(() => {
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**Explicação:**

1. **`useState` para user:**
   - Guarda dados do usuário logado
   - `null` = não logado

2. **`useEffect` ao montar:**
   - Verifica se tem token salvo
   - Se tem, valida com backend (`/auth/me`)
   - Se válido, restaura sessão (usuário não precisa logar de novo)
   - **Por que importante?** UX - usuário não perde sessão ao recarregar página

3. **`login` function:**
   - Chama API de login
   - Salva token no localStorage
   - Atualiza estado `user`

4. **`logout` function:**
   - Remove token
   - Limpa estado `user`

**Por que Context?**
- Múltiplas páginas precisam saber se usuário está logado
- Evita "prop drilling" (passar `user` como prop por toda árvore)
- Centraliza lógica de autenticação

**Exemplo de uso:**
```typescript
// Em qualquer componente:
const { user, login, logout } = useAuth()

if (!user) {
  return <LoginForm onLogin={login} />
}

return <div>Olá, {user.email}!</div>
```

---

### Arquivo 8: `frontend/src/pages/Login.tsx`

**O que faz:** Página de login.

**Código simplificado:**
```typescript
export function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Credenciais inválidas')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
      {error && <p>{error}</p>}
    </form>
  )
}
```

**Fluxo:**
1. Usuário preenche email e senha
2. Clica em "Entrar"
3. `handleSubmit` chama `login()` do contexto
4. Se sucesso, navega para `/dashboard`
5. Se erro, mostra mensagem

---

## 👥 FASE 3: CRUD de Clientes

### Arquivo 9: `backend/src/routes/cliente.ts`

**O que faz:** Rotas REST para gerenciar clientes (CREATE, READ, UPDATE, DELETE).

**Rota CREATE:**
```typescript
router.post('/', async (req, res) => {
  try {
    // 1. Valida dados com Zod
    const data = createClienteSchema.parse(req.body)
    
    // 2. Insere no banco
    const result = await db.queries.clientes.create(data)
    
    // 3. Retorna cliente criado
    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      })
    }
    throw error
  }
})
```

**Schema Zod:**
```typescript
const createClienteSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'UF é obrigatório'),
})
```

**Por que Zod?**
- Validação em runtime (TypeScript só valida em compile-time)
- Mensagens de erro customizadas
- Mesmo schema pode ser usado no frontend e backend
- Type-safe: TypeScript infere tipos do schema

**Fluxo de validação:**
```
1. Cliente envia: { nome: "João", cpf: "123.456.789-00", ... }
2. Zod valida: nome tem 2+ caracteres? ✅ CPF está no formato correto? ✅
3. Se válido: salva no banco
4. Se inválido: retorna 400 com detalhes do erro
```

**Rota READ (listar):**
```typescript
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query
  
  const result = await db.queries.clientes.findAll({
    search: search as string,
    page: Number(page),
    limit: Number(limit)
  })
  
  res.json({
    clientes: result.rows,
    total: result.rowCount,
    page: Number(page),
    limit: Number(limit)
  })
})
```

**Paginação:**
- **Por que paginar?** Se tem 10.000 clientes, não retorna todos de uma vez (lento)
- `page` e `limit`: controlam quantos registros retornar
- Exemplo: `page=1&limit=50` → retorna clientes 1-50

**Rota UPDATE:**
```typescript
router.put('/:id', async (req, res) => {
  const data = updateClienteSchema.parse(req.body)
  const result = await db.queries.clientes.update(req.params.id, data)
  res.json(result.rows[0])
})
```

**Rota DELETE:**
```typescript
router.delete('/:id', async (req, res) => {
  await db.queries.clientes.delete(req.params.id)
  res.status(204).send() // 204 = No Content (sucesso sem retornar dados)
})
```

---

### Arquivo 10: `frontend/src/hooks/useClientes.ts`

**O que faz:** Hook customizado que usa React Query para gerenciar dados de clientes.

**Código:**
```typescript
export function useClientes(filters?: any) {
  return useQuery({
    queryKey: ['clientes', filters],
    queryFn: () => api.get('/clientes', { params: filters }).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

export function useCreateCliente() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => api.post('/clientes', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes'])
      toast.success('Cliente criado!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar cliente')
    }
  })
}
```

**Explicação:**

1. **`useQuery` (listar):**
   - `queryKey: ['clientes', filters]`: Chave única do cache
     - Se `filters` mudar, React Query faz nova requisição
     - Exemplo: `['clientes', { search: 'João' }]` vs `['clientes', { search: 'Maria' }]` = caches diferentes
   - `queryFn`: Função que faz a requisição
   - `staleTime`: Dados considerados "frescos" por 5min (não recarrega)

2. **`useMutation` (criar):**
   - `mutationFn`: Função que faz POST
   - `onSuccess`: Após criar com sucesso:
     - `invalidateQueries`: Marca cache como "stale"
     - Próxima vez que usar `useClientes()`, recarrega dados
     - Mostra toast de sucesso
   - `onError`: Se falhar, mostra toast de erro

**Por que React Query?**
- **Cache automático**: Não precisa fazer requisição toda vez
- **Loading states**: `isLoading`, `isError` automáticos
- **Sincronização**: `invalidateQueries` atualiza lista automaticamente

**Exemplo de uso:**
```typescript
function ClientesPage() {
  const { data, isLoading } = useClientes({ search: 'João' })
  const createCliente = useCreateCliente()
  
  if (isLoading) return <Spinner />
  
  return (
    <div>
      {data.clientes.map(cliente => (
        <div key={cliente.id}>{cliente.nome}</div>
      ))}
      <button onClick={() => createCliente.mutate({ nome: 'Novo' })}>
        Criar
      </button>
    </div>
  )
}
```

---

### Arquivo 11: `frontend/src/pages/Clientes.tsx`

**O que faz:** Página que lista clientes e permite criar novos.

**Código simplificado:**
```typescript
export function Clientes() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useClientes({ search })
  const createCliente = useCreateCliente()
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <input 
        value={search} 
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar cliente..."
      />
      
      {isLoading ? (
        <Spinner />
      ) : (
        <table>
          {data.clientes.map(cliente => (
            <tr key={cliente.id}>
              <td>{cliente.nome}</td>
              <td>{cliente.cpf}</td>
            </tr>
          ))}
        </table>
      )}
      
      <button onClick={() => setShowForm(true)}>Novo Cliente</button>
      
      {showForm && (
        <ClienteForm 
          onSuccess={() => {
            setShowForm(false)
            createCliente.mutate(/* dados do form */)
          }}
        />
      )}
    </div>
  )
}
```

**Fluxo:**
1. Usuário digita no campo de busca
2. `search` muda, React Query faz nova requisição com filtro
3. Tabela atualiza automaticamente
4. Clica em "Novo Cliente"
5. Abre formulário
6. Ao salvar, `createCliente.mutate()` cria cliente
7. React Query invalida cache, lista recarrega automaticamente

---

### Arquivo 12: `frontend/src/components/ClienteForm.tsx`

**O que faz:** Formulário reutilizável para criar/editar cliente.

**Código simplificado:**
```typescript
export function ClienteForm({ cliente, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    cpf: cliente?.cpf || '',
    email: cliente?.email || '',
    // ... outros campos
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createCliente = useCreateCliente()
  const updateCliente = useUpdateCliente()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação frontend
    const newErrors: Record<string, string> = {}
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }
    if (!formData.cpf.match(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)) {
      newErrors.cpf = 'CPF inválido'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Salva
    if (cliente) {
      await updateCliente.mutateAsync({ id: cliente.id, ...formData })
    } else {
      await createCliente.mutateAsync(formData)
    }
    
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.nome}
        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
      />
      {errors.nome && <span>{errors.nome}</span>}
      {/* ... outros campos */}
      <button type="submit">Salvar</button>
    </form>
  )
}
```

**Validação dupla:**
- **Frontend**: Valida antes de enviar (UX - feedback imediato)
- **Backend**: Valida novamente (segurança - frontend pode ser burlado)

**Por que validação frontend?**
- Feedback imediato (não precisa esperar servidor)
- Melhor UX

**Por que validação backend?**
- Frontend pode ser burlado (Postman, curl, etc.)
- Backend é fonte da verdade

---

## 📦 FASE 4: Lotes e Amostras

### Arquivo 13: `backend/src/routes/lote.ts`

**O que faz:** Rotas para gerenciar lotes.

**O que é um Lote?**
- Agrupa múltiplas amostras de um mesmo cliente
- Tem status financeiro (pago/pendente)
- Define quais tipos de análise serão feitos (Rotina, Micronutrientes, etc.)

**Rota CREATE:**
```typescript
router.post('/', async (req, res) => {
  const data = createLoteSchema.parse(req.body)
  
  // Inicia transação
  await db.query('BEGIN')
  
  try {
    // 1. Cria lote
    const loteResult = await db.queries.lotes.create({
      clienteId: data.clienteId,
      tiposAnalise: data.tiposAnalise, // ['rotina', 'micronutrientes']
      status: 'pendente'
    })
    
    // 2. Cria amostras (se vieram no body)
    if (data.amostras && data.amostras.length > 0) {
      for (const amostra of data.amostras) {
        await db.queries.amostras.create({
          loteId: loteResult.rows[0].id,
          codigo: amostra.codigo,
          identificacao: amostra.identificacao,
          // ...
        })
      }
    }
    
    await db.query('COMMIT')
    res.json(loteResult.rows[0])
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
})
```

**Transação SQL:**
- `BEGIN`: Inicia transação
- `COMMIT`: Confirma todas as operações
- `ROLLBACK`: Reverte todas as operações se houver erro

**Por que transação?**
- Se criar lote mas falhar ao criar amostras, lote fica "órfão" (inconsistência)
- Com transação: ou tudo salva, ou nada salva
- **Atomicidade**: Operação é atômica (indivisível)

**Exemplo de problema sem transação:**
```
1. Cria lote ✅
2. Tenta criar amostra 1 ✅
3. Tenta criar amostra 2 ❌ (erro)
Resultado: Lote criado mas só tem 1 amostra (inconsistente!)
```

**Com transação:**
```
1. BEGIN
2. Cria lote ✅
3. Tenta criar amostra 1 ✅
4. Tenta criar amostra 2 ❌ (erro)
5. ROLLBACK
Resultado: Nada foi salvo (consistente!)
```

---

### Arquivo 14: `frontend/src/pages/Lotes.tsx`

**Similar ao Clientes.tsx, mas para lotes.**

**Funcionalidades:**
- Lista lotes
- Filtro por status (pago/pendente)
- Filtro por cliente
- Criar novo lote
- Ver detalhes do lote

---

## 🧪 FASE 5: Resultados e Cálculos

### Arquivo 15: `backend/src/utils/calculosResultados.ts`

**O que faz:** Calcula valores derivados (SB, CTC, V, m) baseado em valores brutos.

**Função principal:**
```typescript
export function calcularResultadosDerivados(resultados: Resultado[]) {
  // Busca valores brutos
  const ca = resultados.find(r => r.tipo === 'Ca')?.valor
  const mg = resultados.find(r => r.tipo === 'Mg')?.valor
  const k = resultados.find(r => r.tipo === 'K')?.valor
  const na = resultados.find(r => r.tipo === 'Na')?.valor
  const al = resultados.find(r => r.tipo === 'Al')?.valor
  const h_al = resultados.find(r => r.tipo === 'H+Al')?.valor

  // Calcula SB (Soma de Bases)
  const SB = (parseFloat(ca) || 0) + 
             (parseFloat(mg) || 0) + 
             (parseFloat(k) || 0) + 
             (parseFloat(na) || 0)

  // Calcula t (CTC Efetiva)
  const t = SB + (parseFloat(al) || 0)

  // Calcula T (CTC Total)
  const T = SB + (parseFloat(h_al) || 0)

  // Calcula V% (Saturação de Bases)
  const V = T > 0 ? (SB / T) * 100 : 0

  // Calcula m% (Saturação de Alumínio)
  const m = t > 0 ? ((parseFloat(al) || 0) / t) * 100 : 0

  return {
    SB: SB.toFixed(2),
    t: t.toFixed(2),
    T: T.toFixed(2),
    V: V.toFixed(2),
    m: m.toFixed(2)
  }
}
```

**Por que calcular no backend?**
- Garante que cálculos são sempre corretos
- Frontend pode ter bugs
- Usuário pode modificar código do frontend (DevTools)
- Backend é fonte da verdade

**Quando calcula?**
- Ao salvar resultado novo
- Ao atualizar resultado existente
- Ao gerar laudo (recalcula tudo para garantir)

---

### Arquivo 16: `backend/src/routes/resultado.ts`

**Rota para salvar resultados em lote:**
```typescript
router.post('/lote', async (req, res) => {
  const { resultados } = req.body // Array de resultados
  
  await db.query('BEGIN')
  
  try {
    for (const resultadoData of resultados) {
      // Valida cada resultado
      const data = createResultadoSchema.parse(resultadoData)
      
      // Salva ou atualiza (upsert)
      await db.queries.resultados.upsert(data)
      
      // Busca todos os resultados da amostra
      const todosResultados = await db.queries.resultados.findByAmostraId(data.amostraId)
      
      // Calcula valores derivados
      const derivados = calcularResultadosDerivados(todosResultados)
      
      // Salva valores derivados
      await db.queries.resultados.upsertDerivados(data.amostraId, derivados)
    }
    
    await db.query('COMMIT')
    res.json({ success: true, count: resultados.length })
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
})
```

**Fluxo:**
1. Recebe array de resultados
2. Para cada resultado:
   - Valida dados
   - Salva no banco
   - Busca todos os resultados da amostra
   - Calcula valores derivados
   - Salva valores derivados
3. Se tudo OK, commita transação
4. Se erro, faz rollback

**Por que calcular após salvar?**
- Valores derivados dependem de TODOS os resultados da amostra
- Exemplo: SB precisa de Ca, Mg, K, Na
- Se salvar só Ca, SB ainda não pode ser calculado
- Após salvar todos, recalcula tudo

---

## 📄 FASE 6: Geração de Laudos

### Arquivo 17: `backend/src/routes/laudo.ts`

**Rota para gerar PDF:**
```typescript
router.post('/gerar', async (req, res) => {
  const { loteId } = req.body
  
  // 1. Busca dados
  const lote = await db.queries.lotes.findById(loteId)
  const cliente = await db.queries.clientes.findById(lote.clienteId)
  const amostras = await db.queries.amostras.findByLoteId(loteId)
  
  // 2. Para cada amostra, busca resultados
  const resultadosCompletos = []
  for (const amostra of amostras) {
    const resultados = await db.queries.resultados.findByAmostraId(amostra.id)
    resultadosCompletos.push({ amostra, resultados })
  }
  
  // 3. Gera HTML
  const html = gerarHTMLLaudo(cliente, lote, resultadosCompletos)
  
  // 4. Converte para PDF
  const pdf = await htmlParaPDF(html)
  
  // 5. Retorna PDF
  res.setHeader('Content-Type', 'application/pdf')
  res.send(pdf)
})
```

**Função `htmlParaPDF`:**
```typescript
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

async function htmlParaPDF(html: string) {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    args: chromium.args
  })
  
  const page = await browser.newPage()
  await page.setContent(html)
  const pdf = await page.pdf({ format: 'A4' })
  
  await browser.close()
  return pdf
}
```

**Por que Puppeteer?**
- Renderiza HTML como navegador real
- Suporta CSS avançado (flexbox, grid, etc.)
- Alternativas (html-pdf) têm limitações

**Por que chromium no Vercel?**
- Vercel é serverless (sem sistema operacional completo)
- `@sparticuz/chromium` é Chromium compilado para Lambda
- Permite usar Puppeteer em ambiente serverless

---

## 🎯 Resumo do Fluxo Completo

1. **Setup**: package.json, conexão com banco
2. **Autenticação**: Login, JWT, proteção de rotas
3. **CRUD Clientes**: Criar, listar, editar, deletar
4. **Lotes e Amostras**: Agrupar amostras, relacionamentos
5. **Resultados**: Salvar dados, cálculos automáticos
6. **Laudos**: Gerar PDF com dados completos

---

**Este documento cobre o fluxo sequencial. Para aprofundar em qualquer arquivo específico, posso criar explicações detalhadas linha por linha!**

