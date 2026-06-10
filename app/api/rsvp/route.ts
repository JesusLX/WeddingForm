import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { appendRsvpToSheet } from '@/lib/sheets'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  wedding_id: z.string().uuid(),
  guest_name: z.string().min(2).max(200),
  attendance: z.enum(['yes', 'no']),
  adults_count: z.coerce.number().min(1).max(20).optional(),
  adult_names: z.array(z.string()).optional(),
  adult_menus: z.array(z.string()).optional(),
  has_children: z.enum(['yes', 'no']).optional(),
  children_count: z.coerce.number().min(0).max(20).optional(),
  children_names: z.array(z.string()).optional(),
  children_menus: z.array(z.string().nullable()).optional(),
  bus_option: z.enum(['none', 'outbound', 'return', 'both']).optional(),
  allergies: z.string().max(500).optional(),
  song_request: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  hp_website: z.string().optional(),
  submitted_ms: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const limited = rateLimit(`rsvp:${ip}`, { limit: 10, windowMs: 60_000 })
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Inténtalo de nuevo en un momento.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      )
    }

    const body = await req.json()
    const data = schema.parse(body)

    // Anti-bot: honeypot filled or submitted too fast → pretend success
    if (data.hp_website || (data.submitted_ms !== undefined && data.submitted_ms < 1500)) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createAdminClient()

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, google_sheet_id, rsvp_deadline, is_published')
      .eq('id', data.wedding_id)
      .eq('is_published', true)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Boda no encontrada' }, { status: 404 })
    }

    if (wedding.rsvp_deadline && new Date(wedding.rsvp_deadline) < new Date()) {
      return NextResponse.json({ error: 'El plazo de confirmación ha finalizado' }, { status: 400 })
    }

    const attendance = data.attendance === 'yes'
    const hasChildren = data.has_children === 'yes'

    // Validate all menu IDs belong to this wedding
    const allMenuIds = [
      ...(data.adult_menus ?? []),
      ...(data.children_menus ?? []).filter(Boolean),
    ].filter(Boolean) as string[]

    if (allMenuIds.length > 0) {
      const { data: menuChecks } = await supabase
        .from('menu_options')
        .select('id')
        .in('id', allMenuIds)
        .eq('wedding_id', data.wedding_id)
      const validSet = new Set(menuChecks?.map(m => m.id) ?? [])
      if (allMenuIds.some(id => !validSet.has(id))) {
        return NextResponse.json({ error: 'Opción de menú no válida' }, { status: 400 })
      }
    }

    const { data: response, error: insertError } = await supabase
      .from('rsvp_responses')
      .insert({
        wedding_id: data.wedding_id,
        guest_name: data.guest_name,
        attendance,
        adults_count: attendance ? (data.adults_count ?? 1) : 0,
        adult_names: attendance ? (data.adult_names ?? []).map(n => n.trim()).filter(Boolean) : [],
        adult_menus: attendance ? (data.adult_menus ?? []).filter(s => s !== '') : [],
        has_children: attendance ? hasChildren : false,
        children_count: attendance && hasChildren ? (data.children_count ?? 0) : 0,
        children_names: attendance && hasChildren ? (data.children_names ?? []).map(n => n.trim()) : [],
        children_menus: attendance && hasChildren ? (data.children_menus ?? []) : [],
        bus_option: attendance ? (data.bus_option ?? 'none') : 'none',
        allergies: data.allergies || null,
        song_request: data.song_request || null,
        message: data.message || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Error al guardar la respuesta' }, { status: 500 })
    }

    if (response) {
      // Link the submitter and all named adults to their expected_guest records
      const namesToLink = [
        data.guest_name,
        ...(data.adult_names ?? []).map(n => n.trim()).filter(Boolean),
      ]
      for (const name of namesToLink) {
        await supabase
          .from('expected_guests')
          .update({ rsvp_response_id: response.id })
          .eq('wedding_id', data.wedding_id)
          .ilike('name', name)
          .is('rsvp_response_id', null)
      }
    }

    // Write to Google Sheets (non-blocking)
    if (wedding.google_sheet_id && response) {
      let menuOptions: { id: string; name: string; emoji: string }[] = []
      if (allMenuIds.length > 0) {
        const { data: opts } = await supabase
          .from('menu_options')
          .select('id, name, emoji')
          .in('id', allMenuIds)
          .eq('wedding_id', data.wedding_id)
        menuOptions = opts ?? []
      }

      appendRsvpToSheet(wedding.google_sheet_id, {
        guest_name: data.guest_name,
        attendance,
        adults_count: data.adults_count ?? 1,
        adult_menus: data.adult_menus ?? [],
        has_children: hasChildren,
        children_count: data.children_count ?? 0,
        children_menus: data.children_menus ?? [],
        bus_option: data.bus_option ?? 'none',
        allergies: data.allergies ?? '',
        song_request: data.song_request ?? '',
        message: data.message ?? '',
      }, menuOptions).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
