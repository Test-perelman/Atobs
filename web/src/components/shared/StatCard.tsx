import clsx from 'clsx'

interface Props {
  label: string
  value: number | string
  active?: boolean
  onClick?: () => void
  color?: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'default'
}

export default function StatCard({ label, value, active, onClick, color = 'default' }: Props) {
  const colorMap = {
    purple: 'bg-brand-100 border-brand-300 text-brand-800',
    blue:   'bg-blue-50 border-blue-200 text-blue-800',
    green:  'bg-green-50 border-green-200 text-green-800',
    red:    'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    default:'bg-white border-gray-200 text-gray-800',
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'px-5 py-4 border-b-2 sm:border-b-0 sm:border-r last:border-0 text-center',
        onClick && 'cursor-pointer hover:bg-gray-50 transition-colors',
        active ? colorMap[color] || colorMap.purple : 'bg-white text-gray-800'
      )}
    >
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{label}</div>
    </div>
  )
}
