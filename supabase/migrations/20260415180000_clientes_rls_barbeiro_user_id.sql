-- Permite que profissionais com conta vinculada em `barbeiros.user_id` leiam a própria linha
-- e gerenciem `clientes` da unidade, mesmo sem linha em `barbearia_users` (caso comum em equipes antigas).
-- Também evita que o SELECT em `barbeiros` falhe só por RLS ao resolver a unidade no app.

DROP POLICY IF EXISTS "barbeiros_select_member" ON public.barbeiros;

CREATE POLICY "barbeiros_select_member" ON public.barbeiros
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "clientes_select_staff" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_staff" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_staff" ON public.clientes;

CREATE POLICY "clientes_select_staff" ON public.clientes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.barbearia_id = barbearia_id
        AND b.user_id = auth.uid()
        AND COALESCE(b.ativo, true) = true
    )
  );

CREATE POLICY "clientes_insert_staff" ON public.clientes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.barbearia_id = barbearia_id
        AND b.user_id = auth.uid()
        AND COALESCE(b.ativo, true) = true
    )
  );

CREATE POLICY "clientes_update_staff" ON public.clientes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.barbearia_id = barbearia_id
        AND b.user_id = auth.uid()
        AND COALESCE(b.ativo, true) = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id = barbearia_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.barbeiros b
      WHERE b.barbearia_id = barbearia_id
        AND b.user_id = auth.uid()
        AND COALESCE(b.ativo, true) = true
    )
  );
