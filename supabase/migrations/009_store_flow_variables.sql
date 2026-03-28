-- Store Flow Variables: tabelas para o Scraper de Inteligência do Varejo

CREATE TABLE IF NOT EXISTS public.store_flow_variables (
  id BIGSERIAL PRIMARY KEY,
  loja_id TEXT NOT NULL,
  variable_code TEXT NOT NULL,
  variable_value NUMERIC(10,3),
  raw_value NUMERIC(15,6),
  unit TEXT,
  source TEXT,
  collected_at TIMESTAMP NOT NULL,
  impact_weight NUMERIC(5,4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(loja_id, variable_code, collected_at)
);

CREATE INDEX IF NOT EXISTS idx_store_flow_loja ON public.store_flow_variables(loja_id);
CREATE INDEX IF NOT EXISTS idx_store_flow_code ON public.store_flow_variables(variable_code);
CREATE INDEX IF NOT EXISTS idx_store_flow_time ON public.store_flow_variables(collected_at DESC);

CREATE TABLE IF NOT EXISTS public.variable_metadata (
  id BIGSERIAL PRIMARY KEY,
  variable_code TEXT UNIQUE NOT NULL,
  variable_name TEXT,
  description TEXT,
  category TEXT,
  min_range NUMERIC(15,6),
  max_range NUMERIC(15,6),
  unit_original TEXT,
  unit_normalized TEXT DEFAULT '0-100',
  source_type TEXT,
  refresh_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_var_meta_category ON public.variable_metadata(category);

CREATE TABLE IF NOT EXISTS public.scraper_logs (
  id BIGSERIAL PRIMARY KEY,
  scraper_name TEXT,
  source_api TEXT,
  status TEXT,
  variables_collected INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_time ON public.scraper_logs(executed_at DESC);

-- RLS: service_role tem acesso total, anon não acessa
ALTER TABLE public.store_flow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Permitir leitura autenticada
CREATE POLICY "store_flow_read" ON public.store_flow_variables FOR SELECT USING (true);
CREATE POLICY "var_meta_read" ON public.variable_metadata FOR SELECT USING (true);
CREATE POLICY "scraper_logs_read" ON public.scraper_logs FOR SELECT USING (auth.role() = 'authenticated');
