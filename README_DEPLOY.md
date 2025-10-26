# 🚀 Guia de Deploy - Sistema Laboratório de Solo

## 📋 Pré-requisitos

1. Conta no **Vercel** (https://vercel.com)
2. Conta no **Supabase** (https://supabase.com)
3. Repositório no **GitHub/GitLab**

## 🔧 Passo 1: Configurar Supabase (Banco de Dados)

### 1.1 Criar projeto no Supabase

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Escolha um nome e senha (anote a senha!)
4. Aguarde criar o projeto (~2 minutos)

### 1.2 Obter URL de conexão

1. No dashboard do Supabase, vá em **Settings** → **Database**
2. Copie a **Connection string** (URI)
   - Formato: `postgresql://postgres:[SUA_SENHA]@db.xxxxx.supabase.co:5432/postgres`
3. Substitua `[SUA_SENHA]` pela senha que você criou

### 1.3 Criar tabelas no banco

Acesse **SQL Editor** no Supabase e execute o script SQL para criar as tabelas (você pode pedir para eu criar esse script).

## 🔧 Passo 2: Preparar repositório Git

### 2.1 Criar repositório no GitHub

```bash
git init
git add .
git commit -m "Initial commit - Sistema Laboratório"
git remote add origin https://github.com/seu-usuario/lab-solo.git
git push -u origin main
```

### 2.2 Configurar .env local

```bash
# Copie o .env.example para .env
cp backend/env.example backend/.env

# Edite o .env com as credenciais do Supabase
# DATABASE_URL="postgresql://..."
```

## 🔧 Passo 3: Deploy do Backend no Vercel

### 3.1 Conectar repositório

1. Acesse https://vercel.com
2. Clique em **Add New** → **Project**
3. Importe seu repositório do GitHub
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 Variáveis de Ambiente

No Vercel, adicione as variáveis:
```
DATABASE_URL=postgresql://postgres:senha@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=sua_secret_key_super_forte
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app
```

### 3.3 Deploy

1. Clique em **Deploy**
2. Aguarde o build
3. Anote a URL do backend (ex: `https://lab-backend.vercel.app`)

## 🔧 Passo 4: Deploy do Frontend no Vercel

### 4.1 Criar novo projeto para frontend

1. No Vercel, clique em **Add New** → **Project**
2. Importe o mesmo repositório
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 4.2 Variáveis de Ambiente

Adicione:
```
VITE_API_URL=https://seu-backend.vercel.app/api
```

### 4.3 Deploy

1. Clique em **Deploy**
2. Aguarde o build
3. Anote a URL do frontend (ex: `https://lab-frontend.vercel.app`)

## 🔧 Passo 5: Ajustar URLs

### 5.1 Atualizar CORS do Backend

1. Vá em **Settings** → **Environment Variables** do backend no Vercel
2. Atualize `FRONTEND_URL` para a URL do frontend
3. Rode **Redeploy**

### 5.2 Testar

1. Acesse a URL do frontend
2. Tente fazer login
3. Verifique se está conectando com o banco

## 🛠️ Comandos úteis

```bash
# Instalar dependências
npm run install:all

# Rodar localmente
npm run dev

# Build para produção
npm run build

# Verificar logs do Vercel
vercel logs
```

## 📝 Checklist

- [ ] Supabase configurado com tabelas criadas
- [ ] Repositório Git criado e commitado
- [ ] Backend deployado no Vercel
- [ ] Frontend deployado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] CORS ajustado
- [ ] Testado login e funcionalidades

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correto
- Confirme que o Supabase permite conexões externas

### Erro de build no Vercel
- Verifique se `package.json` tem todos os scripts necessários
- Confirme que Node.js está na versão correta

### Erro de CORS
- Confirme que `FRONTEND_URL` está com a URL correta
- Verifique se está sem `/` no final

## 📞 Suporte

Se tiver problemas, envie:
1. Logs do console do Vercel
2. Screenshot do erro
3. Variáveis de ambiente (sem senhas!)

