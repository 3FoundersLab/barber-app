-- Contas demo (super@ / admin@ / barbeiro@ / cliente@ barbertool.com)
-- ========================================================================
-- O seed 004 cria a barbearia demo, mas NÃO cria usuários em auth.users.
-- Sem linha em barbearia_users, o login de admin falha com "não vinculado".
--
-- Pré-requisitos:
--   1. Rodar scripts/004_seed_demo_data.sql (barbearia slug `barbearia-modelo`).
--   2. Criar os 4 usuários em Authentication → Users (mesmo e-mail e senha, ex.: 123456).
--   3. Executar este script no SQL Editor (como postgres / role com acesso a auth.users).
--
-- ID fixo da barbearia modelo (004_seed_demo_data.sql)
-- ========================================================================

DO $$
DECLARE
  v_barbearia uuid := '11111111-1111-1111-1111-111111111111';
  v_has_status_cadastro boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'barbearias'
      AND column_name = 'status_cadastro'
  )
  INTO v_has_status_cadastro;

  -- Perfis: garante papel correto (trigger pode ter criado como cliente)
  INSERT INTO public.profiles (id, nome, email, role)
  SELECT u.id,
         COALESCE(NULLIF(trim(u.raw_user_meta_data ->> 'nome'), ''), split_part(u.email, '@', 1)),
         u.email,
         CASE u.email
           WHEN 'super@barbertool.com' THEN 'super_admin'
           WHEN 'admin@barbertool.com' THEN 'admin'
           WHEN 'barbeiro@barbertool.com' THEN 'barbeiro'
           WHEN 'cliente@barbertool.com' THEN 'cliente'
           ELSE 'cliente'
         END
  FROM auth.users u
  WHERE u.email IN (
    'super@barbertool.com',
    'admin@barbertool.com',
    'barbeiro@barbertool.com',
    'cliente@barbertool.com'
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  -- Vínculo admin + barbeiro à barbearia modelo
  INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
  SELECT v_barbearia, u.id, 'admin'
  FROM auth.users u
  WHERE u.email = 'admin@barbertool.com'
  ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  INSERT INTO public.barbearia_users (barbearia_id, user_id, role)
  SELECT v_barbearia, u.id, 'barbeiro'
  FROM auth.users u
  WHERE u.email = 'barbeiro@barbertool.com'
  ON CONFLICT (barbearia_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  IF v_has_status_cadastro THEN
    UPDATE public.barbearias
    SET status_cadastro = 'ativa'
    WHERE id = v_barbearia;
  END IF;
END $$;
