import { Popover as BasePopover } from '@base-ui/react';
import { Info } from 'lucide-react';

export default function Popover({
  trigger,
  title,
  content,
  children,
  side,
  position = 'top',
  align = 'center',
  className = '',
  triggerClassName = ''
}) {
  const actualSide = side || position || 'top';
  const defaultTriggerClasses =
    'text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-blue-400 inline-flex items-center justify-center';

  return (
    <BasePopover.Root>
      <BasePopover.Trigger
        type="button"
        className={triggerClassName || defaultTriggerClasses}
        aria-label="Ver más información"
      >
        {trigger || <Info className="h-3.5 w-3.5" />}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner side={actualSide} align={align} sideOffset={8} className="z-50">
          <BasePopover.Popup
            className={`w-72 p-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl text-xs border border-slate-700/80 outline-none backdrop-blur-md ${className}`}
          >
            <BasePopover.Arrow className="w-2.5 h-2.5 rotate-45 bg-slate-900 border-slate-700/80 border-b border-r" />
            {title && (
              <BasePopover.Title className="font-extrabold text-sky-400 text-[11px] uppercase tracking-wider mb-2 pb-1.5 border-b border-slate-800 flex items-center justify-between">
                <span>{title}</span>
              </BasePopover.Title>
            )}
            <div className="text-slate-200 text-xs leading-relaxed">
              {content || children}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

