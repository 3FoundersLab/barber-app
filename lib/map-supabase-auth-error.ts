import type { AuthError } from '@supabase/supabase-js'

/**
 * Mensagens em português para erros comuns de login (sem expor detalhes internos).
 */
export function mapSupabaseAuthErrorToMessage(error: AuthError): string {
  const raw = (error.message || '').toLowerCase()
  const status = error.status

  if (status === 400 && (raw.includes('invalid login') || raw.includes('invalid credentials'))) {
    return 'E-mail ou senha incorretos. Verifique os dados e tente de novo.'
  }
  if (raw.includes('email not confirmed') || raw.includes('email_not_confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.'
  }
  if (status === 429 || raw.includes('too many requests') || raw.includes('rate limit')) {
    return 'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.'
  }
  if (raw.includes('network') || status === 0) {
    return 'Não foi possível conectar. Verifique sua internet e tente de novo.'
  }

  if (error.message && error.message.length < 120 && !raw.includes('jwt')) {
    return error.message
  }

  return 'Não foi possível entrar agora. Tente de novo em instantes.'
}
