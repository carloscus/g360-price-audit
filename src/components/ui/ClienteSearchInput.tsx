import React, { useEffect, useRef, useState } from 'react';
import { Check, Search, SearchX, X, Loader2 } from 'lucide-react';
import { StyledInput } from './StyledInput';
import { useClientes, type ClienteResultado } from '../../hooks/useClientes';

interface ClienteSearchInputProps {
  /** Nombre del cliente (formState.cliente) */
  value: string;
  /** Al seleccionar un resultado del dropdown */
  onSelect: (cliente: ClienteResultado) => void;
  /** Al limpiar la selección (botón ×) */
  onClear: () => void;
  /** Edición manual del nombre cuando la búsqueda no está disponible */
  onManualChange: (nombre: string) => void;
  variant?: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';
  disabled?: boolean;
}

const resaltar = (texto: string, term: string): React.ReactNode => {
  if (!term) return texto;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const partes = texto.split(new RegExp(`(${escaped})`, 'ig'));
  return partes.map((parte, i) =>
    parte.toLowerCase() === term.toLowerCase()
      ? <mark key={i} className="bg-transparent font-semibold text-[var(--color-primary-600)]">{parte}</mark>
      : parte
  );
};

/**
 * Búsqueda de cliente con autocompletado (patrón de g360-order-xlsx):
 * escribe RUC, código o nombre; selecciona con click, Enter o ↓↑.
 * Sin Supabase configurado, degrada a texto libre.
 */
export const ClienteSearchInput: React.FC<ClienteSearchInputProps> = ({
  value,
  onSelect,
  onClear,
  onManualChange,
  variant = 'default',
  disabled,
}) => {
  const { resultados, cargando, habilitado, buscar, limpiar } = useClientes();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [termino, setTermino] = useState('');
  const [seleccionado, setSeleccionado] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!abierto) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [abierto]);

  useEffect(() => {
    itemsRef.current[activo]?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  if (!habilitado) {
    return (
      <StyledInput
        id="cliente"
        name="cliente"
        value={value}
        onChange={(e) => onManualChange(e.target.value)}
        placeholder="Nombre o razón social"
        variant={variant}
        className="h-7 text-sm"
        disabled={disabled}
      />
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevo = e.target.value;
    onManualChange(nuevo);
    setSeleccionado(false);
    setTermino(nuevo.trim());
    setActivo(-1);
    if (nuevo.trim().length >= 2) {
      buscar(nuevo);
      setAbierto(true);
    } else {
      limpiar();
      setAbierto(false);
    }
  };

  const seleccionar = (cliente: ClienteResultado, index: number) => {
    onSelect(cliente);
    setSeleccionado(true);
    setTermino('');
    setAbierto(false);
    setActivo(-1);
    limpiar();
    void index;
  };

  const limpiarSeleccion = () => {
    onClear();
    setSeleccionado(false);
    setTermino('');
    limpiar();
    setAbierto(false);
    setActivo(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!abierto || resultados.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivo(prev => (prev + 1) % resultados.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo(prev => (prev <= 0 ? resultados.length - 1 : prev - 1));
    } else if (e.key === 'Enter' && activo >= 0) {
      e.preventDefault();
      seleccionar(resultados[activo], activo);
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setActivo(-1);
    }
  };

  return (
    <div ref={contenedorRef} className="relative">
      <div className="relative">
        <StyledInput
          id="cliente"
          name="cliente"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (resultados.length > 0) setAbierto(true); }}
          placeholder="RUC, código o nombre"
          variant={variant}
          className={`h-7 text-sm pr-16 ${seleccionado ? 'border-[var(--color-success-400)]' : ''}`}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {cargando && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-tertiary)]" />}
          {!cargando && seleccionado && value && (
            <Check className="w-3.5 h-3.5 text-[var(--color-success-500)]" aria-label="Cliente seleccionado" />
          )}
          {value && !cargando && (
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Limpiar cliente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </div>
      </div>

      {abierto && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto animate-fade-in" role="listbox" aria-label="Resultados de cliente">
          {cargando && resultados.length === 0 && (
            <div className="px-3 py-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Buscando clientes...
            </div>
          )}
          {!cargando && resultados.length === 0 && (
            <div className="px-3 py-4 text-center">
              <SearchX className="w-5 h-5 mx-auto text-[var(--text-tertiary)] mb-1.5" />
              <p className="text-xs text-[var(--text-secondary)]">
                Sin resultados para «{termino}»
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Probá con el RUC o el código</p>
            </div>
          )}
          {resultados.map((cliente, i) => (
            <button
              key={cliente.id_cliente}
              ref={(el) => { itemsRef.current[i] = el; }}
              type="button"
              role="option"
              aria-selected={i === activo}
              onClick={() => seleccionar(cliente, i)}
              onMouseEnter={() => setActivo(i)}
              className={`w-full text-left px-3 py-2 transition-colors border-b border-[var(--border-secondary)] last:border-b-0 ${i === activo ? 'bg-[var(--bg-tertiary)]' : ''}`}
            >
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                {resaltar(cliente.nom_cliente || '(sin nombre)', termino)}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono font-semibold text-[var(--color-primary-600)] bg-[var(--color-primary-500)]/10 px-1.5 py-0.5 rounded">
                  {cliente.id_cliente}
                </span>
                {cliente.doc_cliente && (
                  <span className="text-[10px] text-[var(--text-secondary)]">RUC {cliente.doc_cliente}</span>
                )}
                {cliente.nom_vendedor && (
                  <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[140px]">{cliente.nom_vendedor}</span>
                )}
              </div>
            </button>
          ))}
          {resultados.length > 0 && (
            <div className="hidden sm:flex items-center justify-end gap-2 px-3 py-1.5 text-[10px] text-[var(--text-tertiary)]">
              <kbd className="font-mono">↑↓</kbd> navegar
              <kbd className="font-mono">Enter</kbd> seleccionar
              <kbd className="font-mono">Esc</kbd> cerrar
            </div>
          )}
        </div>
      )}
    </div>
  );
};
