import { google } from 'googleapis'
import type { BusOption } from './types'

interface MenuRef {
  id: string
  name: string
  emoji: string
}

interface SheetData {
  guest_name: string
  attendance: boolean
  adults_count: number
  adult_menus: string[]
  has_children: boolean
  children_count: number
  children_menus: (string | null)[]
  bus_option: BusOption
  allergies: string
  song_request: string
  message: string
}

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentials) return null
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

function menuLabel(id: string | null, menuOptions: MenuRef[]): string {
  if (!id) return '—'
  const opt = menuOptions.find(m => m.id === id)
  return opt ? `${opt.emoji} ${opt.name}` : '—'
}

export async function appendRsvpToSheet(
  sheetId: string,
  data: SheetData,
  menuOptions: MenuRef[]
) {
  const auth = getAuth()
  if (!auth) return

  const sheets = google.sheets({ version: 'v4', auth })

  const busLabels: Record<BusOption, string> = {
    none: 'No',
    outbound: 'Solo ida',
    return: 'Solo vuelta',
    both: 'Ida y vuelta',
  }

  const adultMenusText = data.attendance
    ? data.adult_menus.map((id, i) => `A${i + 1}: ${menuLabel(id, menuOptions)}`).join(' | ')
    : ''

  const childMenusText = data.attendance && data.has_children
    ? data.children_menus.map((id, i) => `N${i + 1}: ${menuLabel(id, menuOptions)}`).join(' | ')
    : ''

  const row = [
    data.guest_name,
    data.attendance ? 'Sí' : 'No',
    data.attendance ? data.adults_count.toString() : '0',
    adultMenusText,
    data.has_children ? 'Sí' : 'No',
    data.has_children ? data.children_count.toString() : '0',
    childMenusText,
    busLabels[data.bus_option],
    data.allergies || '',
    data.song_request || '',
    data.message || '',
    new Date().toLocaleString('es-ES'),
  ]

  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:L1',
    })

    if (!existing.data.values || existing.data.values.length === 0) {
      const headers = [
        'Nombre', 'Asiste', 'Adultos', 'Menú adultos',
        '¿Niños?', 'Nº Niños', 'Menú niños',
        'Autobús', 'Alergias', 'Canción', 'Mensaje', 'Fecha',
      ]
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'A1:L1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      })
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  } catch (error) {
    console.error('Error writing to Google Sheets:', error)
  }
}
