import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  edit_key: z.string().uuid(),
  name: z.string().min(2).max(100),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().or(z.literal('')),
  venue: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  maps_url: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { ok, retryAfterSeconds } = rateLimit(`secret-event:${ip}`, { limit: 10, windowMs: 60_000 })
    if (!ok) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones, espera un momento' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      )
    }

    const data = schema.parse(await req.json())

    if (data.maps_url) {
      try {
        const u = new URL(data.maps_url)
        if (u.protocol !== 'https:') throw new Error()
      } catch {
        return NextResponse.json({ error: 'URL de Maps no válida' }, { status: 400 })
      }
    }

    const supabase = createAdminClient()
    const { data: event, error: findError } = await supabase
      .from('wedding_events')
      .select('id')
      .eq('edit_key', data.edit_key)
      .eq('is_secret', true)
      .single()

    if (findError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('wedding_events')
      .update({
        name: data.name.trim(),
        event_date: data.event_date,
        event_time: data.event_time || null,
        venue: data.venue?.trim() || null,
        address: data.address?.trim() || null,
        maps_url: data.maps_url?.trim() || null,
        description: data.description?.trim() || null,
      })
      .eq('id', event.id)

    if (updateError) {
      console.error('Secret event update error:', updateError)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
