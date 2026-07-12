import React, { useRef, useCallback, useState, useEffect } from 'react';

export interface PriceInputEnhancedProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  locked?: boolean;
  type?: 'costo' | 'precio' | 'markup' | 'margen' | 'ganancia' | 'default';
  decimals?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
  showPercent?: boolean;
}

const typeColors = {
	costo: {
		bg: 'bg-[var(--color-input-tint-success-bg)]',
		border: 'border-[var(--color-input-tint-success-border)]',
		borderFocus: 'focus:border-[var(--color-success-500)] focus:ring-[var(--color-input-tint-success-ring)]',
		text: 'text-[var(--color-input-tint-success-text)]',
		locked: 'bg-[var(--color-input-tint-success-bg)]',
	},
	precio: {
		bg: 'bg-[var(--color-input-tint-warning-bg)]',
		border: 'border-[var(--color-input-tint-warning-border)]',
		borderFocus: 'focus:border-[var(--color-warning-500)] focus:ring-[var(--color-input-tint-warning-ring)]',
		text: 'text-[var(--color-input-tint-warning-text)]',
		locked: 'bg-[var(--color-input-tint-warning-bg)]',
	},
	markup: {
		bg: 'bg-[var(--color-input-tint-info-bg)]',
		border: 'border-[var(--color-input-tint-info-border)]',
		borderFocus: 'focus:border-[var(--color-info-500)] focus:ring-[var(--color-input-tint-info-ring)]',
		text: 'text-[var(--color-input-tint-info-text)]',
		locked: 'bg-[var(--color-input-tint-info-bg)]',
	},
	margen: {
		bg: 'bg-[var(--color-input-tint-primary-bg)]',
		border: 'border-[var(--color-input-tint-primary-border)]',
		borderFocus: 'focus:border-[var(--color-primary-500)] focus:ring-[var(--color-input-tint-primary-ring)]',
		text: 'text-[var(--color-input-tint-primary-text)]',
		locked: 'bg-[var(--color-input-tint-primary-bg)]',
	},
	ganancia: {
		bg: 'bg-[var(--color-input-tint-success-bg)]',
		border: 'border-[var(--color-input-tint-success-border)]',
		borderFocus: 'focus:border-[var(--color-success-500)] focus:ring-[var(--color-input-tint-success-ring)]',
		text: 'text-[var(--color-input-tint-success-text)]',
		locked: 'bg-[var(--color-input-tint-success-bg)]',
	},
	default: {
		bg: 'bg-[var(--surface-primary)]',
		border: 'border-[var(--border-primary)]',
		borderFocus: 'focus:border-[var(--color-primary-400)] focus:ring-[var(--color-input-tint-default-ring)]',
		text: 'text-[var(--text-primary)]',
		locked: 'bg-[var(--bg-tertiary)]',
	},
};

const sizeClasses = {
  sm: 'w-20 px-2 py-1 text-[13px]',
  md: 'w-28 px-3 py-2 text-sm',
  lg: 'w-full px-4 py-3 text-base min-h-[44px]',
  mobile: 'w-full px-4 py-3 text-base min-h-[48px]',
};

export const PriceInputEnhanced: React.FC<PriceInputEnhancedProps> = ({
  value,
  onChange,
  placeholder = '0.00',
  disabled = false,
  locked = false,
  type = 'default',
  decimals = 2,
  className = '',
  size = 'md',
  showCurrency = false,
  showPercent = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = typeColors[type];

  const [displayValue, setDisplayValue] = useState<string>(() =>
    value !== null && value !== undefined ? value.toFixed(decimals) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      const newDisplayValue = value !== null && value !== undefined ? value.toFixed(decimals) : '';
      setDisplayValue(newDisplayValue);
    }
  }, [value, decimals, isFocused]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanedValue = inputValue.replace(/[^0-9.-]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      return;
    }
    setDisplayValue(cleanedValue);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (displayValue === '' || displayValue === '-') {
      onChange(null);
      setDisplayValue('');
      return;
    }

    const numValue = parseFloat(displayValue);
    if (!isNaN(numValue)) {
      const roundedValue = parseFloat(numValue.toFixed(decimals));
      onChange(roundedValue);
      setDisplayValue(roundedValue.toFixed(decimals));
    } else {
      setDisplayValue('');
      onChange(null);
    }
  }, [displayValue, onChange, decimals]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  const getColorClasses = () => {
    if (locked) {
      return `${colors.locked} cursor-not-allowed opacity-90 border-2 border-dashed border-[var(--border-secondary)]`;
    }
    if (disabled) {
      return 'bg-[var(--bg-tertiary)] cursor-not-allowed opacity-50 border-2 border-[var(--border-secondary)]';
    }
    return `${colors.bg} ${colors.border} ${colors.borderFocus}`;
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {showCurrency && (
        <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${colors.text} pointer-events-none`}>
          S/
        </span>
      )}

      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || locked}
        placeholder={placeholder}
        className={`
          ${sizeClasses[size]}
          ${getColorClasses()}
          ${showCurrency ? 'pl-8' : ''}
          ${showPercent ? 'pr-8' : ''}
          rounded-lg
          text-right
          font-mono
          font-semibold
          border
          transition-all
          duration-200
          focus:outline-none
          focus:ring-2
          ${colors.text}
          ${locked ? 'shadow-inner' : ''}
        `}
      />

      {showPercent && (
        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${colors.text} pointer-events-none`}>
          %
        </span>
      )}

      {locked && (
        <div className="absolute -right-2 -top-2 bg-[var(--color-warning-500)] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-[var(--surface-primary)]" title="Campo bloqueado (calculado automáticamente)">
          <svg className="w-3 h-3 text-[var(--color-text-inverse)]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};

interface ColoredHeaderProps {
  children: React.ReactNode;
  type?: 'costo' | 'precio' | 'markup' | 'margen' | 'ganancia' | 'default';
  className?: string;
  icon?: React.ReactNode;
  tooltip?: string;
}

export const ColoredHeader: React.FC<ColoredHeaderProps> = ({
  children,
  type = 'default',
  className = '',
  icon,
  tooltip,
}) => {
  const colors = typeColors[type];
  const headerBgMap = {
    costo: 'bg-[var(--color-success-500)]',
    precio: 'bg-[var(--color-warning-500)]',
    markup: 'bg-[var(--color-info-500)]',
    margen: 'bg-[var(--color-primary-500)]',
    ganancia: 'bg-[var(--color-success-500)]',
    default: 'bg-[var(--color-grey-500)]',
  };

  return (
    <th
      className={`
    ${headerBgMap[type]}
  text-[var(--color-text-inverse)]
        font-semibold
        px-4
        py-3
        text-[11px]
        text-center
        ${className}
      `}
      title={tooltip}
    >
      <span className="flex items-center justify-center gap-1">
        {icon}
        {children}
      </span>
    </th>
  );
};

export interface PercentageDisplayProps {
  value: number | null;
  type?: 'markup' | 'margen';
  showSign?: boolean;
  className?: string;
}

export const PercentageDisplay: React.FC<PercentageDisplayProps> = ({
  value,
  type = 'margen',
  showSign = true,
  className = '',
}) => {
  if (value === null || value === undefined) {
    return <span className={`text-[var(--text-tertiary)] ${className}`}>-</span>;
  }

const getColorClass = () => {
      if (value > 0) {
        return type === 'margen'
          ? 'text-[var(--color-on-surface-success)] bg-[var(--color-input-tint-success-bg)]'
          : 'text-[var(--color-on-surface-info)] bg-[var(--color-input-tint-info-bg)]';
      }
      if (value < 0) {
        return 'text-[var(--color-on-surface-error)] bg-[var(--color-input-tint-error-bg)]';
      }
      return 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]';
  };

  const formatPercent = (val: number): string => {
    const sign = showSign && val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  return (
    <span className={`
      inline-flex
      items-center
      px-2
      py-0.5
      rounded-md
      text-[13px]
      font-mono
      font-semibold
      ${getColorClass()}
      ${className}
    `}>
      {formatPercent(value)}
    </span>
  );
};

export interface ProfitDisplayProps {
  value: number | null;
  showCurrency?: boolean;
  className?: string;
}

export const ProfitDisplay: React.FC<ProfitDisplayProps> = ({
  value,
  showCurrency = true,
  className = '',
}) => {
  if (value === null || value === undefined) {
    return <span className={`text-[13px] font-mono text-[var(--text-tertiary)] ${className}`}>-</span>;
  }

  const getColorClass = () => {
    if (value > 0) return 'text-[var(--color-on-surface-success)]';
    if (value < 0) return 'text-[var(--color-on-surface-error)]';
    return 'text-[var(--text-tertiary)]';
  };

  const formatValue = (val: number): string => {
    const prefix = showCurrency ? 'S/ ' : '';
    const sign = val < 0 ? '-' : '';
    return `${sign}${prefix}${Math.abs(val).toFixed(2)}`;
  };

  return (
    <span className={`
      font-mono
      font-semibold
      ${getColorClass()}
      ${className}
    `}>
      {formatValue(value)}
    </span>
  );
};

export default PriceInputEnhanced;