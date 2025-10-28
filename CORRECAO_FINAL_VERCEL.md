# 🔧 CORREÇÃO FINAL - Conexão com Supabase

## ❌ PROBLEMA IDENTIFICADO

O erro `ENOTFOUND db.jahlbcqgowaxdptslula.supabase.co` acontece porque:

1. A URL atual usa porta **5432** (PostgreSQL direto)
2. No Vercel, precisamos usar porta **6543** (Pooler do Supabase)
3. Ou usar a conexão pooler correta

## ✅ SOLUÇÃO

### No Vercel Dashboard:

1. Acesse: https://vercel.com/dashboard
2. Abra o projeto **backend**
3. Vá em **Settings** → **Environment Variables**
4. **EDITE** a variável `DATABASE_URL` para:

```bash
postgresql://postgres.LaboratorioSolo:LaboratorioSolo@db.jahlbcqgowaxdptslula.supabase.co:6543/postgres
```

**DIFERENÇA:**
- ❌ Antiga: porta `5432`
- ✅ Nova: porta `6543` (pooler do Supabase)

5. **SALVE** a alteração
6. Vá em **Deployments**
7. Clique nos **"..."** do último deployment
8. Selecione **"Redeploy"**

## 📝 Formato Correto da URL

```
postgresql://postgres.[senha]:[senha]@[host]:6543/postgres
```

Importante: A porta **6543** é o pooler do Supabase que permite conexões temporárias (ideal para serverless).

## 🔍 Verificar Conexão

Após o redeploy, teste:

```
https://laboratorio-solo-backend.vercel.app/api/health
```

Se retornar status OK, está funcionando!

---

**ALTERE A VARIÁVEL E FAÇA REDEPLOY!**

