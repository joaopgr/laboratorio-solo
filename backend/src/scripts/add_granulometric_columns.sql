-- Migration: Adicionar campos granulométricos à tabela resultados
-- Data: 2025-01-10
-- Descrição: Adiciona colunas para armazenar dados granulométricos

-- Verificar e adicionar colunas granulométricas se não existirem
DO $$ 
BEGIN
    -- Campos de massa dos recipientes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipienteAreiaGrossa') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipienteAreiaGrossa" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipienteAreiaFina') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipienteAreiaFina" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipienteSilteArgila') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipienteSilteArgila" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipienteArgila') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipienteArgila" double precision;
    END IF;
    
    -- Campos de massa dos recipientes + partículas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipientePartAreiaGrossa') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipientePartAreiaGrossa" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipientePartAreiaFina') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipientePartAreiaFina" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipientePartSilteArgila') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipientePartSilteArgila" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaRecipientePartArgila') THEN
        ALTER TABLE resultados ADD COLUMN "massaRecipientePartArgila" double precision;
    END IF;
    
    -- Campo TFSA (já existe no schema, mas verificando)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'tfsa') THEN
        ALTER TABLE resultados ADD COLUMN tfsa double precision;
    END IF;
    
    -- Campos de massa para o fator F
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaLata') THEN
        ALTER TABLE resultados ADD COLUMN "massaLata" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaLataSu') THEN
        ALTER TABLE resultados ADD COLUMN "massaLataSu" double precision;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resultados' AND column_name = 'massaLataSs') THEN
        ALTER TABLE resultados ADD COLUMN "massaLataSs" double precision;
    END IF;
END $$;

