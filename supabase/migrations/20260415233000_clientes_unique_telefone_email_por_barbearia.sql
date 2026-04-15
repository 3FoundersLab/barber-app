-- Garante unicidade de telefone e e-mail por barbearia.
-- Telefone compara apenas dígitos (ignora máscara).
-- E-mail compara em minúsculas e sem espaços laterais.

CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_barbearia_telefone_digits
  ON public.clientes (barbearia_id, regexp_replace(telefone, '\D', '', 'g'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_barbearia_email_normalized
  ON public.clientes (barbearia_id, lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email) <> '';
