import React, { useEffect, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { StyledInput } from './StyledInput';
import { useClientes, type ClienteResultado } from '../../hooks/useClientes';

interface ClienteSearchInputProps {
  /** Nombre del cliente (formState.cliente) */
  value: string;
  /** RUC persistido (formState.documento_cliente) — muestra la tarjeta tras recargar */
  documento?: string;
  /** Código persistido (formState.codigo_cliente) — muestra la tarjeta tras recargar */
  codigoCliente?: string;
  /** Al seleccionar un resultado del dropdown */
  onSelect: (cliente: ClienteResultado) => void;
  /** Al limpiar la selección (botón ×) */
  onClear: () => void;
  /** Edición manual del nombre cuando la búsqueda no está disponible */
  onManualChange: (nombre: string) => void;
  variant?: 'devoluciones' | 'pedido' | 'inventario' | 'comparador' | 'default';
  disabled?: boolean;
}

const trimZeros = (s: string) => s.replace(/^0+/, '') || s;

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
 * Búsqueda de cliente con autocompletado, réplica del diseño de
 * g360-order-xlsx (ClientInfo): dropdown con badge de código y vendedor,
 * y tarjeta de confirmación con el detalle del cliente seleccionado.
 * Sin Supabase configurado, degrada a texto libre.
 */
export const ClienteSearchInput: React.FC<ClienteSearchInputProps> = ({
  value,
  documento,
  codigoCliente,
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
  const [seleccionado, setSeleccionado] = useState<ClienteResultado | null>(null);
  const [editando, setEditando] = useState(false);
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
    setSeleccionado(null);
    setEditando(true);
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
    setSeleccionado(cliente);
    setEditando(false);
    setTermino('');
    setAbierto(false);
    setActivo(-1);
    limpiar();
    void index;
  };

  const limpiarSeleccion = () => {
    onClear();
    setSeleccionado(null);
    setEditando(false);
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
    } else if (e.key === 'Enter') {
      // Enter sin navegación previa selecciona el primer resultado
      if (resultados.length > 0) {
        e.preventDefault();
        const idx = activo >= 0 ? activo : 0;
        seleccionar(resultados[idx], idx);
      }
    } else if (e.key === 'Escape') {
      setAbierto(false);
      setActivo(-1);
    }
  };

  // === Cliente seleccionado: tarjeta de detalle (patrón order-xlsx) ===
  // Se muestra con el dato local (recién elegido) o reconstruida desde el
  // store persistido (tras recargar). Mientras el usuario escribe, input.
  if (!editando && (seleccionado || value)) {
    const nombre = seleccionado?.nom_cliente ?? value;
    const ruc = seleccionado?.doc_cliente ?? (documento || null);
    const codigo = seleccionado ? trimZeros(seleccionado.id_cliente) : (codigoCliente || null);
    const vendedor = seleccionado?.nom_vendedor ?? null;
    const idVendedor = seleccionado?.id_vendedor ?? null;
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-in"
        role="status"
        aria-label="Cliente seleccionado"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-success-500) 6%, transparent), color-mix(in srgb, var(--color-success-500) 2%, transparent))',
          border: '1px solid color-mix(in srgb, var(--color-success-500) 30%, transparent)',
        }}
      >
        <div className="flex flex-wrap items-start gap-x-5 gap-y-2 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0 basis-full sm:basis-auto sm:flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">Cliente</span>
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight" title={nombre ?? ''}>
              {nombre || '(sin nombre)'}
            </span>
          </div>
          {ruc && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">RUC</span>
              <span className="text-xs font-semibold font-mono text-[var(--text-primary)] leading-tight">{ruc}</span>
            </div>
          )}
          {codigo && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">Cód. Cliente</span>
              <span className="text-xs font-semibold font-mono text-[var(--text-primary)] leading-tight">{codigo}</span>
            </div>
          )}
          {idVendedor && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">Cód. Vendedor</span>
              <span className="text-xs font-semibold font-mono text-[var(--text-primary)] leading-tight">{idVendedor}</span>
            </div>
          )}
          {vendedor && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-success)]">Vendedor</span>
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate leading-tight" title={vendedor}>{vendedor}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={limpiarSeleccion}
          title="Cambiar cliente"
          aria-label="Cambiar cliente"
          className="w-7 h-7 rounded-md bg-[var(--color-error-500)] text-white flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 hover:shadow-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // === Búsqueda ===
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
          placeholder="Escriba RUC, código o nombre del cliente..."
          variant={variant}
          className="h-7 text-sm pr-12"
          disabled={disabled}
          autoComplete="off"
        />
        {cargando && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-tertiary)] absolute right-3 top-1/2 -translate-y-1/2" />
        )}
        {!cargando && (
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        )}
      </div>

      {abierto && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50 max-h-[280px] overflow-y-auto animate-fade-in"
          role="listbox"
          aria-label="Resultados de cliente"
        >
          {cargando && resultados.length === 0 && (
            <div className="px-3.5 py-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Buscando clientes...
            </div>
          )}
          {!cargando && resultados.length === 0 && (
            <div className="px-3.5 py-3 text-xs italic text-[var(--text-secondary)]">No se encontraron resultados</div>
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
              className={`w-full text-left px-3.5 py-2.5 transition-colors border-b border-[var(--border-secondary)] last:border-b-0 ${i === activo ? 'bg-[var(--bg-tertiary)]' : ''}`}
            >
              <span className="block text-xs font-semibold text-[var(--text-primary)] mb-1 truncate">
                {resaltar(cliente.nom_cliente || '(sin nombre)', termino)}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-success-700)] text-white">
                  {cliente.id_cliente}
                </span>
                {cliente.doc_cliente && (
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">RUC: {cliente.doc_cliente}</span>
                )}
              </span>
              {cliente.nom_vendedor && (
                <span className="block text-[10px] font-medium text-[var(--color-on-surface-success)] mt-1">
                  Vendedor: {cliente.nom_vendedor}
                </span>
              )}
            </button>
          ))}
          {resultados.length > 0 && (
            <div className="hidden sm:flex items-center justify-end gap-2 px-3.5 py-1.5 text-[10px] text-[var(--text-tertiary)]">
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
