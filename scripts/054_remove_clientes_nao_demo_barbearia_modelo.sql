-- Remove da barbearia DEMO (Barbearia Modelo) todos os clientes que NÃO são os 15 IDs fixos do seed 004.
-- Útil para limpar cadastros reais ou de teste manual misturados ao ambiente de demonstração.
--
-- ATENÇÃO: só use se a barbearia com id abaixo for exclusivamente demo. Agendamentos/comandas
-- vinculados a esses clientes serão removidos em cascata (conforme FKs do schema).

DELETE FROM public.clientes c
WHERE c.barbearia_id = '11111111-1111-1111-1111-111111111111'
  AND c.id NOT IN (
    '33333333-3333-3333-3333-333333333331',
    '33333333-3333-3333-3333-333333333332',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333334',
    '33333333-3333-3333-3333-333333333335',
    '33333333-3333-3333-3333-333333333336',
    '33333333-3333-3333-3333-333333333337',
    '33333333-3333-3333-3333-333333333338',
    '33333333-3333-3333-3333-333333333339',
    '33333333-3333-3333-3333-333333333340',
    '33333333-3333-3333-3333-333333333341',
    '33333333-3333-3333-3333-333333333342',
    '33333333-3333-3333-3333-333333333343',
    '33333333-3333-3333-3333-333333333344',
    '33333333-3333-3333-3333-333333333345'
  );
