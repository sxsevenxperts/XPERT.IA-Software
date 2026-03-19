-- Customizable workflow actions per user (subscription)
-- Each user can toggle actions to be executed after qualification and on conversation ending

CREATE TABLE IF NOT EXISTS public.workflow_acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- After qualification actions (qualificado = true)
  enviar_relatorio BOOLEAN DEFAULT true,          -- Send conversation report to WhatsApp attendant/group
  criar_tarefa_crm BOOLEAN DEFAULT false,         -- Create CRM task for follow-up
  agendar_follow_up BOOLEAN DEFAULT false,        -- Schedule automatic follow-up
  dias_follow_up INT DEFAULT 3,                   -- Days until follow-up is scheduled
  adicionar_tag_qualificado BOOLEAN DEFAULT false,-- Add custom tag to lead
  tag_qualificado TEXT,                           -- Custom tag for qualified leads
  
  -- On conversation ending actions (fim_atendimento = true OR qualificado = false)
  enviar_pesquisa_satisfacao BOOLEAN DEFAULT false, -- Send satisfaction survey
  remover_lista_ativa BOOLEAN DEFAULT false,      -- Soft-delete from active list
  adicionar_tag_encerramento BOOLEAN DEFAULT false,-- Add custom tag on ending
  tag_encerramento TEXT,                          -- Custom tag for ending
  
  -- Multi-tenancy & audit
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS on workflow_acoes
ALTER TABLE public.workflow_acoes ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see/modify their own workflow actions
CREATE POLICY "workflow_acoes_own" 
  ON public.workflow_acoes 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: Admins can see all
CREATE POLICY "workflow_acoes_admin" 
  ON public.workflow_acoes 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Table to store dynamically added tags to leads
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on lead_tags
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only see tags on their own leads
CREATE POLICY "lead_tags_own" 
  ON public.lead_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE id = lead_id AND user_id = auth.uid()
    )
  );

-- RLS: Admins can see all tags
CREATE POLICY "lead_tags_admin" 
  ON public.lead_tags 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RPC: Fetch workflow actions for current user
CREATE OR REPLACE FUNCTION public.buscar_acoes_workflow(p_user_id UUID)
RETURNS TABLE (
  enviar_relatorio BOOLEAN,
  criar_tarefa_crm BOOLEAN,
  agendar_follow_up BOOLEAN,
  dias_follow_up INT,
  adicionar_tag_qualificado BOOLEAN,
  tag_qualificado TEXT,
  enviar_pesquisa_satisfacao BOOLEAN,
  remover_lista_ativa BOOLEAN,
  adicionar_tag_encerramento BOOLEAN,
  tag_encerramento TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.enviar_relatorio,
    wa.criar_tarefa_crm,
    wa.agendar_follow_up,
    wa.dias_follow_up,
    wa.adicionar_tag_qualificado,
    wa.tag_qualificado,
    wa.enviar_pesquisa_satisfacao,
    wa.remover_lista_ativa,
    wa.adicionar_tag_encerramento,
    wa.tag_encerramento
  FROM public.workflow_acoes wa
  WHERE wa.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Add tag to a lead
CREATE OR REPLACE FUNCTION public.adicionar_tag_lead(p_lead_id UUID, p_tag TEXT)
RETURNS UUID AS $$
DECLARE
  v_tag_id UUID;
BEGIN
  INSERT INTO public.lead_tags (lead_id, tag)
  VALUES (p_lead_id, p_tag)
  RETURNING id INTO v_tag_id;
  
  RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get all tags for a lead
CREATE OR REPLACE FUNCTION public.obter_tags_lead(p_lead_id UUID)
RETURNS TABLE (tag TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT lt.tag
  FROM public.lead_tags lt
  WHERE lt.lead_id = p_lead_id
  ORDER BY lt.criado_em ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create default workflow_acoes row when user is created
CREATE OR REPLACE FUNCTION public.criar_workflow_acoes_padrao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workflow_acoes (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplicates
DROP TRIGGER IF EXISTS trigger_criar_workflow_acoes ON auth.users;

-- Create trigger
CREATE TRIGGER trigger_criar_workflow_acoes
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_workflow_acoes_padrao();
