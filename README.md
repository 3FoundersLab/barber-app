# BarBeautyHub v3

Sistema web para gestao de barbearia com fluxos para cliente, barbeiro e admin, construído com Next.js e Supabase.

## Tecnologias

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (auth e sessao)

## Requisitos

- Node.js 20+
- npm (ou pnpm, se preferir)

## Como rodar o projeto

1. Instale as dependencias:

```bash
npm install
```

2. Configure as variaveis de ambiente:

```bash
cp .env.example .env.local
```

3. Preencha os valores no arquivo `.env.local`.

4. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

O projeto ficara disponivel em `http://localhost:3000`.

## Scripts disponiveis

- `npm run dev`: inicia o servidor de desenvolvimento
- `npm run build`: gera build de producao
- `npm run start`: inicia a build de producao
- `npm run lint`: executa o linter

## Estrutura de rotas

- `/login` - autenticacao
- `/cadastro/barbearia` - cadastro de novas barbearias com escolha de plano
- `/cliente/*` - area do cliente
- `/barbeiro/*` - area do barbeiro
- `/admin/*` - area administrativa
- `/super/*` - area de super administracao

## Variaveis de ambiente

Este projeto utiliza:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Sem essas variaveis, os recursos de autenticacao via Supabase ficam desativados.
