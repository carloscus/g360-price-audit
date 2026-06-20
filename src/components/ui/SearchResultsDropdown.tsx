import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, X } from 'lucide-react';
import type { IProducto } from '../../interfaces';

interface SearchResultsDropdownProps {
  isOpen: boolean;
  results: IProducto[];
  selectedIds: Set<string>;
  addedIds: Set<string>;
  onToggleSelection: (codigo: string) => void;
  onToggleSelectAll: () => void;
  onAddSelected: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchTerm: string;
  onClose?: () => void;
}

export const SearchResultsDropdown: React.FC<SearchResultsDropdownProps> = ({
  isOpen,
  results,
  selectedIds,
  addedIds,
  onToggleSelection,
  onToggleSelectAll,
  onAddSelected,
  searchInputRef,
  searchTerm,
  onClose,
}) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !searchTerm || results.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-label="Resultados de búsqueda"
      onClick={onClose}
    >
      <div
        className="glass-card overflow-hidden shadow-2xl border-[var(--color-primary-500)]/20 w-full max-w-lg max-h-[80vh] flex flex-col animate-scale-in"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
        role="listbox"
        aria-label="Resultados de búsqueda"
      >
        <div className="flex-shrink-0 border-b border-[var(--border-primary)] p-4" style={{ background: 'var(--surface-secondary)' }}>
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-3 cursor-pointer text-[var(--text-primary)] font-medium hover:text-[var(--color-primary-500)] transition-colors">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selectedIds.size === results.length && results.length > 0
                  ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]'
                  : 'border-[var(--border-primary)]'
              }`}>
                {selectedIds.size === results.length && results.length > 0 && (
                    <Check className="w-3 h-3 text-[var(--color-text-inverse)]" />
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedIds.size === results.length && results.length > 0}
                onChange={onToggleSelectAll}
                className="sr-only"
              />
              <span className="text-sm">Seleccionar todos ({results.length})</span>
            </label>

            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={onAddSelected}
                  className="btn btn-primary text-xs sm:text-sm py-2 px-3"
                >
                  <Check className="w-4 h-4" />
                  <span className="hidden xs:inline">Agregar {selectedIds.size}</span>
                  <span className="xs:hidden">+{selectedIds.size}</span>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors"
                title="Limpiar y cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {results.map((p) => {
            const isAlreadyAdded = addedIds.has(p.codigo);
            const isSelected = selectedIds.has(p.codigo);
            return (
              <div
                key={p.codigo}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => {
                  if (isAlreadyAdded) return;
                  onToggleSelection(p.codigo);
                }}
                onKeyDown={(e) => {
                  if (isAlreadyAdded) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggleSelection(p.codigo);
                  }
                }}
                className={`flex items-start gap-4 p-4 sm:p-3 rounded-lg cursor-pointer transition-all mb-1 ${
                  isAlreadyAdded
                    ? 'opacity-50 cursor-default'
                    : isSelected
                      ? 'bg-[var(--color-primary-500)]/10 border border-[var(--color-primary-400)]/40'
                      : 'hover:bg-[var(--bg-tertiary)] border border-transparent focus:border-[var(--color-primary-400)]/40'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected && !isAlreadyAdded
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]'
                    : 'border-[var(--border-primary)]'
                }`}>
                  {isSelected && !isAlreadyAdded && (
                  <Check className="w-3 h-3 text-[var(--color-text-inverse)]" />
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isAlreadyAdded}
                  onChange={() => onToggleSelection(p.codigo)}
                  className="sr-only"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[var(--text-primary)] truncate">
                    {p.nombre}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-3 mt-1">
                    <span className="font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">{p.codigo}</span>
                    {p.linea && <span>{p.linea}</span>}
                    {isAlreadyAdded && (
                      <span className="inline-flex items-center gap-1 text-[var(--color-warning-500)] font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Ya en lista
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchResultsDropdown;