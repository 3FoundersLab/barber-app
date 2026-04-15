-- DELETE em `clientes` não tinha política RLS (só SELECT/INSERT/UPDATE), então exclusão era negada para staff.

DROP POLICY IF EXISTS "clientes_delete_staff" ON public.clientes;

CREATE POLICY "clientes_delete_staff" ON public.clientes
  FOR DELETE USING (
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
