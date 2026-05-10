'use client'
import { useEffect, useState } from 'react'
import { getCountdownParts } from '@/lib/utils'

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [parts, setParts] = useState(getCountdownParts(targetDate))

  useEffect(() => {
    const id = setInterval(() => setParts(getCountdownParts(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  const units = [
    { label: 'Días', value: parts.days },
    { label: 'Horas', value: parts.hours },
    { label: 'Min', value: parts.minutes },
    { label: 'Seg', value: parts.seconds },
  ]

  return (
    <div className="flex gap-4 justify-center">
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span
            className="text-4xl md:text-5xl font-bold text-white tabular-nums"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span className="text-xs text-white/70 uppercase tracking-widest mt-1">{label}</span>
        </div>
      ))}
    </div>
  )
}
