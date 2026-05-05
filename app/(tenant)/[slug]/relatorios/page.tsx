import { redirect } from 'next/navigation'

type TenantRelatoriosPageProps = {
  params: Promise<{ slug: string }>
}

export default async function TenantRelatoriosPage({ params }: TenantRelatoriosPageProps) {
  const { slug } = await params
  redirect(`/${slug}/relatorios/visao-geral`)
}
