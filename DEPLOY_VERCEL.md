# 🚀 Deploy no Vercel - Passo a Passo

## ✅ O QUE JÁ TEMOS:
- [x] Supabase criado ✅
- [x] Tabelas criadas ✅
- [x] Código no GitHub ✅

## 🎯 AGORA: Deploy no Vercel

### PASSO 1: Criar conta no Vercel

1. Acesse: https://vercel.com
2. Clique em **"Sign up"** ou **"Log in"**
3. **Escolha "Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

### PASSO 2: Deploy do BACKEND

1. No Vercel, clique em **"Add New"** → **"Project"**
2. Você verá seu repositório `laboratorio-solo`
3. Clique em **"Import"**

#### 2.1 Configurar o projeto:
```
Framework Preset: Other
Root Directory: backend (clique "Edit" e mude para "backend")
Build Command: npm run build
Install Command: (deixe vazio)
Output Directory: dist
```

#### 2.2 Adicionar variáveis de ambiente (IMPORTANTE!):
Clique em **"Environment Variables"** e adicione:

```
Nome: DATABASE_URL
Valor: postgresql://postgres:LaboratorioSolo@db.jahlbcqgowaxdptslula.supabase.co:5432/postgres
```

```
Nome: JWT_SECRET
Valor: LaboratorioSolo2025_JWT_Secret_Forte
```

```
Nome: NODE_ENV
Valor: production
```

```
Nome: FRONTEND_URL
Valor: https://laboratorio-solo-frontend.vercel.app (vamos criar depois)
```

**⚠️ IMPORTANTE**: A URL do frontend você só vai ter depois, então temporariamente coloque:
```
FRONTEND_URL = http://localhost:3000
```
Depois vamos atualizar!

#### 2.3 Deploy
1. Clique em **"Deploy"**
2. Aguarde ~2 minutos
3. **ANOTE A URL**: Ex: `https://laboratorio-solo-xxx.vercel.app`

### PASSO 3: Deploy do FRONTEND

1. No Vercel, clique em **"Add New"** → **"Project"**
2. Importe o **MESMO repositório** (`laboratorio-solo`)
3. Configure:

```
Framework Preset: Vite
Root Directory: frontend (clique "Edit")
Build Command: npm run build
Install Command: (deixe vazio)
Output Directory: dist
```

#### 3.1 Adicionar variável de ambiente:

```
Nome: VITE_API_URL
Valor: https://laboratorio-solo-xxx.vercel.app/api
```

**⚠️ Use a URL do BACKEND que você anotou!**

#### 3.2 Deploy
1. Clique em **"Deploy"**
2. Aguarde ~1 minuto
3. **ANOTE A URL**: Ex: `https://laboratorio-solo-frontend.vercel.app`

### PASSO 4: Atualizar URLs

#### 4.1 Atualizar CORS do Backend
1. Volte no projeto **BACKEND** no Vercel
2. **Settings** → **Environment Variables**
3. Edite `FRONTEND_URL` para a URL do frontend (sem barra final!)
4. Clique em **"Save"**
5. Vá em **"Deployments"** → **"..."** → **"Redeploy"**

### PASSO 5: Testar!

1. Acesse a URL do frontend
2. Login: `admin@laboratorio.com` / senha: `admin123`
3. Se funcionar, está tudo certo! 🎉

---

## 📋 RESUMO DAS URLs:

### Backend:
- Vercel: https://vercel.com/your-dashboard
- URL: `https://laboratorio-solo-xxx.vercel.app`

### Frontend:
- Vercel: https://vercel.com/your-dashboard  
- URL: `https://laboratorio-solo-frontend.vercel.app`

### Supabase:
- Dashboard: https://supabase.com/dashboard/project/jahlbcqgowaxdptslula
- Database URL: Já configurada nas variáveis

---

## 🐛 Se algo der errado:

**Erro de conexão com banco:**
- Verifique DATABASE_URL no Vercel
- Confirme que usa a URL correta com a senha

**Erro de CORS:**
- Confirme que FRONTEND_URL está correto (sem / no final)
- Faça redeploy do backend

**Erro de build:**
- Veja os logs no Vercel (abre expandindo o deployment)
- Verifique se todas as dependências estão no package.json

---

**AVISA QUANDO CRIAR AS CONTAS NO VERCEL!** 🚀

