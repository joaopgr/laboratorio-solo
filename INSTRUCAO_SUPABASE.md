# 🔗 Obter URL Correta do Supabase para Vercel

## ❌ NÃO USE ESSA URL:
```
postgresql://postgres:[YOUR_PASSWORD]@db.jahlbcqgowaxdptslula.supabase.co:5432/postgres
```
↑ Esta é conexão **DIRETA** - não funciona no Vercel!

---

## ✅ USE ESTA URL (POOLER):

1. **Acesse o Dashboard do Supabase:**
   - https://supabase.com/dashboard/project/jahlbcqgowaxdptslula

2. **Vá em: Settings → Database**

3. **Role para baixo até "Connection string"**

4. **Selecione a aba "Connection pooling"**

5. **Modo: Transaction**
   - Use a string que começa com `postgres://` ou `postgresql://`

6. **Copie a URL completa**

Deve ser algo assim:
```
postgresql://postgres:LaboratorioSolo@db.jahlbcqgowaxdptslula.supabase.co:5432/postgres?pgbouncer=true
```

Ou:
```
postgresql://postgres.jahlbcqgowaxdptslula:LaboratorioSolo@aws-0-south-america-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 📝 IMPORTANTE:

- **Porta 5432**: Conexão direta (NÃO funciona no Vercel)
- **Porta 6543 + pooler**: Connection pooling (FUNCIONA no Vercel)

---

## 🚀 Depois de Pegar a URL:

1. **Vercel Dashboard** → Projeto backend
2. **Settings** → Environment Variables
3. Edite `DATABASE_URL` com a URL do **Connection Pooling**
4. Salve
5. Redeploy

---

**Acesse o Supabase e pegue a URL do Connection Pooling!**

