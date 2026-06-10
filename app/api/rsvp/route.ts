import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { appendRsvpToSheet } from '@/lib/sheets'
import { rateLimit } from '@/lib/rate-limit'
import { DEMO_WEDDING_ID } from '@/lib/demo-wedding'

const schema = z.object({
  wedding_id: z.string().uuid(),
  guest_name: z.string().min(2).max(200),
  attendance: z.enum(['yes', 'no']),
  adults_count: z.coerce.number().min(1).max(20).optional(),
  adult_names: z.array(z.string()).max(20).optional(),
  adult_menus: z.array(z.string()).max(20).optional(),
  has_children: z.enum(['yes', 'no']).optional(),
  children_count: z.coerce.number().min(0).max(20).optional(),
  children_names: z.array(z.string()).max(20).optional(),
  children_menus: z.array(z.string().nullable()).max(20).optional(),
  bus_outbound: z.string().max(200).nullish(),
  bus_return: z.string().max(200).nullish(),
  allergies: z.string().max(500).nullish(),
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

    // Demo wedding: let visitors try the form without persisting anything
    if (data.wedding_id === DEMO_WEDDING_ID) {
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

    // Validate bus route selections
    if (attendance && (data.bus_outbound || data.bus_return)) {
      const { data: routes } = await supabase
        .from('bus_routes')
        .select('label, direction')
        .eq('wedding_id', data.wedding_id)
      const validOutbound = new Set(routes?.filter(r => r.direction === 'outbound').map(r => r.label) ?? [])
      const validReturn = new Set(routes?.filter(r => r.direction === 'return').map(r => r.label) ?? [])
      if (data.bus_outbound && !validOutbound.has(data.bus_outbound)) {
        return NextResponse.json({ error: 'Opción de autobús de ida no válida' }, { status: 400 })
      }
      if (data.bus_return && !validReturn.has(data.bus_return)) {
        return NextResponse.json({ error: 'Opción de autobús de vuelta no válida' }, { status: 400 })
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
        bus_outbound: attendance ? (data.bus_outbound || null) : null,
        bus_return: attendance ? (data.bus_return || null) : null,
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
      // Auto-link adults by name, storing the per-person guest_key
      const adultNames = (data.adult_names?.length ? data.adult_names : [data.guest_name])
        .map((n: string) => n?.trim()).filter(Boolean)
      for (let i = 0; i < adultNames.length; i++) {
        await supabase
          .from('expected_guests')
          .update({ rsvp_response_id: response.id, guest_key: `${response.id}_adult_${i}` })
          .eq('wedding_id', data.wedding_id)
          .ilike('name', adultNames[i])
          .is('guest_key', null)
      }
      // Auto-link children by name
      const childNames = (data.children_names ?? []).map((n: string) => n?.trim()).filter(Boolean)
      for (let i = 0; i < childNames.length; i++) {
        await supabase
          .from('expected_guests')
          .update({ rsvp_response_id: response.id, guest_key: `${response.id}_child_${i}` })
          .eq('wedding_id', data.wedding_id)
          .ilike('name', childNames[i])
          .is('guest_key', null)
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
        bus_outbound: data.bus_outbound || null,
        bus_return: data.bus_return || null,
        allergies: data.allergies ?? '',
        song_request: data.song_request ?? '',
        message: data.message ?? '',
      }, menuOptions).catch(console.error)
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
