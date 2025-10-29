-- Adicionar colunas para Determinação F (Foliar) na tabela resultados
-- Estas colunas são necessárias para salvar os dados da determinação do fator F

ALTER TABLE resultados 
ADD COLUMN IF NOT EXISTS "massaTrisR1" DECIMAL,
ADD COLUMN IF NOT EXISTS "massaTrisR2" DECIMAL,
ADD COLUMN IF NOT EXISTS "massaTrisR3" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR1" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR2" DECIMAL,
ADD COLUMN IF NOT EXISTS "volumeTitR3" DECIMAL;

