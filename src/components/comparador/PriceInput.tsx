import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface PriceInputProps {
  initialValue: number | null;
  onPriceChange: (value: number | null) => void;
  competidor: string;
  item: { codigo: string; nombre: string };
  size?: 'sm' | 'md' | 'lg';
  isBestOffer?: boolean;
  textColor?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  initialValue,
  onPriceChange,
  competidor,
  item,
  size = 'sm',
  isBestOffer = false,
  textColor,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    initialValue !== null ? initialValue.toFixed(2) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const newValue = initialValue !== null ? initialValue.toFixed(2) : '';
    setDisplayValue(newValue);
  }, [initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const cleanedValue = displayValue.replace(/[^0-9.]/g, '');
    let numericValue: number | null = null;
    let displayValueForUI: string = displayValue;

    if (cleanedValue !== '') {
      const parsed = parseFloat(cleanedValue);
      if (!isNaN(parsed)) {
        numericValue = parseFloat(parsed.toFixed(2));
        displayValueForUI = numericValue.toFixed(2);
      } else {
        displayValueForUI = cleanedValue;
      }
    } else {
      displayValueForUI = '';
    }

    onPriceChange(numericValue);
    setDisplayValue(displayValueForUI);
  };

  const inputStyle: React.CSSProperties = {};
  if (textColor) {
    inputStyle.color = textColor;
    inputStyle.fontWeight = '500';
  }

  const handleDisplayClick = () => {
    setIsFocused(true);
  };

  const consistentClass = 'input-whatif-editable rounded-md border bg-[var(--surface-elevated)] h-6 flex items-center px-1 text-xs font-mono text-right price-cell-45 transition-all duration-200';

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="relative price-input-wrapper group">
      {!isFocused ? (
        <div
          onClick={handleDisplayClick}
          role="button"
          tabIndex={0}
          onFocus={handleDisplayClick}
          aria-label={`Precio actual: ${initialValue !== null ? `S/ ${initialValue.toFixed(2)}` : 'No establecido'}. Presione para editar.`}
          className={`
            ${consistentClass}
            ${isBestOffer
              ? 'border-[var(--color-success)] ring-1 ring-[var(--color-success)]/30 shadow-sm shadow-[var(--color-success)]/10'
              : 'border-[var(--border-secondary)]'}
            cursor-pointer
            ${isDark
              ? 'hover:border-[var(--color-primary-400)] hover:shadow-[0_0_12px_rgba(26,86,219,0.12)] group-hover:bg-[var(--bg-tertiary)]'
              : 'hover:border-[var(--color-primary)] hover:shadow-sm hover:shadow-[var(--color-primary)]/10 group-hover:bg-[var(--bg-tertiary)]'}
          `}
          style={inputStyle}
        >
          {initialValue !== null ? (
            <span className="flex items-center gap-0.5 w-full justify-end">
              <span className="currency-symbol text-[var(--text-secondary)] text-xs">S/</span>
              <span className="text-[var(--text-primary)] font-semibold">{initialValue.toFixed(2)}</span>
            </span>
          ) : (
            <span className="text-[var(--text-secondary)] text-xs italic truncate">Precio en {competidor}</span>
          )}
        </div>
      ) : (
        <input
          type="text"
          aria-label={`Precio de ${item.nombre} en ${competidor}`}
          aria-describedby={`help-${item.codigo}-${competidor}`}
          placeholder={`Precio en ${competidor}`}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          style={inputStyle}
          className={`
            ${consistentClass}
            text-[var(--text-primary)] font-semibold
            ${isBestOffer
              ? 'border-[var(--color-success)] ring-1 ring-[var(--color-success)]/20'
              : isDark
                ? 'border-[var(--color-primary-500)] ring-2 ring-[var(--color-primary)]/15 shadow-[0_0_15px_rgba(26,86,219,0.08)]'
                : 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/20 shadow-sm shadow-[var(--color-primary)]/10'}
          `}
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          autoFocus
        />
      )}

      {isBestOffer && !isFocused && (
        <div className="absolute -right-1.5 -top-1.5 z-10">
          <div className="bg-[var(--color-success)] text-[var(--color-text-inverse)] p-0.5 rounded-full shadow-lg border border-[var(--surface-primary)]" title="Mejor Oferta">
            <Star className="h-2.5 w-2.5" fill="currentColor" />
          </div>
        </div>
      )}
      <div
        id={`help-${item.codigo}-${competidor}`}
        className="sr-only"
      >
        Ingrese el precio en soles peruanos para {item.nombre} en {competidor}
      </div>
      {isFocused && (
        <div className="absolute -top-6 left-0 z-20 px-1.5 py-0.5 text-[10px] rounded shadow-md whitespace-nowrap animate-fade-in" style={{ background: 'var(--surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
          {`Precio ${competidor} en S/`}
        </div>
      )}
    </div>
  );
};