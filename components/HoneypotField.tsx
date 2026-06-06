export function HoneypotField({ onChange }: { onChange: (v: string) => void }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
