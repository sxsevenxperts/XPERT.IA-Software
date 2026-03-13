-- Migration: Trigger para auto-criar leads quando nova sessão é criada
-- Quando um contato envia primeira mensagem (nova sessão), cria automaticamente um lead em "novo_contato"

CREATE OR REPLACE FUNCTION criar_lead_ao_receber_sessao()
RETURNS TRIGGER AS $$
DECLARE
  lead_count INT;
BEGIN
  -- Verifica se já existe um lead com esse numero_whatsapp para este user
  SELECT COUNT(*) INTO lead_count
  FROM leads
  WHERE numero_whatsapp = NEW.numero_whatsapp
    AND user_id = NEW.user_id;

  -- Se não existe, cria novo lead em "novo_contato"
  IF lead_count = 0 THEN
    INSERT INTO leads (
      user_id,
      numero_whatsapp,
      stage,
      atualizado_em
    ) VALUES (
      NEW.user_id,
      NEW.numero_whatsapp,
      'novo_contato',
      NOW()
    );
    
    RAISE LOG 'Lead criado automaticamente: % para user %', NEW.numero_whatsapp, NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger anterior se existir
DROP TRIGGER IF EXISTS trigger_criar_lead_ao_receber_sessao ON sessoes;

-- Cria trigger que dispara ao inserir nova sessão
CREATE TRIGGER trigger_criar_lead_ao_receber_sessao
AFTER INSERT ON sessoes
FOR EACH ROW
EXECUTE FUNCTION criar_lead_ao_receber_sessao();

GRANT EXECUTE ON FUNCTION criar_lead_ao_receber_sessao TO service_role;
