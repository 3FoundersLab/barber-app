import { redirect } from 'next/navigation'
import { tenantBarbeariaBasePath } from '@/lib/routes'

/** Rota legada: o painel usa `/[slug]/equipe`. */
export default async function UsuariosLegacyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`${tenantBarbeariaBasePath(slug)}/equipe`)
}
