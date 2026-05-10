'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Wedding, MenuOption } from '@/lib/types'

const schema = z.object({
  guest_name: z.string().min(2, 'Por favor introduce tu nombre'),
  attendance: z.enum(['yes', 'no']),
  adults_count: z.number().min(1).max(20).optional(),
  has_children: z.enum(['yes', 'no']).optional(),
  children_count: z.number().min(0).max(20).optional(),
  children_want_menu: z.boolean().optional(),
  menu_option_id: z.string().optional(),
  needs_bus: z.enum(['yes', 'no']).optional(),
  allergies: z.string().max(500).optional(),
  song_request: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function RSVPForm({
  wedding,
  menuOptions,
}: {
  wedding: Wedding
  menuOptions: MenuOption[]
}) {
  const [status, setStatus] = useState<Status>('idle')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as any })

  const attendance = watch('attendance')
  const hasChildren = watch('has_children')
  const isAttending = attendance === 'yes'
  const bringsChildren = hasChildren === 'yes'

  async function onSubmit(values: FormValues) {
    setStatus('submitting')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, wedding_id: wedding.id }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const deadlinePassed =
    !!wedding.rsvp_deadline && new Date(wedding.rsvp_deadline) < new Date()

  if (deadlinePassed) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">📅</div>
        <h3
          className="text-xl mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          El plazo de confirmación ha finalizado
        </h3>
        <p className="text-sm" style={{ color: '#555555' }}>
          La fecha límite para confirmar asistencia era el{' '}
          {format(new Date(wedding.rsvp_deadline!), "d 'de' MMMM 'de' yyyy", { locale: es })}.
        </p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">💌</div>
        <h3
          className="text-2xl mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          ¡Gracias por confirmar!
        </h3>
        <p style={{ color: '#555555' }}>
          Hemos recibido tu respuesta. ¡Nos vemos el gran día!
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }
  const labelClass = 'block text-sm font-medium mb-2'
  const labelStyle = { color: '#555555' }
  const radioClass =
    'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:border-amber-300'

  function RadioOption({
    name,
    value,
    label,
    emoji,
  }: {
    name: keyof FormValues
    value: string
    label: string
    emoji?: string
  }) {
    const checked = watch(name) === value
    return (
      <label
        className={radioClass}
        style={{
          borderColor: checked ? '#C9A84C' : '#F4D7D7',
          backgroundColor: checked ? '#FBF5E6' : 'white',
        }}
      >
        <input type="radio" value={value} className="sr-only" {...register(name as any)} />
        {emoji && <span className="text-lg">{emoji}</span>}
        <span className="text-sm font-medium" style={{ color: '#2D2D2D' }}>{label}</span>
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Deadline banner */}
      {wedding.rsvp_deadline && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: '#FBF5E6', border: '1px solid #C9A84C' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: '#C9A84C' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span style={{ color: '#555555' }}>
            Fecha límite para confirmar:{' '}
            <strong style={{ color: '#2D2D2D' }}>
              {format(new Date(wedding.rsvp_deadline), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </strong>
          </span>
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelClass} style={labelStyle}>Tu nombre completo *</label>
        <input
          {...register('guest_name')}
          placeholder="Ej: Ana García López"
          className={inputClass}
          style={inputStyle}
        />
        {errors.guest_name && (
          <p className="mt-1 text-xs text-red-500">{errors.guest_name.message}</p>
        )}
      </div>

      {/* Attendance */}
      <div>
        <label className={labelClass} style={labelStyle}>¿Asistirás a la boda? *</label>
        <div className="grid grid-cols-2 gap-3">
          <RadioOption name="attendance" value="yes" emoji="🥂" label="Sí, allí estaré" />
          <RadioOption name="attendance" value="no" emoji="😔" label="No podré asistir" />
        </div>
        {errors.attendance && (
          <p className="mt-1 text-xs text-red-500">Por favor confirma tu asistencia</p>
        )}
      </div>

      {/* Conditional fields for attending guests */}
      {isAttending && (
        <>
          {/* Adults */}
          <div>
            <label className={labelClass} style={labelStyle}>¿Cuántos adultos confirmáis? *</label>
            <input
              {...register('adults_count', { valueAsNumber: true })}
              type="number"
              min={1}
              max={20}
              defaultValue={1}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Menu */}
          {menuOptions.length > 0 && (
            <div>
              <label className={labelClass} style={labelStyle}>Elección de menú (por adulto) *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {menuOptions.map((opt) => {
                  const checked = watch('menu_option_id') === opt.id
                  return (
                    <label
                      key={opt.id}
                      className={radioClass}
                      style={{
                        borderColor: checked ? '#C9A84C' : '#F4D7D7',
                        backgroundColor: checked ? '#FBF5E6' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        value={opt.id}
                        className="sr-only"
                        {...register('menu_option_id')}
                      />
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="text-sm font-medium" style={{ color: '#2D2D2D' }}>{opt.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Children */}
          <div>
            <label className={labelClass} style={labelStyle}>¿Vendrás con niños?</label>
            <div className="grid grid-cols-2 gap-3">
              <RadioOption name="has_children" value="yes" emoji="👧" label="Sí, con niños" />
              <RadioOption name="has_children" value="no" emoji="🚫" label="Sin niños" />
            </div>
          </div>

          {bringsChildren && (
            <>
              <div>
                <label className={labelClass} style={labelStyle}>¿Cuántos niños?</label>
                <input
                  {...register('children_count', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={1}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer"
                  style={{ borderColor: '#F4D7D7', backgroundColor: 'white' }}
                >
                  <input
                    type="checkbox"
                    {...register('children_want_menu')}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#C9A84C' }}
                  />
                  <span className="text-sm" style={{ color: '#2D2D2D' }}>
                    Los niños quieren menú infantil
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Bus */}
          {wedding.bus_enabled && (
            <div>
              <label className={labelClass} style={labelStyle}>¿Necesitáis autobús?</label>
              <div className="grid grid-cols-2 gap-3">
                <RadioOption name="needs_bus" value="yes" emoji="🚌" label="Sí, necesito autobús" />
                <RadioOption name="needs_bus" value="no" emoji="🚗" label="Tengo transporte" />
              </div>
            </div>
          )}

          {/* Allergies */}
          <div>
            <label className={labelClass} style={labelStyle}>
              Alergias o restricciones alimentarias
            </label>
            <textarea
              {...register('allergies')}
              rows={2}
              placeholder="Ej: alergia al gluten, intolerancia a la lactosa..."
              className={inputClass}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* Song */}
          <div>
            <label className={labelClass} style={labelStyle}>
              🎵 ¿Qué canción no puede faltar?
            </label>
            <input
              {...register('song_request')}
              placeholder="Artista – Título de la canción"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </>
      )}

      {/* Message */}
      <div>
        <label className={labelClass} style={labelStyle}>
          Mensaje para los novios (opcional)
        </label>
        <textarea
          {...register('message')}
          rows={3}
          placeholder="Escríbenos lo que quieras 💌"
          className={inputClass}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      {/* Submit */}
      {status === 'error' && (
        <p className="text-sm text-red-500 text-center">
          Ha ocurrido un error. Por favor inténtalo de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#C9A84C' }}
      >
        {status === 'submitting' ? 'Enviando...' : 'Confirmar asistencia'}
      </button>
    </form>
  )
}
