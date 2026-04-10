-- Demo: plano + assinatura ativa para a Barbearia Modelo (scripts/004_seed_demo_data.sql).
-- Sem isso, a aba Assinatura em Configurações fica sem linha em `assinaturas` e só mostra o estado vazio.
--
-- Pré-requisito: barbearia id fixo do seed 004 existir.
-- Idempotente: não duplica se já houver qualquer assinatura para essa barbearia.

DO $$
DECLARE
  v_barbearia uuid := '11111111-1111-1111-1111-111111111111';
  v_plano uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.barbearias WHERE id = v_barbearia) THEN
    RAISE NOTICE 'Barbearia modelo (%) não existe; ignore ou rode scripts/004_seed_demo_data.sql primeiro.', v_barbearia;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.assinaturas WHERE barbearia_id = v_barbearia) THEN
    RAISE NOTICE 'Assinatura já existe para a barbearia modelo; nada a fazer.';
    RETURN;
  END IF;

  SELECT id INTO v_plano FROM public.planos WHERE ativo = true ORDER BY created_at LIMIT 1;

  IF v_plano IS NULL THEN
    INSERT INTO public.planos (nome, preco_mensal, ativo)
    VALUES ('Plano Demo', 99.90, true)
    RETURNING id INTO v_plano;
  END IF;

  INSERT INTO public.assinaturas (barbearia_id, plano_id, status, inicio_em, fim_em, periodicidade)
  VALUES (
    v_barbearia,
    v_plano,
    'ativa',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '365 days',
    'mensal'
  );
END $$;
