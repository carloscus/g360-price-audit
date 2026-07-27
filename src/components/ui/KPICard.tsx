import React from 'react';

type KPICardColor = 'primary' | 'success' | 'danger' | 'info' | 'neutral';
type KPICardSize = 'sm' | 'lg';

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: KPICardColor;
  size?: KPICardSize;
  highlight?: boolean;
}

const colorClasses: Record<KPICardColor, { bg: string; border: string; iconBg: string; iconText: string; label: string; value: string; sub: string }> = {
  primary: {
    bg: 'bg-[var(--surface-elevated)]',
    border: 'border-[var(--color-primary-200)]',
    iconBg: 'bg-[var(--color-primary-500)]',
    iconText: 'text-[var(--color-text-inverse)]',
    label: 'text-[var(--color-on-surface-primary)]',
    value: 'text-[var(--color-on-surface-primary)]',
    sub: 'text-[var(--color-primary-500)]',
  },
  success: {
    bg: 'bg-[var(--surface-elevated)]',
    border: 'border-[var(--color-success-200)]',
    iconBg: 'bg-[var(--color-success-500)]',
    iconText: 'text-[var(--color-text-inverse)]',
    label: 'text-[var(--color-on-surface-success)]',
    value: 'text-[var(--color-on-surface-success)]',
    sub: 'text-[var(--color-success-500)]',
  },
  danger: {
    bg: 'bg-[var(--surface-elevated)]',
    border: 'border-[var(--color-error-200)]',
    iconBg: 'bg-[var(--color-error-500)]',
    iconText: 'text-[var(--color-text-inverse)]',
    label: 'text-[var(--color-on-surface-error)]',
    value: 'text-[var(--color-on-surface-error)]',
    sub: 'text-[var(--color-error-500)]',
  },
  info: {
    bg: 'bg-[var(--surface-elevated)]',
    border: 'border-[var(--color-info-200)]',
    iconBg: 'bg-[var(--color-info-500)]',
    iconText: 'text-[var(--color-text-inverse)]',
    label: 'text-[var(--color-on-surface-info)]',
    value: 'text-[var(--color-info-700)]',
    sub: 'text-[var(--color-info-500)]',
  },
  neutral: {
    bg: 'bg-[var(--bg-secondary)]',
    border: 'border-[var(--border-primary)]',
    iconBg: 'bg-[var(--text-tertiary)]',
    iconText: 'text-[var(--color-text-inverse)]',
    label: 'text-[var(--text-secondary)]',
    value: 'text-[var(--text-primary)]',
    sub: 'text-[var(--text-tertiary)]',
  },
};

export const KPICard: React.FC<KPICardProps> = ({
  icon,
  label,
  value,
  subValue,
  color,
  size = 'sm',
  highlight = false,
}) => {
  const classes = colorClasses[color];
  const isLarge = size === 'lg';

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all duration-200
        ${classes.bg} ${classes.border}
        ${highlight ? 'ring-2 ring-offset-2 ring-[var(--color-warning-400)]' : ''}
        ${isLarge ? 'shadow-sm' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            rounded-lg flex items-center justify-center flex-shrink-0
            ${classes.iconBg} ${classes.iconText}
            ${isLarge ? 'w-10 h-10' : 'w-8 h-8'}
          `}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span
            className={`
              font-semibold uppercase tracking-wide block
              ${classes.label}
              ${isLarge ? 'text-[11px]' : 'text-[10px]'}
            `}
          >
            {label}
          </span>
          <span
            className={`
              font-bold font-mono block mt-0.5 leading-tight
              ${classes.value}
              ${isLarge ? 'text-xl' : 'text-sm'}
            `}
          >
            {value}
          </span>
          {subValue && (
            <span
              className={`
                block mt-0.5 leading-tight
                ${classes.sub}
                ${isLarge ? 'text-xs' : 'text-[11px]'}
              `}
            >
              {subValue}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
