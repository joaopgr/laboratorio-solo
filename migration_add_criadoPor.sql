-- Script SQL para adicionar coluna "criadoPor" na tabela atividades
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna "criadoPor" na tabela atividades
ALTER TABLE atividades 
ADD COLUMN IF NOT EXISTS "criadoPor" VARCHAR(255);

-- Comentário na coluna para documentação
COMMENT ON COLUMN atividades."criadoPor" IS 'Nome do usuário que criou a atividade';

-- Criar índice para melhorar performance nas consultas por criador
CREATE INDEX IF NOT EXISTS idx_atividades_criadoPor ON atividades("criadoPor");

