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
-- Intencionalmente sem cadastro automático de serviços.
-- Cada barbearia deve criar os próprios serviços no painel.

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
-- CLIENTES DEMO (somente fictícios — sem nomes de pessoas reais)
-- ===========================================
INSERT INTO public.clientes (id, barbearia_id, nome, telefone, email, notas) VALUES
('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 01', '(11) 90000-1001', 'cliente-ficticio-01@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 02', '(11) 90000-1002', 'cliente-ficticio-02@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 03', '(11) 90000-1003', 'cliente-ficticio-03@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 04', '(11) 90000-1004', 'cliente-ficticio-04@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 05', '(11) 90000-1005', 'cliente-ficticio-05@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333336', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 06', '(11) 90000-1006', 'cliente-ficticio-06@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333337', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 07', '(11) 90000-1007', 'cliente-ficticio-07@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333338', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 08', '(11) 90000-1008', 'cliente-ficticio-08@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333339', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 09', '(11) 90000-1009', 'cliente-ficticio-09@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333340', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 10', '(11) 90000-1010', 'cliente-ficticio-10@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333341', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 11', '(11) 90000-1011', 'cliente-ficticio-11@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333342', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 12', '(11) 90000-1012', 'cliente-ficticio-12@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333343', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 13', '(11) 90000-1013', 'cliente-ficticio-13@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333344', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 14', '(11) 90000-1014', 'cliente-ficticio-14@example.com', 'Dado de demonstração; não representa pessoa real.'),
('33333333-3333-3333-3333-333333333345', '11111111-1111-1111-1111-111111111111', 'Cliente fictício 15', '(11) 90000-1015', 'cliente-ficticio-15@example.com', 'Dado de demonstração; não representa pessoa real.')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  email = EXCLUDED.email,
  notas = EXCLUDED.notas;

-- ===========================================
-- AGENDAMENTOS DEMO (próximos dias)
-- ===========================================
-- Sem agendamentos automáticos por dependerem de serviços pré-cadastrados.
