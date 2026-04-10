-- Papel na equipe (barbeiro / barbeiro_lider agenda atendimentos; moderador não aparece na escolha de profissional).
-- Bucket público para fotos de barbeiros: {barbearia_id}/{barbeiro_id}.webp (upload só por admin da barbearia).

ALTER TABLE public.barbeiros
  ADD COLUMN IF NOT EXISTS funcao_equipe TEXT NOT NULL DEFAULT 'barbeiro'
  CHECK (funcao_equipe IN ('barbeiro', 'barbeiro_lider', 'moderador'));

COMMENT ON COLUMN public.barbeiros.funcao_equipe IS 'barbeiro e barbeiro_lider: atendem e aparecem no agendamento; moderador: equipe sem agenda de cortes.';

-- Storage: fotos dos barbeiros (separado do bucket avatars/, que usa pasta do user_id auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('barbeiro-fotos', 'barbeiro-fotos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "barbeiro_fotos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "barbeiro_fotos_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "barbeiro_fotos_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "barbeiro_fotos_delete_admin" ON storage.objects;

CREATE POLICY "barbeiro_fotos_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barbeiro-fotos');

CREATE POLICY "barbeiro_fotos_insert_admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'barbeiro-fotos'
    AND EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id::text = split_part(name, '/', 1)
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE POLICY "barbeiro_fotos_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'barbeiro-fotos'
    AND EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id::text = split_part(name, '/', 1)
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'barbeiro-fotos'
    AND EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id::text = split_part(name, '/', 1)
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );

CREATE POLICY "barbeiro_fotos_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'barbeiro-fotos'
    AND EXISTS (
      SELECT 1 FROM public.barbearia_users bu
      WHERE bu.barbearia_id::text = split_part(name, '/', 1)
        AND bu.user_id = auth.uid()
        AND bu.role = 'admin'
    )
  );
