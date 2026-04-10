-- Ver scripts/042_comandas_fk_cascade_barbearia_delete.sql

ALTER TABLE public.comandas
  DROP CONSTRAINT IF EXISTS comandas_barbeiro_id_fkey,
  ADD CONSTRAINT comandas_barbeiro_id_fkey
    FOREIGN KEY (barbeiro_id) REFERENCES public.barbeiros(id) ON DELETE CASCADE;

ALTER TABLE public.comandas
  DROP CONSTRAINT IF EXISTS comandas_cliente_id_fkey,
  ADD CONSTRAINT comandas_cliente_id_fkey
    FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

ALTER TABLE public.comanda_produtos
  DROP CONSTRAINT IF EXISTS comanda_produtos_produto_estoque_id_fkey,
  ADD CONSTRAINT comanda_produtos_produto_estoque_id_fkey
    FOREIGN KEY (produto_estoque_id) REFERENCES public.estoque_produtos(id) ON DELETE CASCADE;
