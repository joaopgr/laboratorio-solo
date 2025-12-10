# Migration: Adicionar Colunas Granulométricas

## Problema
Ao tentar salvar dados granulométricos, ocorre o erro:
```
column "massaRecipienteAreiaGrossa" of relation "resultados" does not exist
```

## Solução
Execute o seguinte SQL no banco de dados de produção:

```sql
-- Adicionar colunas granulométricas à tabela resultados
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipienteAreiaGrossa" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipienteAreiaFina" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipienteSilteArgila" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipienteArgila" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipientePartAreiaGrossa" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipientePartAreiaFina" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipientePartSilteArgila" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaRecipientePartArgila" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS tfsa double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaLata" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaLataSu" double precision;
ALTER TABLE resultados ADD COLUMN IF NOT EXISTS "massaLataSs" double precision;
```

## Como executar no Vercel/Supabase

1. Acesse o painel do Supabase (ou seu banco de dados)
2. Vá em SQL Editor
3. Cole o SQL acima
4. Execute

Ou via psql:
```bash
psql $DATABASE_URL -f backend/src/scripts/add_granulometric_columns.sql
```

