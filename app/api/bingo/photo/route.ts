import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // RLS ensures we get the authenticated couple's game.
    const { data: game } = await supabase
      .from('bingo_games')
      .select('id, wedding_id, items')
      .single()
    if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'La imagen no puede superar 10 MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${game.wedding_id}/bingo/${randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()

    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('wedding-photos')
      .upload(filename, bytes, { contentType: file.type, upsert: false })
    if (uploadError) {
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('wedding-photos').getPublicUrl(filename)

    const items: string[] = [...(game.items ?? []), publicUrl]
    const { error: updateError } = await supabase
      .from('bingo_games')
      .update({ items })
      .eq('id', game.id)
    if (updateError) {
      await admin.storage.from('wedding-photos').remove([filename])
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ url: publicUrl, items })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
