-- Adicionar localização às lojas para scraper local
ALTER TABLE public.lojas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
