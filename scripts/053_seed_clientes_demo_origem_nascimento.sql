-- Preenche origem_canal e data_nascimento nos clientes demo (004), se as colunas existirem.
-- Rodar após scripts/052_clientes_origem_data_nascimento.sql (ou migration equivalente).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clientes'
      AND column_name = 'origem_canal'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clientes'
      AND column_name = 'data_nascimento'
  ) THEN
    UPDATE public.clientes c
    SET
      origem_canal = v.origem,
      data_nascimento = v.nasc::date
    FROM (
      VALUES
        ('33333333-3333-3333-3333-333333333331'::uuid, 'instagram', '1990-05-14'),
        ('33333333-3333-3333-3333-333333333332'::uuid, 'indicacao', '1988-11-22'),
        ('33333333-3333-3333-3333-333333333333'::uuid, 'walk_in', '1995-02-03'),
        ('33333333-3333-3333-3333-333333333334'::uuid, 'google', '1992-08-30'),
        ('33333333-3333-3333-3333-333333333335'::uuid, 'instagram', '1987-12-01'),
        ('33333333-3333-3333-3333-333333333336'::uuid, 'tiktok', '1999-04-18'),
        ('33333333-3333-3333-3333-333333333337'::uuid, 'facebook', '1991-07-25'),
        ('33333333-3333-3333-3333-333333333338'::uuid, 'instagram', '1994-01-09'),
        ('33333333-3333-3333-3333-333333333339'::uuid, 'walk_in', '1989-09-16'),
        ('33333333-3333-3333-3333-333333333340'::uuid, 'google', '1996-06-11'),
        ('33333333-3333-3333-3333-333333333341'::uuid, 'indicacao', '1993-03-27'),
        ('33333333-3333-3333-3333-333333333342'::uuid, 'walk_in', '2000-10-05'),
        ('33333333-3333-3333-3333-333333333343'::uuid, 'instagram', '1986-04-20'),
        ('33333333-3333-3333-3333-333333333344'::uuid, 'google', '1998-12-12'),
        ('33333333-3333-3333-3333-333333333345'::uuid, 'indicacao', '1997-05-08')
    ) AS v(id, origem, nasc)
    WHERE c.id = v.id;
  END IF;
END $$;
