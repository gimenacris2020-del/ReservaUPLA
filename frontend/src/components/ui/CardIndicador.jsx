export default function CardIndicador({
  title,
  value,
  subtitle = '',
  icon: Icon = null,
  color = 'blue', // 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'indigo' | 'upla'
  onClick = null,
  className = ''
}) {
  const colorThemes = {
    blue: {
      bar: 'bg-gradient-to-r from-[#003366] to-sky-500',
      border: 'border-slate-200 hover:border-blue-400',
      text: 'text-[#003366]',
      iconBg: 'bg-blue-50 text-[#003366]',
      badge: 'text-[#003366] bg-blue-50/80 border border-blue-200'
    },
    upla: {
      bar: 'bg-gradient-to-r from-[#002244] to-[#003366]',
      border: 'border-slate-200 hover:border-[#003366]',
      text: 'text-[#003366]',
      iconBg: 'bg-[#003366]/10 text-[#003366]',
      badge: 'text-[#003366] bg-blue-50 border border-blue-200'
    },
    emerald: {
      bar: 'bg-gradient-to-r from-emerald-600 to-teal-400',
      border: 'border-slate-200 hover:border-emerald-400',
      text: 'text-emerald-800',
      iconBg: 'bg-emerald-50 text-emerald-700',
      badge: 'text-emerald-800 bg-emerald-50 border border-emerald-200'
    },
    amber: {
      bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      border: 'border-slate-200 hover:border-amber-400',
      text: 'text-amber-800',
      iconBg: 'bg-amber-50 text-amber-700',
      badge: 'text-amber-800 bg-amber-50 border border-amber-200'
    },
    red: {
      bar: 'bg-gradient-to-r from-rose-600 to-pink-500',
      border: 'border-slate-200 hover:border-rose-400',
      text: 'text-rose-800',
      iconBg: 'bg-rose-50 text-rose-700',
      badge: 'text-rose-800 bg-rose-50 border border-rose-200'
    },
    purple: {
      bar: 'bg-gradient-to-r from-purple-600 to-indigo-500',
      border: 'border-slate-200 hover:border-purple-400',
      text: 'text-purple-800',
      iconBg: 'bg-purple-50 text-purple-700',
      badge: 'text-purple-800 bg-purple-50 border border-purple-200'
    },
    indigo: {
      bar: 'bg-gradient-to-r from-indigo-600 to-sky-500',
      border: 'border-slate-200 hover:border-indigo-400',
      text: 'text-indigo-800',
      iconBg: 'bg-indigo-50 text-indigo-700',
      badge: 'text-indigo-800 bg-indigo-50 border border-indigo-200'
    }
  };

  const theme = colorThemes[color] || colorThemes.blue;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md ${theme.border} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {/* Barra superior de acento temático */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${theme.bar}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none font-mono">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${theme.iconBg}`}>
            <Icon className="h-6 w-6 stroke-[2.2]" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-4 flex items-center text-xs font-bold">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${theme.badge}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
