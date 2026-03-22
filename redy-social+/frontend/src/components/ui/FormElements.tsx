import React from 'react';
import { clsx } from 'clsx';

export function Select({ 
  label, 
  error, 
  children, 
  className,
  ...props 
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-3 py-2 bg-surface border border-surface-light rounded-lg',
          'text-gray-100 placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Textarea({ 
  label, 
  error, 
  className,
  rows = 4,
  ...props 
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'w-full px-3 py-2 bg-surface border border-surface-light rounded-lg',
          'text-gray-100 placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'resize-none',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Checkbox({ 
  label, 
  error,
  className,
  ...props 
}) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        className={clsx(
          'w-4 h-4 rounded bg-surface border-surface-light',
          'text-primary focus:ring-primary focus:ring-offset-0',
          'checked:bg-primary checked:border-primary',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {label && (
        <label className="text-sm text-gray-300 cursor-pointer">
          {label}
        </label>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Radio({ 
  label, 
  options, 
  name, 
  value,
  onChange,
  error 
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label 
            key={option.value} 
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-primary bg-surface border-surface-light focus:ring-primary"
            />
            <span className="text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Toggle({ 
  label, 
  checked, 
  onChange,
  disabled 
}) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={clsx(
          'w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-surface-light'
        )} />
        <div className={clsx(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
          checked && 'translate-x-5'
        )} />
      </div>
      {label && (
        <span className="text-sm text-gray-300">{label}</span>
      )}
    </label>
  );
}

export function Badge({ 
  children, 
  variant = 'default',
  className 
}) {
  const variants = {
    default: 'bg-surface-light text-gray-300',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400'
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

export function Avatar({ 
  src, 
  alt, 
  fallback,
  size = 'md',
  className 
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const [imageError, setImageError] = React.useState(false);

  if (!src || imageError) {
    return (
      <div className={clsx(
        'rounded-full bg-surface-light flex items-center justify-center',
        'text-gray-400 font-medium',
        sizes[size],
        className
      )}>
        {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setImageError(true)}
      className={clsx(
        'rounded-full object-cover',
        sizes[size],
        className
      )}
    />
  );
}

export function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <svg
      className={clsx('animate-spin text-primary', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div 
      className={clsx(
        'animate-pulse bg-surface-light rounded',
        className
      )}
      {...props}
    />
  );
}

export function Progress({ 
  value, 
  max = 100, 
  variant = 'primary',
  showLabel = false,
  className 
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const variants = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className="w-full h-2 bg-surface-light rounded-full overflow-hidden">
        <div 
          className={clsx('h-full transition-all', variants[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = React.useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div className={clsx(
          'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap',
          positions[position]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-surface-light">
      <nav className="-mb-px flex space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'py-3 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-2 py-0.5 bg-surface-light rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Dropdown({ 
  trigger, 
  children, 
  align = 'right',
  className 
}) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const aligns = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={clsx(
          'absolute z-50 mt-2 py-1 bg-surface border border-surface-light rounded-lg shadow-lg',
          aligns[align],
          className
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ 
  children, 
  onClick, 
  icon,
  danger = false 
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center space-x-2 px-4 py-2 text-sm text-left',
        danger 
          ? 'text-red-400 hover:bg-red-500/10' 
          : 'text-gray-300 hover:bg-surface-light hover:text-white'
      )}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

export default {
  Select,
  Textarea,
  Checkbox,
  Radio,
  Toggle,
  Badge,
  Avatar,
  Spinner,
  Skeleton,
  Progress,
  Tooltip,
  Tabs,
  Dropdown,
  DropdownItem
};
