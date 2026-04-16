-- ================================================================
-- Migração 010: Cron diário para limpeza de subscrições
-- Executa a Edge Function subscription-cleanup todo dia à meia-noite
-- ================================================================

-- Habilita a extensão pg_cron (disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove job anterior se existir
SELECT cron.unschedule('subscription-cleanup-daily')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'subscription-cleanup-daily'
);

-- Agenda cron: todo dia às 00:05 UTC
SELECT cron.schedule(
  'subscription-cleanup-daily',
  '5 0 * * *',   -- 00:05 UTC todos os dias
  $$
  SELECT
    net.http_post(
      url     := current_setting('app.supabase_url') || '/functions/v1/subscription-cleanup',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ================================================================
-- Alternativa: trigger SQL puro sem pg_cron
-- (caso pg_cron não esteja disponível no plano)
-- ================================================================

-- Função que verifica e suspende usuários (chamada em cada login)
CREATE OR REPLACE FUNCTION check_subscription_status(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_sub   subscriptions%ROWTYPE;
  v_now   timestamptz := now();
  v_days  int;
BEGIN
  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{"active": false, "reason": "not_found"}'::jsonb;
  END IF;

  v_days := EXTRACT(DAY FROM (v_now - v_sub.expires_at));

  -- Expirou há mais de 7 dias → suspende
  IF v_sub.expires_at < v_now AND v_days >= 7 AND v_sub.status != 'suspended' THEN
    UPDATE subscriptions SET status = 'suspended', updated_at = v_now
    WHERE user_id = p_user_id;
    v_sub.status := 'suspended';
  END IF;

  RETURN jsonb_build_object(
    'active',             v_sub.expires_at > v_now AND v_sub.status = 'active',
    'status',             v_sub.status,
    'expires_at',         v_sub.expires_at,
    'days_since_expiry',  GREATEST(0, v_days),
    'days_until_delete',  GREATEST(0, 30 - GREATEST(0, v_days))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Função de exclusão de dados (chamada pela Edge Function)
-- ================================================================
CREATE OR REPLACE FUNCTION delete_expired_user_data(p_user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM corridas          WHERE driver_id = p_user_id;
  DELETE FROM trips             WHERE driver_id = p_user_id;
  DELETE FROM expenses          WHERE driver_id = p_user_id;
  DELETE FROM fuel_logs         WHERE driver_id = p_user_id;
  DELETE FROM vehicle_maintenance WHERE driver_id = p_user_id;
  DELETE FROM driver_documents  WHERE driver_id = p_user_id;
  DELETE FROM chat_messages     WHERE user_id   = p_user_id;
  DELETE FROM driver_tasks      WHERE driver_id = p_user_id;
  DELETE FROM payment_history   WHERE user_id   = p_user_id;
  DELETE FROM push_tokens       WHERE user_id   = p_user_id;
  DELETE FROM notification_preferences WHERE user_id = p_user_id;
  DELETE FROM hotmart_transactions WHERE user_id = p_user_id;
  DELETE FROM referrals         WHERE referrer_id = p_user_id OR referred_id = p_user_id;
  DELETE FROM subscriptions     WHERE user_id   = p_user_id;
  DELETE FROM profiles          WHERE id        = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
