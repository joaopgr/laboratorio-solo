# 🛠️ Correção do Deploy no Vercel

## 🔍 Problemas Identificados

O sistema estava apresentando erros 500 em todas as rotas no Vercel devido a:
1. Configuração incorreta de serverless functions
2. Import de arquivos não compilados
3. Falta da dependência `@vercel/node`

## ✅ Correções Aplicadas

### 1. **Adicionado `@vercel/node` ao package.json**
```json
"@vercel/node": "^3.0.7"
```

### 2. **Corrigido `backend/api/index.ts`**
Agora importa diretamente do source (`../src/index`) permitindo que o Vercel compile automaticamente:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index';

export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
```

### 3. **Ajustado `backend/vercel.json`**
Configurado para usar serverless functions com runtime do Vercel:
```json
{
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### 4. **Atualizado `backend/tsconfig.json`**
- Incluída pasta `api/**/*` nos arquivos a compilar
- Removido `rootDir` para permitir compilação de múltiplas pastas

## 🚀 Próximos Passos para Deploy

### 1. Instalar dependências
```bash
cd backend
npm install
```

### 2. Fazer commit das alterações
```bash
git add .
git commit -m "Fix: Corrigir deploy no Vercel - serverless functions"
git push
```

### 3. No Vercel Dashboard

**IMPORTANTE:** Use a configuração manual do projeto backend:

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto backend
3. Vá em **Settings** → **General**
4. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Environment Variables** (Settings → Environment Variables):
   ```
   DATABASE_URL=postgresql://postgres:LaboratorioSolo@db.jahlbcqgowaxdptslula.supabase.co:5432/postgres
   JWT_SECRET=LaboratorioSolo2025_JWT_Secret_Forte
   NODE_ENV=production
   FRONTEND_URL=https://laboratorio-solo-frontend.vercel.app
   ```

### 4. Fazer Redeploy
1. Vá em **Deployments**
2. Clique nos **"..."** do deployment mais recente
3. Selecione **"Redeploy"**

### 5. Testar
Após o deploy, teste:
```
https://laboratorio-solo-backend.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "...",
  "environment": "production"
}
```

## 📝 Verificações

Após o deploy, verifique os logs no Vercel:
1. Acesse **Deployments** → Clique no deployment → **Functions**
2. Verifique se não há erros na execução

Se ainda houver erros:
1. Abra os logs e copie a mensagem de erro
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Confirme que `DATABASE_URL` está correto
4. Verifique se o Supabase está acessível

## ⚠️ Problemas Comuns

### Erro: "Cannot find module '../src/index'"
- **Causa**: O TypeScript não está sendo compilado pelo Vercel
- **Solução**: Verifique se o "Build Command" está como `npm run build`

### Erro: "Database connection failed"
- **Causa**: `DATABASE_URL` incorreto ou banco inacessível
- **Solução**: Verifique a URL no Vercel e teste a conexão

### Erro: "CORS policy"
- **Causa**: `FRONTEND_URL` não está configurado ou incorreto
- **Solução**: Atualize `FRONTEND_URL` sem barra no final

---

**Status**: ✅ Correções aplicadas - Pronto para deploy
