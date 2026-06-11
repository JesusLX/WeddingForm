import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

export async function POST() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: wedding, error: wErr } = await supabase
    .from('weddings')
    .select('id, partner_1, partner_2, slug, wedding_date, reminder_enabled, rsvp_deadline')
    .eq('user_id', user.id)
    .single()

  if (wErr || !wedding) {
    return NextResponse.json({ error: 'Boda no encontrada' }, { status: 404 })
  }

  if (!wedding.reminder_enabled) {
    return NextResponse.json({ error: 'Los recordatorios no están activados' }, { status: 400 })
  }

  // Get guests with email but no RSVP yet
  const { data: guests, error: gErr } = await supabase
    .from('expected_guests')
    .select('id, name, email')
    .eq('wedding_id', wedding.id)
    .is('rsvp_response_id', null)
    .not('email', 'is', null)

  if (gErr) {
    return NextResponse.json({ error: 'Error al obtener invitados' }, { status: 500 })
  }

  if (!guests || guests.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No hay invitados pendientes con email' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY no configurada' }, { status: 500 })
  }

  const resend = new Resend(apiKey)
  const weddingUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://tuboda.app'}/boda/${wedding.slug}`
  const deadline = wedding.rsvp_deadline
    ? new Date(wedding.rsvp_deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  let sent = 0
  const errors: string[] = []

  for (const guest of guests) {
    if (!guest.email) continue
    const { error } = await resend.emails.send({
      from: `${wedding.partner_1} & ${wedding.partner_2} <bodas@resend.dev>`,
      to: guest.email,
      subject: `${wedding.partner_1} & ${wedding.partner_2} te esperan 💍`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #2D2D2D;">
          <p style="color: #C9A84C; font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 8px;">
            Recordatorio
          </p>
          <h1 style="font-size: 28px; font-weight: normal; font-style: italic; margin: 0 0 24px;">
            Hola, ${guest.name}
          </h1>
          <p style="line-height: 1.7; margin-bottom: 16px;">
            Aún no has confirmado tu asistencia a nuestra boda.
            ${deadline ? `El plazo para confirmar es el <strong>${deadline}</strong>.` : ''}
          </p>
          <p style="line-height: 1.7; margin-bottom: 32px;">
            Nos haría mucha ilusión contar contigo en este día tan especial.
            Confirma tu asistencia en el siguiente enlace:
          </p>
          <a href="${weddingUrl}"
             style="display: inline-block; background: #C9A84C; color: white; text-decoration: none;
                    padding: 14px 28px; border-radius: 8px; font-size: 14px; letter-spacing: 0.05em;">
            Confirmar asistencia →
          </a>
          <p style="margin-top: 40px; font-size: 13px; color: #999;">
            Con todo nuestro cariño,<br/>
            <em>${wedding.partner_1} &amp; ${wedding.partner_2}</em>
          </p>
        </div>
      `,
    })
    if (error) {
      errors.push(guest.email)
    } else {
      sent++
    }
  }

  // Update last sent timestamp
  await supabase
    .from('weddings')
    .update({ reminder_last_sent: new Date().toISOString() })
    .eq('id', wedding.id)

  return NextResponse.json({
    sent,
    total: guests.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
