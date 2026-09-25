import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Loader2, LucideIcon, MoreVertical, X } from 'lucide-react';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'ai';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-charcoal text-white border-2 border-black shadow-hard-sm hover:bg-black hover:-translate-y-px active:translate-y-0 active:shadow-none',
  outline: 'bg-white text-charcoal border-2 border-charcoal hover:bg-charcoal hover:text-white',
  ghost: 'text-gray-600 hover:bg-black/5 hover:text-black',
  danger: 'text-red-700 border-2 border-red-200 bg-white hover:bg-red-50',
  ai: 'bg-brand-blue text-white border-2 border-brand-blue hover:bg-brand-blue/90',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', icon: Icon, loading, className = '', children, disabled, ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 ${
      size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-base'
    } ${VARIANTS[variant]} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4 shrink-0" />}
    {children}
  </button>
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, active, className = '', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md transition-colors ${active ? 'bg-black/10 text-black' : 'text-gray-500 hover:bg-black/5 hover:text-black'} ${className}`}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </button>
  ),
);

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }> = ({
  open, onClose, title, children, wide,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start md:items-center justify-center p-4 overflow-y-auto" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-cream border-2 border-black shadow-hard w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-lg my-8`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-2xl font-serif">{title}</h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
};

export const Menu: React.FC<{ label?: string; icon?: LucideIcon; children: React.ReactNode; trigger?: React.ReactNode }> = ({
  label = 'More actions', icon = MoreVertical, children, trigger,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      {trigger ? (
        <div onClick={() => setOpen(!open)}>{trigger}</div>
      ) : (
        <IconButton icon={icon} label={label} active={open} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} />
      )}
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg py-1" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
};

export const MenuItem: React.FC<{ icon?: LucideIcon; onClick: () => void; danger?: boolean; children: React.ReactNode }> = ({ icon: Icon, onClick, danger, children }) => (
  <button
    role="menuitem"
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 ${danger ? 'text-red-700' : 'text-gray-800'}`}
  >
    {Icon && <Icon className="w-4 h-4 shrink-0" />}
    {children}
  </button>
);

export const MenuDivider = () => <div className="my-1 border-t border-gray-100" />;

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block font-bold text-gray-600 uppercase tracking-wider text-[11px] mb-1.5">
    {children}
  </label>
);

export const inputClass =
  'w-full bg-white border-2 border-gray-200 px-3 py-2 text-sm rounded-md focus:border-black focus:outline-none transition-colors placeholder:text-gray-400';

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }> = ({ minRows = 3, className = '', value, ...props }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Grow with content so long scripts don't need an inner scrollbar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} rows={minRows} value={value} className={`${inputClass} resize-none leading-relaxed ${className}`} {...props} />;
};

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
    <input type="checkbox" className="w-4 h-4 accent-black" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);

export const EmptyState: React.FC<{ icon: LucideIcon; title: string; children?: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <div className="text-center py-10 px-4 text-gray-500">
    <Icon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
    <p className="font-medium text-gray-700">{title}</p>
    {children && <div className="text-sm mt-1">{children}</div>}
  </div>
);
