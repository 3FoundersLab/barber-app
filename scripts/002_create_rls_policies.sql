-- BarberTool RLS Policies
-- Políticas de segurança em nível de linha

-- ===========================================
-- PROFILES POLICIES
-- ===========================================
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Super admin pode ver todos os profiles
CREATE POLICY "profiles_select_super_admin" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- ===========================================
-- BARBEARIAS POLICIES
-- ===========================================
-- Usuários podem ver barbearias que fazem parte
CREATE POLICY "barbearias_select_member" ON public.barbearias 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = id AND bu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Super admin pode inserir barbearias
CREATE POLICY "barbearias_insert_super_admin" ON public.barbearias 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

-- Admin pode atualizar sua barbearia
CREATE POLICY "barbearias_update_admin" ON public.barbearias 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

-- ===========================================
-- BARBEARIA_USERS POLICIES
-- ===========================================
CREATE POLICY "barbearia_users_select_member" ON public.barbearia_users 
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

CREATE POLICY "barbearia_users_insert_admin" ON public.barbearia_users 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "barbearia_users_delete_admin" ON public.barbearia_users 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

-- ===========================================
-- SERVICOS POLICIES
-- ===========================================
CREATE POLICY "servicos_select_member" ON public.servicos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid()
    )
  );

-- Serviços públicos para slug de barbearia (para clientes não logados verem)
CREATE POLICY "servicos_select_public" ON public.servicos 
  FOR SELECT USING (ativo = true);

CREATE POLICY "servicos_insert_admin" ON public.servicos 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

CREATE POLICY "servicos_update_admin" ON public.servicos 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

CREATE POLICY "servicos_delete_admin" ON public.servicos 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

-- ===========================================
-- BARBEIROS POLICIES
-- ===========================================
CREATE POLICY "barbeiros_select_member" ON public.barbeiros 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid()
    )
  );

-- Barbeiros públicos (para clientes não logados)
CREATE POLICY "barbeiros_select_public" ON public.barbeiros 
  FOR SELECT USING (ativo = true);

CREATE POLICY "barbeiros_insert_admin" ON public.barbeiros 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

CREATE POLICY "barbeiros_update_admin" ON public.barbeiros 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id AND bu.user_id = auth.uid() AND bu.role = 'admin'
    )
  );

-- ===========================================
-- CLIENTES POLICIES
-- ===========================================
CREATE POLICY "clientes_select_staff" ON public.clientes 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id 
      AND bu.user_id = auth.uid() 
      AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
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
  );

CREATE POLICY "clientes_update_staff" ON public.clientes 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id 
      AND bu.user_id = auth.uid() 
      AND bu.role IN ('admin', 'barbeiro')
    )
    OR user_id = auth.uid()
  );

-- ===========================================
-- AGENDAMENTOS POLICIES
-- ===========================================
CREATE POLICY "agendamentos_select_staff" ON public.agendamentos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id 
      AND bu.user_id = auth.uid() 
      AND bu.role IN ('admin', 'barbeiro')
    )
  );

-- Cliente pode ver seus próprios agendamentos
CREATE POLICY "agendamentos_select_cliente" ON public.agendamentos 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "agendamentos_insert_staff" ON public.agendamentos 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id 
      AND bu.user_id = auth.uid() 
      AND bu.role IN ('admin', 'barbeiro')
    )
  );

-- Cliente pode criar agendamento para si mesmo
CREATE POLICY "agendamentos_insert_cliente" ON public.agendamentos 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "agendamentos_update_staff" ON public.agendamentos 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbearia_users bu 
      WHERE bu.barbearia_id = barbearia_id 
      AND bu.user_id = auth.uid() 
      AND bu.role IN ('admin', 'barbeiro')
    )
  );

-- Cliente pode cancelar seu próprio agendamento
CREATE POLICY "agendamentos_update_cliente" ON public.agendamentos 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clientes c 
      WHERE c.id = cliente_id AND c.user_id = auth.uid()
    )
  );

-- ===========================================
-- HORARIOS_TRABALHO POLICIES
-- ===========================================
CREATE POLICY "horarios_trabalho_select_public" ON public.horarios_trabalho 
  FOR SELECT USING (ativo = true);

CREATE POLICY "horarios_trabalho_insert_admin" ON public.horarios_trabalho 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbeiros b
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE b.id = barbeiro_id 
      AND bu.user_id = auth.uid() 
      AND bu.role = 'admin'
    )
  );

CREATE POLICY "horarios_trabalho_update_admin" ON public.horarios_trabalho 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.barbeiros b
      JOIN public.barbearia_users bu ON bu.barbearia_id = b.barbearia_id
      WHERE b.id = barbeiro_id 
      AND bu.user_id = auth.uid() 
      AND bu.role = 'admin'
    )
  );
