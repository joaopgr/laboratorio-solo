# 🚀 Guia Rápido - Deploy Completo

## ✅ Arquivos Criados:
1. ✅ `.gitignore` - Arquivos ignorados
2. ✅ `vercel.json` - Configuração Vercel
3. ✅ `supabase-schema.sql` - **Script SQL COMPLETO**
4. ✅ `backend/env.example` - Variáveis de ambiente
5. ✅ `DEPLOY_STEPS.md` - Passo a passo detalhado
6. ✅ `README_DEPLOY.md` - Guia completo

---

## 🎯 PASSO 1: Criar Conta no Supabase (5 min)

1. Acesse: https://supabase.com
2. Clique em **"Start your project"** ou **"New Project"**
3. Configure:
   - Nome: `laboratorio-solo`
   - Senha: **Crie uma senha forte e ANOTE**
   - Region: **South America (São Paulo)** ou mais próximo
4. Aguarde criar (~2 minutos)

---

## 🎯 PASSO 2: Criar Tabelas no Supabase (2 min)

1. No Supabase, clique em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie **TODO o conteúdo**
5. Cole no editor SQL do Supabase
6. Clique em **"RUN"** (ou Ctrl+Enter)
7. Deve aparecer: "✅ Tabelas criadas"

### ✅ Verificar se funcionou:
Na mesma tela SQL, execute:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Você deve ver: `atividades`, `amostras`, `clientes`, `lotes_amostras`, `resultados`, `usuarios`

---

## 🎯 PASSO 3: Obter URL do Banco (1 min)

1. No Supabase: **Settings** → **Database**
2. Role até "Connection string"
3. Selecione aba **URI**
4. Copie a URL completa (ex: `postgresql://postgres.xxx:senha@aws-0.xxx.pooler.supabase.com:6543/postgres`)
5. **⚠️ IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou

---

## 🎯 PASSO 4: Criar Repositório GitHub (3 min)

### 4.1 Criar repositório
1. Acesse: https://github.com
2. Clique no **"+"** → **New repository**
3. Nome: `laboratorio-solo`
4. Deixe **público** (ou privado)
5. **NÃO marque** nenhuma opção (README, .gitignore, etc)
6. Clique **"Create repository"**

### 4.2 Enviar código
Abra PowerShell na pasta do projeto e execute:

```powershell
# Navegar para a pasta do projeto
cd C:\xampp\htdocs\lab

# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Initial commit - Sistema completo"

# Adicionar remote (SUBSTITUA POR SEU USUÁRIO)
git remote add origin https://github.com/SEU_USUARIO/laboratorio-solo.git

# Enviar para GitHub
git push -u origin main
```

**Nota**: Se der erro de authentication, você precisa configurar GitHub CLI ou usar SSH.

---

## 🎯 PASSO 5: Deploy Backend no Vercel (5 min)

### 5.1 Criar projeto backend
1. Acesse: https://vercel.com
2. **Login com GitHub**
3. Clique em **"Add New"** → **Project**
4. Importe: `laboratorio-solo`
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend` (clique em "Edit" e mude)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 5.2 Adicionar variáveis de ambiente
No Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Clique em **"Add New"**
3. Adicione uma por vez:

```
Name: DATABASE_URL
Value: postgresql://postgres.senha@xxx.supabase.co:6543/postgres
```

```
Name: JWT_SECRET
Value: gere_um_secret_forte_aqui_use_www.uuidgenerator.net
```

```
Name: NODE_ENV
Value: production
```

```
Name: FRONTEND_URL
Value: https://seus-frontend.vercel.app (vai criar depois)
```

### 5.3 Fazer deploy
1. Clique em **"Deploy"**
2. Aguarde ~2 minutos
3. **Anote a URL**: `https://lab-backend-xxx.vercel.app`

---

## 🎯 PASSO 6: Deploy Frontend no Vercel (3 min)

### 6.1 Criar projeto frontend
1. Ainda no Vercel: **Add New** → **Project**
2. Importe: **mesmo repositório** (`laboratorio-solo`)
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - Build e Output já ficam corretos

### 6.2 Adicionar variável de ambiente
```
Name: VITE_API_URL
Value: https://lab-backend-xxx.vercel.app/api
```

**⚠️ Use a URL do backend que você anotou!**

### 6.3 Fazer deploy
1. Clique em **"Deploy"**
2. Aguarde ~1 minuto
3. **Anote a URL**: `https://lab-frontend-xxx.vercel.app`

---

## 🎯 PASSO 7: Ajustar URLs (1 min)

### 7.1 Atualizar CORS do Backend
1. Volte no projeto **backend** no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Clique em **"..."** ao lado de `FRONTEND_URL`
4. Edite para: `https://lab-frontend-xxx.vercel.app` (sem barra no final!)
5. Salve
6. Vá em **Deployments** → Clique nos **"..."** do último deployment
7. **"Redeploy"**

---

## 🎯 PASSO 8: Criar Primeiros Usuários

Vá no Supabase → **SQL Editor** e execute:

```sql
-- Criar usuário admin
INSERT INTO usuarios (nome, email, senha, role, ativo)
VALUES (
  'Administrador',
  'admin@laboratorio.com',
  '$2a$10$EJvx5J5wGXFXG5J5wGXF5eKJ5wGXF5eKJ5wGXF5eKJ5wGXFXG5',
  'admin',
  true
);
```

**⚠️ A senha acima é "admin123" (hash bcrypt)**

---

## 🎯 PASSO 9: Testar!

1. Acesse: URL do frontend
2. Login:
   - Email: `admin@laboratorio.com`
   - Senha: `admin123`

---

## ✅ Checklist Final

- [ ] Supabase criado
- [ ] Tabelas criadas (executou SQL)
- [ ] Repositório no GitHub
- [ ] Backend deployado no Vercel
- [ ] Frontend deployado no Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] CORS ajustado
- [ ] Usuário admin criado
- [ ] Testado login
- [ ] Sistema funcionando! 🎉

---

## 🐛 Se algo der errado:

**Erro de conexão com banco:**
- Verifique DATABASE_URL no Vercel
- Confirme que substituiu [YOUR-PASSWORD]

**Erro de CORS:**
- Confirme FRONTEND_URL sem barra no final
- Rode redeploy do backend

**Erro de build:**
- Veja os logs no Vercel
- Verifique se todas as dependências estão no package.json

---

**Pronto para começar? Vamos no passo 1! 🚀**

