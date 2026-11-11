export default function TableList({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No se encontraron registros.',
  onRowClick = null,
  keyExtractor = (item, index) => item.id || index,
  className = ''
}) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/90 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-5 py-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-[#003366]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span className="text-xs font-bold text-slate-600">Cargando datos institucionales...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-14 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-bold text-slate-700">{emptyMessage}</p>
                    <p className="text-xs text-slate-400">Pruebe ajustando los filtros de búsqueda o criterios de selección.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr
                  key={keyExtractor(item, rowIndex)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-150 hover:bg-blue-50/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => {
                    const value = col.accessor ? item[col.accessor] : null;
                    return (
                      <td
                        key={colIndex}
                        className={`px-5 py-4 whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                      >
                        {col.render ? col.render(item, rowIndex) : value ?? '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
