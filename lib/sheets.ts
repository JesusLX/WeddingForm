import { google } from 'googleapis'
import type { RsvpFormData, MenuOption } from './types'

function getAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!credentials) return null
  return new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function appendRsvpToSheet(
  sheetId: string,
  data: RsvpFormData,
  menuOption: MenuOption | null
) {
  const auth = getAuth()
  if (!auth) return

  const sheets = google.sheets({ version: 'v4', auth })

  const row = [
    data.guest_name,
    data.attendance ? 'Sí' : 'No',
    data.attendance ? data.adults_count.toString() : '0',
    data.has_children ? 'Sí' : 'No',
    data.has_children ? data.children_count.toString() : '0',
    data.children_want_menu ? 'Sí' : 'No',
    menuOption ? `${menuOption.emoji} ${menuOption.name}` : '',
    data.needs_bus ? 'Sí' : 'No',
    data.allergies || '',
    data.song_request || '',
    data.message || '',
    new Date().toLocaleString('es-ES'),
  ]

  try {
    // Add header row if sheet is empty
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:L1',
    })

    if (!existing.data.values || existing.data.values.length === 0) {
      const headers = [
        'Nombre', 'Asiste', 'Adultos', '¿Niños?', 'Nº Niños',
        'Menú infantil', 'Menú adulto', 'Autobús', 'Alergias',
        'Canción', 'Mensaje', 'Fecha',
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
