'use client'
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Wedding, MenuOption, BusOption } from '@/lib/types'
import { HoneypotField } from '@/components/HoneypotField'

const schema = z.object({
  guest_name: z.string().min(2, 'Por favor introduce tu nombre'),
  attendance: z.enum(['yes', 'no']),
  adults_count: z.number().min(1).max(20).optional(),
  has_children: z.enum(['yes', 'no']).optional(),
  children_count: z.number().min(0).max(20).optional(),
  song_request: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>
type Status = 'idle' | 'submitting' | 'success' | 'error'

function busOptionFromCheckboxes(ida: boolean, vuelta: boolean): BusOption {
  if (ida && vuelta) return 'both'
  if (ida) return 'outbound'
  if (vuelta) return 'return'
  return 'none'
}

const radioClass = 'flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:border-amber-300 text-center'

function MenuGrid({
  selectedId,
  onSelect,
  menuOptions,
}: {
  selectedId: string
  onSelect: (id: string) => void
  menuOptions: MenuOption[]
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {menuOptions.map(opt => {
        const checked = selectedId === opt.id
        return (
          <label
            key={opt.id}
            className={radioClass}
            style={{ borderColor: checked ? 'var(--w-primary)' : 'var(--w-accent)', backgroundColor: checked ? 'var(--w-bg)' : 'white' }}
          >
            <input type="radio" checked={checked} onChange={() => onSelect(opt.id)} className="sr-only" />
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--w-dark)' }}>{opt.name}</span>
          </label>
        )
      })}
    </div>
  )
}

export function RSVPForm({ wedding, menuOptions }: { wedding: Wedding; menuOptions: MenuOption[] }) {
  const [status, setStatus] = useState<Status>('idle')
  const [adultMenus, setAdultMenus] = useState<string[]>([''])
  const [adultNames, setAdultNames] = useState<string[]>([''])
  const [adultAllergies, setAdultAllergies] = useState<string[]>([''])
  const [childrenData, setChildrenData] = useState<{ name: string; wantsMenu: boolean; menuId: string; allergies: string }[]>([])
  const [busIda, setBusIda] = useState(false)
  const [busVuelta, setBusVuelta] = useState(false)
  const [hp, setHp] = useState('')
  const loadedAt = useRef(0)
  useEffect(() => { loadedAt.current = Date.now() }, [])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adults_count: 1 },
  })

  const attendance = watch('attendance')
  const hasChildren = watch('has_children')
  const guestName = watch('guest_name')
  const rawAdultsCount = watch('adults_count')
  const rawChildrenCount = watch('children_count')
  const adultsCount = Math.max(1, Number(rawAdultsCount) || 1)
  const childrenCount = Math.max(0, Number(rawChildrenCount) || 0)
  const isAttending = attendance === 'yes'
  const bringsChildren = hasChildren === 'yes'

  useEffect(() => {
    setAdultMenus(prev => {
      const arr = [...prev]
      while (arr.length < adultsCount) arr.push('')
      return arr.slice(0, adultsCount)
    })
    setAdultNames(prev => {
      const arr = [...prev]
      while (arr.length < adultsCount) arr.push('')
      return arr.slice(0, adultsCount)
    })
    setAdultAllergies(prev => {
      const arr = [...prev]
      while (arr.length < adultsCount) arr.push('')
      return arr.slice(0, adultsCount)
    })
  }, [adultsCount])


  useEffect(() => {
    setChildrenData(prev => {
      const arr = [...prev]
      while (arr.length < childrenCount) arr.push({ name: '', wantsMenu: false, menuId: '', allergies: '' })
      return arr.slice(0, childrenCount)
    })
  }, [childrenCount])

  function buildAllergies(): string {
    const parts: string[] = []
    if (adultsCount === 1) {
      if (adultAllergies[0]?.trim()) parts.push(adultAllergies[0].trim())
    } else {
      adultAllergies.forEach((a, i) => {
        if (a?.trim()) {
          const name = i === 0 ? guestName : (adultNames[i]?.trim() || `Adulto ${i + 1}`)
          parts.push(`${name}: ${a.trim()}`)
        }
      })
    }
    childrenData.forEach((c, i) => {
      if (c.allergies?.trim()) {
        const name = c.name?.trim() || `Niño/a ${i + 1}`
        parts.push(`${name}: ${c.allergies.trim()}`)
      }
    })
    return parts.join(' | ')
  }

  async function onSubmit(values: FormValues) {
    if (hp) { setStatus('success'); return }
    if (Date.now() - loadedAt.current < 2000) {
      setStatus('error')
      return
    }
    setStatus('submitting')
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          wedding_id: wedding.id,
          adult_names: isAttending && adultsCount > 1
            ? [values.guest_name, ...adultNames.slice(1).map(n => n.trim()).filter(Boolean)]
            : [],
          adult_menus: isAttending ? adultMenus : [],
          children_names: isAttending && bringsChildren ? childrenData.map(c => c.name) : [],
          children_menus: isAttending && bringsChildren
            ? childrenData.map(c => c.wantsMenu ? (c.menuId || null) : null)
            : [],
          bus_option: isAttending ? busOptionFromCheckboxes(busIda, busVuelta) : 'none',
          allergies: isAttending ? buildAllergies() : null,
          hp_website: hp,
          submitted_ms: Date.now() - loadedAt.current,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const deadlinePassed = !!wedding.rsvp_deadline && new Date(wedding.rsvp_deadline) < new Date()

  if (deadlinePassed) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-4">📅</div>
        <h3 className="text-xl mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
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
        <h3 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
          ¡Gracias por confirmar!
        </h3>
        <p style={{ color: '#555555' }}>Hemos recibido tu respuesta. ¡Nos vemos el gran día!</p>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }
  const labelClass = 'block text-sm font-medium mb-2'
  const labelStyle = { color: '#555555' }

  function RadioOption({ name, value, label, emoji }: { name: keyof FormValues; value: string; label: string; emoji?: string }) {
    const checked = watch(name) === value
    return (
      <label className={radioClass} style={{ borderColor: checked ? 'var(--w-primary)' : 'var(--w-accent)', backgroundColor: checked ? 'var(--w-bg)' : 'white' }}>
        <input type="radio" value={value} className="sr-only" {...register(name)} />
        {emoji && <span className="text-lg">{emoji}</span>}
        <span className="text-sm font-medium" style={{ color: 'var(--w-dark)' }}>{label}</span>
      </label>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <HoneypotField onChange={setHp} />
      {/* Deadline banner */}
      {wedding.rsvp_deadline && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'var(--w-bg)', border: '1px solid var(--w-primary)' }}>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--w-primary)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span style={{ color: '#555555' }}>
            Fecha límite:{' '}
            <strong style={{ color: 'var(--w-dark)' }}>
              {format(new Date(wedding.rsvp_deadline), "d 'de' MMMM 'de' yyyy", { locale: es })}
            </strong>
          </span>
        </div>
      )}

      {/* Name */}
      <div>
        <label className={labelClass} style={labelStyle}>Tu nombre completo *</label>
        <input {...register('guest_name')} placeholder="Ej: Ana García López" className={inputClass} style={inputStyle} />
        {errors.guest_name && <p className="mt-1 text-xs text-red-500">{errors.guest_name.message}</p>}
      </div>

      {/* Attendance */}
      <div>
        <label className={labelClass} style={labelStyle}>¿Asistirás a la boda? *</label>
        <div className="grid grid-cols-2 gap-3">
          <RadioOption name="attendance" value="yes" emoji="🥂" label="Sí, allí estaré" />
          <RadioOption name="attendance" value="no" emoji="😔" label="No podré asistir" />
        </div>
        {errors.attendance && <p className="mt-1 text-xs text-red-500">Por favor confirma tu asistencia</p>}
      </div>

      {isAttending && (
        <>
          {/* Adults count */}
          <div>
            <label className={labelClass} style={labelStyle}>¿Cuántos adultos confirmáis? *</label>
            <input
              {...register('adults_count', { valueAsNumber: true })}
              type="number" min={1} max={20}
              className={inputClass} style={inputStyle}
            />
          </div>

          {/* Per-adult cards when >1: name + menu */}
          {adultsCount > 1 && (
            <div className="space-y-3">
              {Array.from({ length: adultsCount }, (_, i) => (
                <div key={i} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--w-bg)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--w-dark)' }}>
                    {i === 0 ? `Tú · ${guestName || 'Adulto 1'}` : `Adulto ${i + 1}`}
                  </p>
                  {i > 0 && (
                    <input
                      value={adultNames[i] ?? ''}
                      onChange={e => setAdultNames(prev => prev.map((n, idx) => idx === i ? e.target.value : n))}
                      placeholder="Nombre completo"
                      className={inputClass}
                      style={inputStyle}
                    />
                  )}
                  {menuOptions.length > 0 && (
                    <MenuGrid
                      selectedId={adultMenus[i] ?? ''}
                      onSelect={id => setAdultMenus(prev => prev.map((m, idx) => idx === i ? id : m))}
                      menuOptions={menuOptions}
                    />
                  )}
                  <input
                    value={adultAllergies[i] ?? ''}
                    onChange={e => setAdultAllergies(prev => prev.map((a, idx) => idx === i ? e.target.value : a))}
                    placeholder="Alergias o restricciones (opcional)"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Single adult: menu + allergies */}
          {adultsCount === 1 && (
            <div className="space-y-3">
              {menuOptions.length > 0 && (
                <div>
                  <label className={labelClass} style={labelStyle}>Elección de menú</label>
                  <MenuGrid
                    selectedId={adultMenus[0] ?? ''}
                    onSelect={id => setAdultMenus([id])}
                    menuOptions={menuOptions}
                  />
                </div>
              )}
              <div>
                <label className={labelClass} style={labelStyle}>Alergias o restricciones alimentarias</label>
                <input
                  value={adultAllergies[0] ?? ''}
                  onChange={e => setAdultAllergies([e.target.value])}
                  placeholder="Ej: gluten, lactosa... (opcional)"
                  className={inputClass}
                  style={inputStyle}
                />
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
                  type="number" min={1} max={20}
                  className={inputClass} style={inputStyle}
                />
              </div>

              {childrenCount > 0 && (
                <div className="space-y-3">
                  {Array.from({ length: childrenCount }, (_, i) => (
                    <div key={i} className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--w-bg)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--w-dark)' }}>
                        {childrenCount === 1 ? 'El niño/a' : `Niño/a ${i + 1}`}
                      </p>
                      <input
                        value={childrenData[i]?.name ?? ''}
                        onChange={e => setChildrenData(prev => prev.map((c, idx) => idx === i ? { ...c, name: e.target.value } : c))}
                        placeholder="Nombre completo"
                        className={inputClass}
                        style={inputStyle}
                      />
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={childrenData[i]?.wantsMenu ?? false}
                          onChange={e => setChildrenData(prev => prev.map((c, idx) =>
                            idx === i ? { ...c, wantsMenu: e.target.checked, menuId: e.target.checked ? c.menuId : '' } : c
                          ))}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: 'var(--w-primary)' }}
                        />
                        <span className="text-sm" style={{ color: 'var(--w-dark)' }}>¿Quiere menú infantil?</span>
                      </label>
                      {menuOptions.length > 0 && childrenData[i]?.wantsMenu && (
                        <MenuGrid
                          selectedId={childrenData[i]?.menuId ?? ''}
                          onSelect={id => setChildrenData(prev => prev.map((c, idx) => idx === i ? { ...c, menuId: id } : c))}
                          menuOptions={menuOptions}
                        />
                      )}
                      <input
                        value={childrenData[i]?.allergies ?? ''}
                        onChange={e => setChildrenData(prev => prev.map((c, idx) => idx === i ? { ...c, allergies: e.target.value } : c))}
                        placeholder="Alergias o restricciones (opcional)"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Bus */}
          {wedding.bus_enabled && (
            <div>
              <label className={labelClass} style={labelStyle}>¿Necesitas autobús?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Ida', checked: busIda, onChange: setBusIda },
                  { label: 'Vuelta', checked: busVuelta, onChange: setBusVuelta },
                ].map(({ label, checked, onChange }) => (
                  <label
                    key={label}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:border-amber-300"
                    style={{ borderColor: checked ? 'var(--w-primary)' : 'var(--w-accent)', backgroundColor: checked ? 'var(--w-bg)' : 'white' }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => onChange(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--w-primary)' }}
                    />
                    <span className="text-lg">🚌</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--w-dark)' }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Song */}
          <div>
            <label className={labelClass} style={labelStyle}>🎵 ¿Qué canción no puede faltar?</label>
            <input {...register('song_request')} placeholder="Artista – Título de la canción" className={inputClass} style={inputStyle} />
          </div>
        </>
      )}

      {/* Message */}
      <div>
        <label className={labelClass} style={labelStyle}>Mensaje para los novios (opcional)</label>
        <textarea
          {...register('message')}
          rows={3}
          placeholder="Escríbenos lo que quieras 💌"
          className={inputClass}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-500 text-center">Ha ocurrido un error. Por favor inténtalo de nuevo.</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-4 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: 'var(--w-primary)' }}
      >
        {status === 'submitting' ? 'Enviando...' : 'Confirmar asistencia'}
      </button>
    </form>
  )
}
