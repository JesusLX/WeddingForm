import { requireUser } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { ConfigForm } from './ConfigForm'

export default async function ConfigurarPage() {
  const { supabase, user } = await requireUser()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Formulario
      </h1>
      <ConfigForm wedding={wedding} userId={user.id} />
    </div>
  )
}
