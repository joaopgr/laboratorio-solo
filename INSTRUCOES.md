# 🚀 Instruções para Executar o Sistema

## 📋 Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **PostgreSQL** (versão 12 ou superior)
3. **npm** ou **yarn**

## 🛠️ Configuração do Banco de Dados

1. **Instale o PostgreSQL** se ainda não tiver
2. **Crie um banco de dados** chamado `laboratorio_solo`
3. **Anote as credenciais** (usuário, senha, host, porta)

## ⚙️ Configuração do Projeto

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm run install:all
```

### 2. Configurar Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
```bash
cp backend/env.example backend/.env
```

2. **Edite o arquivo `backend/.env`** com suas configurações:
```env
DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/laboratorio_solo"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Configurar o Banco de Dados

```bash
# Gerar o cliente Prisma
cd backend
npx prisma generate

# Executar as migrações
npx prisma migrate dev

# Popular com dados de exemplo (opcional)
npm run db:seed
```

### 4. Executar o Projeto

```bash
# Na raiz do projeto
npm run dev
```

Isso irá iniciar:
- **Backend** na porta 3001
- **Frontend** na porta 3000

## 🌐 Acessar o Sistema

1. **Abra seu navegador** em `http://localhost:3000`
2. **Faça login** com um dos usuários de teste:
   - **Admin:** admin@laboratorio.com / admin123
   - **Analista:** analista@laboratorio.com / analista123

## 📁 Estrutura do Projeto

```
projeto/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── index.ts        # Servidor principal
│   │   └── seed.ts         # Dados de exemplo
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   └── package.json
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Hooks personalizados
│   │   └── services/       # Serviços de API
│   └── package.json
├── shared/                 # Tipos TypeScript compartilhados
└── package.json           # Scripts principais
```

## 🔧 Comandos Úteis

### Backend
```bash
cd backend

# Desenvolvimento
npm run dev

# Build
npm run build

# Banco de dados
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Executar migrações
npm run db:seed           # Popular com dados de exemplo
```

### Frontend
```bash
cd frontend

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 🎯 Funcionalidades Implementadas

### ✅ **Backend (API)**
- [x] Autenticação JWT
- [x] CRUD de Clientes
- [x] CRUD de Amostras
- [x] CRUD de Resultados
- [x] Entrada de resultados em lote
- [x] Validação de dados com Zod
- [x] Relacionamentos entre entidades
- [x] Filtros e paginação

### ✅ **Frontend (React)**
- [x] Interface responsiva
- [x] Autenticação
- [x] Dashboard com estatísticas
- [x] Listagem de clientes, amostras e resultados
- [x] Detalhes de cada entidade
- [x] Filtros e busca
- [x] Navegação intuitiva
- [x] Design baseado no protótipo

### ✅ **Banco de Dados**
- [x] Schema completo com Prisma
- [x] Relacionamentos entre tabelas
- [x] Campos para todos os tipos de análise
- [x] Dados de exemplo para teste

## 🚨 Solução de Problemas

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `psql -h localhost -U seu_usuario -d laboratorio_solo`

### Erro de Porta em Uso
- Mude a porta no arquivo `.env` (backend) ou `vite.config.ts` (frontend)
- Ou mate o processo que está usando a porta

### Erro de Dependências
- Delete as pastas `node_modules` e `package-lock.json`
- Execute `npm install` novamente

## 📞 Suporte

Se encontrar algum problema, verifique:
1. Se todas as dependências estão instaladas
2. Se o banco de dados está configurado corretamente
3. Se as variáveis de ambiente estão corretas
4. Se as portas 3000 e 3001 estão livres

---

**🎉 Pronto! Seu sistema de laboratório de análises de solo está funcionando!**



