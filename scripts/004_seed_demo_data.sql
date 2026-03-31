-- BarberTool Demo Data
-- Dados de exemplo para demonstração

-- ===========================================
-- BARBEARIA DEMO
-- ===========================================
INSERT INTO public.barbearias (id, nome, slug, endereco, telefone, email)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Barbearia Modelo',
  'barbearia-modelo',
  'Rua das Flores, 123 - Centro',
  '(11) 99999-9999',
  'contato@barbeariamodelo.com'
) ON CONFLICT (slug) DO NOTHING;

-- ===========================================
-- SERVIÇOS DEMO
-- ===========================================
INSERT INTO public.servicos (barbearia_id, nome, descricao, preco, duracao) VALUES
('11111111-1111-1111-1111-111111111111', 'Corte Tradicional', 'Corte clássico com máquina e tesoura', 45.00, 30),
('11111111-1111-1111-1111-111111111111', 'Corte + Barba', 'Corte completo com barba na navalha', 70.00, 45),
('11111111-1111-1111-1111-111111111111', 'Barba', 'Barba completa com toalha quente', 35.00, 20),
('11111111-1111-1111-1111-111111111111', 'Corte Degradê', 'Corte degradê moderno', 55.00, 40),
('11111111-1111-1111-1111-111111111111', 'Hidratação', 'Tratamento de hidratação capilar', 40.00, 25),
('11111111-1111-1111-1111-111111111111', 'Pigmentação', 'Pigmentação de barba ou cabelo', 80.00, 60)
ON CONFLICT DO NOTHING;

-- ===========================================
-- BARBEIROS DEMO
-- ===========================================
INSERT INTO public.barbeiros (id, barbearia_id, nome, telefone, email) VALUES
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Carlos Silva', '(11) 98888-1111', 'carlos@barbeariamodelo.com'),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'João Santos', '(11) 98888-2222', 'joao@barbeariamodelo.com'),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Pedro Oliveira', '(11) 98888-3333', 'pedro@barbeariamodelo.com')
ON CONFLICT DO NOTHING;

-- ===========================================
-- HORÁRIOS DE TRABALHO (Segunda a Sábado, 9h-19h)
-- ===========================================
INSERT INTO public.horarios_trabalho (barbeiro_id, dia_semana, hora_inicio, hora_fim) VALUES
-- Carlos (seg-sab)
('22222222-2222-2222-2222-222222222221', 1, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222221', 2, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222221', 3, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222221', 4, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222221', 5, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222221', 6, '09:00', '17:00'),
-- João (seg-sab)
('22222222-2222-2222-2222-222222222222', 1, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222222', 2, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222222', 3, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222222', 4, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222222', 5, '09:00', '19:00'),
('22222222-2222-2222-2222-222222222222', 6, '09:00', '17:00'),
-- Pedro (ter-sab)
('22222222-2222-2222-2222-222222222223', 2, '10:00', '20:00'),
('22222222-2222-2222-2222-222222222223', 3, '10:00', '20:00'),
('22222222-2222-2222-2222-222222222223', 4, '10:00', '20:00'),
('22222222-2222-2222-2222-222222222223', 5, '10:00', '20:00'),
('22222222-2222-2222-2222-222222222223', 6, '10:00', '18:00')
ON CONFLICT DO NOTHING;

-- ===========================================
-- CLIENTES DEMO
-- ===========================================
INSERT INTO public.clientes (id, barbearia_id, nome, telefone, email) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Ricardo Almeida', '(11) 97777-1111', 'ricardo@email.com'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Fernando Costa', '(11) 97777-2222', 'fernando@email.com'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Marcos Lima', '(11) 97777-3333', 'marcos@email.com'),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Lucas Pereira', '(11) 97777-4444', 'lucas@email.com'),
('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'Bruno Souza', '(11) 97777-5555', 'bruno@email.com')
ON CONFLICT DO NOTHING;

-- ===========================================
-- AGENDAMENTOS DEMO (próximos dias)
-- ===========================================
INSERT INTO public.agendamentos (barbearia_id, cliente_id, barbeiro_id, servico_id, data, horario, status, status_pagamento, valor) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  c.id,
  b.id,
  s.id,
  CURRENT_DATE + (random() * 7)::int,
  (TIME '09:00' + (random() * 10)::int * INTERVAL '1 hour'),
  CASE (random() * 3)::int 
    WHEN 0 THEN 'agendado'
    WHEN 1 THEN 'concluido'
    ELSE 'agendado'
  END,
  CASE (random() * 2)::int
    WHEN 0 THEN 'pendente'
    ELSE 'pago'
  END,
  s.preco
FROM 
  (SELECT id FROM public.clientes WHERE barbearia_id = '11111111-1111-1111-1111-111111111111' LIMIT 5) c,
  (SELECT id FROM public.barbeiros WHERE barbearia_id = '11111111-1111-1111-1111-111111111111' ORDER BY random() LIMIT 1) b,
  (SELECT id, preco FROM public.servicos WHERE barbearia_id = '11111111-1111-1111-1111-111111111111' ORDER BY random() LIMIT 1) s
ON CONFLICT DO NOTHING;
