-- BarberTool Database Schema
-- Multi-tenant SaaS para gestão de barbearias

-- TABELA: barbearias (multi-tenant base)
CREATE TABLE IF NOT EXISTS public.barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: profiles (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: barbearia_users (relação N:N usuários-barbearias)
CREATE TABLE IF NOT EXISTS public.barbearia_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barbearia_id, user_id)
);

-- TABELA: servicos
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duracao INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: barbeiros
CREATE TABLE IF NOT EXISTS public.barbeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  avatar TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  funcao_equipe TEXT NOT NULL DEFAULT 'barbeiro' CHECK (funcao_equipe IN ('barbeiro', 'barbeiro_lider', 'moderador')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado',
  status_pagamento TEXT NOT NULL DEFAULT 'pendente',
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: horarios_trabalho
CREATE TABLE IF NOT EXISTS public.horarios_trabalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_barbearias_slug ON public.barbearias(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_barbearia_users_barbearia ON public.barbearia_users(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_barbearia_users_user ON public.barbearia_users(user_id);
CREATE INDEX IF NOT EXISTS idx_servicos_barbearia ON public.servicos(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON public.barbeiros(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_barbearia ON public.clientes(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbearia ON public.agendamentos(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbeiro ON public.agendamentos(barbeiro_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente ON public.agendamentos(cliente_id);

-- HABILITAR RLS
ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbearia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_trabalho ENABLE ROW LEVEL SECURITY;
