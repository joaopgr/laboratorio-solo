-- Adicionar colunas faltantes para análise foliar na tabela resultados
-- Estas colunas são necessárias para salvar os resultados de Ca, Mg, K, P, S, Fe, Cu, Zn, Mn, B, N

ALTER TABLE resultados 
-- Campos de Boro (Foliar) - IMPORTANTE: incluir massaBFoliar que estava faltando!
ADD COLUMN IF NOT EXISTS "massaBFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "diluicaoBFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "brancoBFoliar" DECIMAL,
-- Campos específicos para Boro foliar (usando nomes do backend: dilB e brancoB)
ADD COLUMN IF NOT EXISTS "dilB" DECIMAL,
ADD COLUMN IF NOT EXISTS "brancoB" DECIMAL,

-- Campos de Nitrogênio (Foliar) - IMPORTANTE: incluir todos os campos de N que estavam faltando!
ADD COLUMN IF NOT EXISTS "massaN" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeN" DECIMAL,
ADD COLUMN IF NOT EXISTS "brancoN" DECIMAL,
ADD COLUMN IF NOT EXISTS "fatorF" DECIMAL,

-- Campos específicos para nutrientes foliares (valores calculados)
ADD COLUMN IF NOT EXISTS "caMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "mgMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "kMgLFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "pAbsFoliar" DECIMAL,
ADD COLUMN IF NOT EXISTS "sAbsFoliar" DECIMAL,

-- Campos de micronutrientes (também usados em foliar e solo)
ADD COLUMN IF NOT EXISTS "fe" DECIMAL,
ADD COLUMN IF NOT EXISTS "zn" DECIMAL,
ADD COLUMN IF NOT EXISTS "cu" DECIMAL,
ADD COLUMN IF NOT EXISTS "mn" DECIMAL,
ADD COLUMN IF NOT EXISTS "b" DECIMAL,

-- Campos da Determinação F (já adicionados no script anterior, mas incluindo aqui para garantir)
ADD COLUMN IF NOT EXISTS "massaTrisR1" DECIMAL,
ADD COLUMN IF NOT EXISTS "massaTrisR2" DECIMAL,
ADD COLUMN IF NOT EXISTS "massaTrisR3" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR1" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR2" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR3" DECIMAL,

-- Campos de análise de solo (pode ser usado também)
ADD COLUMN IF NOT EXISTS "ph" DECIMAL,
ADD COLUMN IF NOT EXISTS "pAbs" DECIMAL,
ADD COLUMN IF NOT EXISTS "naMgL" DECIMAL,
ADD COLUMN IF NOT EXISTS "kMgL" DECIMAL,
ADD COLUMN IF NOT EXISTS "alCmol" DECIMAL,
ADD COLUMN IF NOT EXISTS "hAl" DECIMAL,
ADD COLUMN IF NOT EXISTS "s" DECIMAL,
ADD COLUMN IF NOT EXISTS "mo" DECIMAL;

