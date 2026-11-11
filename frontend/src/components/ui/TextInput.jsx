export default function TextInput({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  icon: Icon = null,
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
      <div className="relative rounded-xl shadow-2xs">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`block w-full rounded-xl border bg-slate-50/50 hover:bg-white focus:bg-white py-2.5 text-sm transition-all outline-none font-medium
            ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'}
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 text-rose-900' : 'border-slate-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-100/80 text-slate-900'}
            ${disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
