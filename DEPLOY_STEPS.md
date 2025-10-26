# 🚀 Passo a Passo - Deploy do Sistema

## ✅ O que já está pronto:

1. ✅ **Projeto sem Prisma** - Usa PostgreSQL direto
2. ✅ **Arquivos de configuração criados**:
   - `.gitignore` - Ignora arquivos desnecessários
   - `vercel.json` - Configuração do Vercel
   - `README_DEPLOY.md` - Guia completo de deploy
   - `backend/env.example` - Exemplo de variáveis de ambiente

## 📝 Próximos Passos:

### **1️⃣ Configurar Supabase (Banco de Dados)**

#### Passo 1.1: Criar projeto no Supabase
1. Acesse https://supabase.com
2. Crie uma conta gratuita
3. Clique em "New Project"
4. Configure:
   - Nome: `laboratorio-solo`
   - Senha do banco: **ANOTE A SENHA!**
   - Region: mais próximo do Brasil
5. Clique em "Create new project"
6. Aguarde ~2 minutos criar

#### Passo 1.2: Obter URL de conexão
1. Vá em **Settings** → **Database**
2. Role até "Connection string"
3. Selecione a aba **URI**
4. Copie a URL (ex: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)
5. **Substitua `[password]` pela senha que você criou**

#### Passo 1.3: Criar tabelas no Supabase
1. Vá em **SQL Editor**
2. Execute o script SQL para criar as tabelas

### **2️⃣ Preparar Repositório Git**

#### Passo 2.1: Criar repositório no GitHub
1. Acesse https://github.com
2. Clique em **New repository**
3. Nome: `laboratorio-solo`
4. Deixe **público** (ou privado, como preferir)
5. Clique em **Create repository**

#### Passo 2.2: Fazer commit inicial
Execute no PowerShell na pasta do projeto:

```powershell
# Ir para a pasta do projeto
cd C:\xampp\htdocs\lab

# Inicializar git
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Initial commit - Sistema Laboratório Solo"

# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/laboratorio-solo.git

# Enviar para GitHub
git push -u origin main
```

### **3️⃣ Deploy no Vercel**

#### Passo 3.1: Conectar backend
1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em **Add New** → **Project**
4. Importe seu repositório `laboratorio-solo`
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Passo 3.2: Adicionar variáveis de ambiente
No Vercel, vá em **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://postgres.SENHA@aws-0.xxx.supabase.co:6543/postgres
JWT_SECRET=sua_secret_key_forte_aqui_gere_uma_aleatoria
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app
```

**Importante**: Gere um JWT_SECRET forte (pode usar: https://www.uuidgenerator.net/)

#### Passo 3.3: Fazer deploy
1. Clique em **Deploy**
2. Aguarde o build terminar
3. Anote a URL: `https://laboratorio-solo-backend.vercel.app`

### **4️⃣ Deploy do Frontend no Vercel**

#### Passo 4.1: Criar novo projeto
1. No Vercel, clique em **Add New** → **Project**
2. Importe o **mesmo repositório** (`laboratorio-solo`)
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Passo 4.2: Adicionar variáveis de ambiente
```
VITE_API_URL=https://seu-backend.vercel.app/api
```

**⚠️ IMPORTANTE**: Use a URL do backend que você anotou no passo 3.3

#### Passo 4.3: Fazer deploy
1. Clique em **Deploy**
2. Aguarde terminar
3. Anote a URL: `https://laboratorio-solo-frontend.vercel.app`

### **5️⃣ Ajustar URLs**

#### Passo 5.1: Atualizar CORS do Backend
1. Volte no projeto do **backend** no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Edite `FRONTEND_URL` para: `https://seu-frontend.vercel.app`
4. Clique em **Redeploy**

### **6️⃣ Testar**

1. Acesse a URL do frontend
2. Teste login com:
   - Email: `admin@laboratorio.com`
   - Senha: `admin123`

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correto no Vercel
- Confirme que substituiu `[password]` pela senha real

### Erro de build
- Verifique os logs no Vercel
- Confirme que todas as dependências estão no `package.json`

### Erro de CORS
- Certifique-se que `FRONTEND_URL` está com a URL correta (sem `/` no final)
- Faça redeploy do backend após mudar

## 📞 Próximos passos:

1. **Criar script SQL** para as tabelas do Supabase
2. **Testar localmente** com Supabase
3. **Preparar seed** para popular dados iniciais

**Avisa quando quiser continuar!** 🚀

