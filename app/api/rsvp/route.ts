import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'
import { appendRsvpToSheet } from '@/lib/sheets'
import type { MenuOption } from '@/lib/types'

const schema = z.object({
  wedding_id: z.string().uuid(),
  guest_name: z.string().min(2).max(200),
  attendance: z.enum(['yes', 'no']),
  adults_count: z.coerce.number().min(1).max(20).optional(),
  has_children: z.enum(['yes', 'no']).optional(),
  children_count: z.coerce.number().min(0).max(20).optional(),
  children_want_menu: z.boolean().optional(),
  menu_option_id: z.string().optional(),
  needs_bus: z.enum(['yes', 'no']).optional(),
  allergies: z.string().max(500).optional(),
  song_request: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const supabase = createAdminClient()

    // Verify wedding exists and is published
    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .select('id, google_sheet_id, rsvp_deadline, is_published')
      .eq('id', data.wedding_id)
      .eq('is_published', true)
      .single()

    if (weddingError || !wedding) {
      return NextResponse.json({ error: 'Boda no encontrada' }, { status: 404 })
    }

    // Check RSVP deadline
    if (wedding.rsvp_deadline && new Date(wedding.rsvp_deadline) < new Date()) {
      return NextResponse.json(
        { error: 'El plazo de confirmación ha finalizado' },
        { status: 400 }
      )
    }

    const attendance = data.attendance === 'yes'

    // Validate menu option belongs to this wedding
    if (attendance && data.menu_option_id) {
      const { data: menuCheck } = await supabase
        .from('menu_options')
        .select('id')
        .eq('id', data.menu_option_id)
        .eq('wedding_id', data.wedding_id)
        .single()
      if (!menuCheck) {
        return NextResponse.json({ error: 'Opción de menú no válida' }, { status: 400 })
      }
    }

    // Save to Supabase
    const { data: response, error: insertError } = await supabase
      .from('rsvp_responses')
      .insert({
        wedding_id: data.wedding_id,
        guest_name: data.guest_name,
        attendance,
        adults_count: attendance ? (data.adults_count ?? 1) : 0,
        has_children: attendance ? data.has_children === 'yes' : false,
        children_count: attendance && data.has_children === 'yes' ? (data.children_count ?? 0) : 0,
        children_want_menu: attendance && data.has_children === 'yes' ? (data.children_want_menu ?? false) : false,
        menu_option_id: attendance && data.menu_option_id ? data.menu_option_id : null,
        needs_bus: attendance ? data.needs_bus === 'yes' : false,
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

    // Try to link to expected_guests by name (fuzzy: case-insensitive)
    if (response) {
      await supabase
        .from('expected_guests')
        .update({ rsvp_response_id: response.id })
        .eq('wedding_id', data.wedding_id)
        .ilike('name', data.guest_name)
        .is('rsvp_response_id', null)
    }

    // Write to Google Sheets (non-blocking)
    if (wedding.google_sheet_id && response) {
      let menuOption: MenuOption | null = null
      if (data.menu_option_id) {
        const { data: opt } = await supabase
          .from('menu_options')
          .select('*')
          .eq('id', data.menu_option_id)
          .eq('wedding_id', data.wedding_id)
          .single()
        menuOption = opt
      }

      appendRsvpToSheet(wedding.google_sheet_id, {
        guest_name: data.guest_name,
        attendance,
        adults_count: data.adults_count ?? 1,
        has_children: data.has_children === 'yes',
        children_count: data.children_count ?? 0,
        children_want_menu: data.children_want_menu ?? false,
        menu_option_id: data.menu_option_id ?? '',
        needs_bus: data.needs_bus === 'yes',
        allergies: data.allergies ?? '',
        song_request: data.song_request ?? '',
        message: data.message ?? '',
      }, menuOption).catch(console.error)
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
