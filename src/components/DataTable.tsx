import React, { useState, useMemo } from 'react';
import { Inbox, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { useAppStore } from '../store/useAppStore';

export interface IColumn<T> {
  key?: string;
  header: React.ReactNode;
  accessor: keyof T | (string & {});
  cellRenderer?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  cellClassName?: string;
  headerClassName?: string;
  tooltip?: string;
  sortable?: boolean;
  onSort?: (key: string) => void;
}

interface Props<T> {
  data: T[];
  columns: IColumn<T>[];
  noDataMessage?: string;
  compact?: boolean;
  colClasses?: string[];
  tableClassName?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  expandable?: boolean;
  renderExpansion?: (row: T) => React.ReactNode;
  pageSize?: number;
}

/**
 * Componente DataTable Genérico Mejorado
 */
export const DataTable = <T extends { codigo: string }>({
   data = [],
   columns,
   noDataMessage = 'No hay productos en la lista.',
   compact = false,
   striped = true,
   colClasses = [],
   tableClassName = '',
   selectable = false,
   selectedIds = new Set(),
   onSelectionChange,
   expandable = false,
   renderExpansion,
   pageSize = 50,
  }: Props<T> & { striped?: boolean }) => {
    const compactClasses = compact ? 'table-compact' : '';
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(data.map(d => d.codigo)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  if (safeCurrentPage !== currentPage) setCurrentPage(safeCurrentPage);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safeCurrentPage, pageSize]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formState = useAppStore((state) => state.formState);
  const filteredColumns = useMemo(() => {
    const pricesForm = formState?.precios || {};
    const m3Active = !!pricesForm.marca3?.trim();
    const m4Active = !!pricesForm.marca4?.trim();
    const m5Active = !!pricesForm.marca5?.trim();

    return columns.filter((col) => {
      const accessorStr = String(col.accessor || '');
      if (accessorStr.startsWith('precios.')) {
        const brandName = accessorStr.replace('precios.', '');
        if (pricesForm.hasOwnProperty('marca3') && brandName === pricesForm.marca3 && !m3Active) return false;
        if (pricesForm.hasOwnProperty('marca4') && brandName === pricesForm.marca4 && !m4Active) return false;
        if (pricesForm.hasOwnProperty('marca5') && brandName === pricesForm.marca5 && !m5Active) return false;
      }
      return true;
    });
  }, [columns, formState]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-sm">
      <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight: 'inherit' }}>
        <table className={`min-w-full divide-y divide-[var(--border-primary)] ${compactClasses} sticky-header ${striped ? 'table-striped' : ''} ${tableClassName}`}>
          {colClasses.length > 0 && (
            <colgroup>
              {(selectable || expandable) && <col className="w-10" />}
              {colClasses.map((c, idx) => (
                <col key={idx} className={c} />
              ))}
            </colgroup>
          )}

          <thead className="bg-[var(--bg-tertiary)] sticky top-0 z-10">
            <tr className="h-10">
              {(selectable || expandable) && (
                <th className="px-1.5 py-2 text-center w-10">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[var(--color-comparador-primary)] rounded border-[var(--border-primary)] bg-[var(--surface-primary)] focus:ring-[var(--color-comparador-primary)] transition-all"
                    />
                  )}
                </th>
              )}
              {filteredColumns.map((column) => {
                const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <th
                     key={`${column.header}-${String(column.accessor)}`}
                     className={`px-2 py-2 ${alignClass} text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase group ${column.sortable ? 'cursor-pointer hover:bg-[var(--bg-tertiary)]/30' : ''} ${column.headerClassName || ''}`}
                     onClick={column.sortable ? () => column.onSort?.(String(column.accessor)) : undefined}
                  >
                    <div className={`flex items-center gap-1 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : ''} leading-tight`}>
                      {column.tooltip ? (
                        <Tooltip content={column.tooltip}>
                          <span className="cursor-help border-b border-dotted border-[var(--text-tertiary)]">
                            {column.header}
                          </span>
                        </Tooltip>
                      ) : (
                        <span className="leading-tight">{column.header}</span>
                      )}
                      {column.sortable && (
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-primary)] bg-[var(--surface-primary)]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => {
                const isExpanded = expandedRows.has(row.codigo);
                const isSelected = selectedIds.has(row.codigo);

                return (
                  <React.Fragment key={row.codigo}>
                    <tr className={`
                      transition-all duration-200
                      ${isSelected ? 'bg-[var(--color-comparador-primary)]/[0.08] outline outline-1 outline-[var(--color-comparador-primary)]/[0.2]' : 'hover:bg-[var(--bg-tertiary)]/[0.6]'}
                      ${isExpanded ? 'bg-[var(--bg-tertiary)]/[0.5]' : ''}
                    `}>
                      {(selectable || expandable) && (
                        <td className="px-1.5 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {expandable && (
                              <button
                                onClick={() => toggleExpand(row.codigo)}
                                className={`p-0.5 rounded-full hover:bg-[var(--border-primary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                            {selectable && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectItem(row.codigo, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-[var(--color-comparador-primary)] rounded border-[var(--border-primary)] bg-[var(--surface-primary)] focus:ring-[var(--color-comparador-primary)] transition-all"
                              />
                            )}
                          </div>
                        </td>
                      )}
                      {filteredColumns.map((column, colIndex) => {
                        const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';
                        return (
                          <td key={`${String(column.accessor)}-${colIndex}`} className={`px-2 py-2.5 break-words text-sm leading-tight text-[var(--text-primary)] ${alignClass} ${column.cellClassName || ''}`}>
                            {column.cellRenderer
                              ? column.cellRenderer(row)
                              : String(row[column.accessor as keyof T] ?? '')}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && renderExpansion && (
                      <tr className="bg-[var(--bg-tertiary)]/30 animate-fade-in">
                        <td colSpan={filteredColumns.length + 1} className="px-6 py-3 border-l-4 border-[var(--color-comparador-primary)]">
                          {renderExpansion(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={filteredColumns.length + (selectable || expandable ? 1 : 0)} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-[var(--text-tertiary)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)]/80 flex items-center justify-center ring-1 ring-[var(--border-secondary)]">
                      <Inbox className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{noDataMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/[0.3] text-xs">
          <span className="text-[var(--text-secondary)]">
            {((safeCurrentPage - 1) * pageSize) + 1}–{Math.min(safeCurrentPage * pageSize, data.length)} de {data.length}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => goToPage(1)} disabled={safeCurrentPage === 1} className="p-0.5 rounded hover:bg-[var(--bg-tertiary)]/[0.6] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] transition-colors" aria-label="Primera página">
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => goToPage(safeCurrentPage - 1)} disabled={safeCurrentPage === 1} className="p-0.5 rounded hover:bg-[var(--bg-tertiary)]/[0.6] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] transition-colors" aria-label="Página anterior">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[var(--text-primary)] font-medium tabular-nums">
              {safeCurrentPage} / {totalPages}
            </span>
            <button onClick={() => goToPage(safeCurrentPage + 1)} disabled={safeCurrentPage === totalPages} className="p-0.5 rounded hover:bg-[var(--bg-tertiary)]/[0.6] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] transition-colors" aria-label="Página siguiente">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => goToPage(totalPages)} disabled={safeCurrentPage === totalPages} className="p-0.5 rounded hover:bg-[var(--bg-tertiary)]/[0.6] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-secondary)] transition-colors" aria-label="Última página">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};