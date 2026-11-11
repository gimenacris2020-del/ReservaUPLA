export default function TimeInput({
  label,
  id,
  name,
  value,
  onChange,
  min = '07:00',
  max = '22:00',
  step = '900', // 15 minutos por defecto
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = ''
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <div className="h-5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
          <label htmlFor={inputId} className="flex items-center gap-1 truncate cursor-pointer">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </label>
        </div>
      )}
      <input
        id={inputId}
        name={name}
        type="time"
        value={value ?? ''}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={required}
        className={`block w-full rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm transition-all outline-none font-medium shadow-2xs
          ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-rose-900' : 'border-slate-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-100/80 text-slate-900'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
      />
      {error ? (
        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 font-medium">{helperText}</p>
      ) : null}
    </div>
  );
}
