import { redirect } from 'next/navigation'
import { tenantBarbeariaBasePath } from '@/lib/routes'

export default async function AdminPerfilEditarRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`${tenantBarbeariaBasePath(slug)}/configuracoes`)
}
