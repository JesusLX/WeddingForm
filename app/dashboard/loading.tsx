export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#C9A84C', borderTopColor: 'transparent' }}
        aria-label="Cargando"
      />
    </div>
  )
}
