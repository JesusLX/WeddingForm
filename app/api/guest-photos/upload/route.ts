import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const weddingId = formData.get('wedding_id') as string | null
    const guestName = (formData.get('guest_name') as string | null)?.trim() || null
    const caption = (formData.get('caption') as string | null)?.trim() || null

    if (!file || !weddingId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar 10 MB' }, { status: 400 })
    }

    // Verify wedding is published and gallery is enabled
    const supabase = await createServerSupabaseClient()
    const { data: wedding, error: wErr } = await supabase
      .from('weddings')
      .select('id, collab_gallery_enabled, is_published')
      .eq('id', weddingId)
      .single()

    if (wErr || !wedding || !wedding.is_published || !wedding.collab_gallery_enabled) {
      return NextResponse.json({ error: 'Galería no disponible' }, { status: 403 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${weddingId}/guest/${randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('wedding-photos')
      .upload(filename, bytes, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage
      .from('wedding-photos')
      .getPublicUrl(filename)

    const { error: insertError } = await admin
      .from('guest_photos')
      .insert({
        wedding_id: weddingId,
        photo_url: publicUrl,
        guest_name: guestName,
        caption,
        approved: false,
      })

    if (insertError) {
      // Clean up uploaded file on DB failure
      await admin.storage.from('wedding-photos').remove([filename])
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
