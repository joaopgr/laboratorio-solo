-- Adicionar colunas faltantes para análise foliar na tabela resultados
-- Estas colunas são necessárias para salvar os resultados de Ca, Mg, K, P, S, Fe, Cu, Zn, Mn, B

ALTER TABLE resultados 
-- Campos específicos para nutrientes foliares (valores calculados)
ADD COLUMN IF NOT EXISTS "caMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "mgMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "kMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "pAbsFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "sAbsFoliar" DECIMAL,

-- Campos de micronutrientes (também usados em foliar)
ADD COLUMN IF NOT EXISTS "fe" DECIMAL,
ADD COLUMN IF NOT EXISTS "zn" DECIMAL,
ADD COLUMN IF NOT EXISTS "cu" DECIMAL,
ADD COLUMN IF NOT EXISTS "mn" DECIMAL,
ADD COLUMN IF NOT EXISTS "b" DECIMAL,

-- Campos de Boro foliar (usando nomes do backend: dilB e brancoB)
ADD COLUMN IF NOT EXISTS "dilB" DECIMAL,
ADD COLUMN IF NOT EXISTS "brancoB" DECIMAL;

