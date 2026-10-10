import { useState, useCallback, useMemo } from 'react';
import html2canvas from 'html2canvas';
import type { PreciosExport } from '../api/schemas';
import { exportApi } from '../utils/api';
import { generateHTMLSnapshot } from '../utils/htmlSnapshot';
import { debugLog, debugError, formatDateForFilename } from '../utils/config';
import type { IForm, ComparisonTableRow } from '../interfaces';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';

interface DashboardKPIs {
  cheapestProduct: ComparisonTableRow;
  mostExpensiveProduct: ComparisonTableRow;
  cheapestBrand: { brand: string; avg: number; stdDev: number; cv: number };
  mostExpensiveBrand: { brand: string; avg: number; stdDev: number; cv: number };
  mostVariableBrand: { brand: string; avg: number; stdDev: number; cv: number };
  brandRanking: { brand: string; avg: number; stdDev: number; cv: number }[];
  averageRanking: number;
  priceWins: number;
  priceWinRate: number;
}

export const useComparadorExport = (
  competidores: string[],
  dataConPorcentajes: ComparisonTableRow[],
  dashboardKPIs: DashboardKPIs | null,
  formState: { precios: IForm },
  comparisonTableRef: React.RefObject<HTMLDivElement | null>,
  exportWrapperRef: React.RefObject<HTMLDivElement | null>,
  dashboardRef: React.RefObject<HTMLDivElement | null>,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const { addToast } = useToast();
  const { userName, userEmail } = useAuth();
  const { resetearModulo } = useAppStore();

  const totales = useMemo(() => {
    const totalElementos = dataConPorcentajes.length;
    return { totalElementos };
  }, [dataConPorcentajes]);

  const handlePngExportClick = useCallback(async () => {
    const element = comparisonTableRef.current;
    if (!element) {
      addToast('No se encontró la tabla de comparación para exportar.', 'error');
      return;
    }

    setIsSubmitting(true);

    const captureContainer = document.createElement('div');
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    captureContainer.className = theme;
    Object.assign(captureContainer.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      padding: '0.5rem',
    });

    const clonedElement = element.cloneNode(true) as HTMLElement;
    captureContainer.appendChild(clonedElement);
    document.body.appendChild(captureContainer);

    try {
      clonedElement.classList.add('export-mode');

      const computedStyle = getComputedStyle(document.documentElement);
      const bgColor = document.documentElement.classList.contains('dark')
        ? computedStyle.getPropertyValue('--color-bg-dark').trim()
        : computedStyle.getPropertyValue('--color-bg-secondary').trim();

      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor || (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc'),
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const clientName = (formState.precios.cliente || 'comparacion').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const date = formatDateForFilename();
      link.download = `tabla_comparacion_${clientName}_${date}.png`;
      link.href = image;
      link.click();
      addToast('La imagen de la tabla se ha generado correctamente.', 'success');

    } catch (error) {
      debugError('Error al generar PNG de la tabla:', error);
      addToast('No se pudo generar la imagen PNG de la tabla.', 'error');
    } finally {
      document.body.removeChild(captureContainer);
      setIsSubmitting(false);
    }
  }, [comparisonTableRef, formState.precios.cliente, addToast]);

  const handleHTMLExport = useCallback(async () => {
    const element = exportWrapperRef.current;
    if (!element) {
      addToast('No se encontró contenido para exportar.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await generateHTMLSnapshot(element, {
        title: `Comparador de Precios - ${formState.precios.cliente || 'Cliente'}`,
        cliente: formState.precios.cliente,
        fecha: formState.precios.fecha,
        responsable: userName || undefined,
      });

      addToast('El archivo HTML se ha generado correctamente.', 'success');
    } catch (error) {
      debugError('Error al generar HTML:', error);
      addToast('No se pudo generar el archivo HTML.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [exportWrapperRef, formState.precios.cliente, formState.precios.fecha, addToast]);

  const handleConfirmExport = useCallback(async (selectedColumns: string[], format: 'xlsx' | 'pdf' | 'png') => {
    const errors: string[] = [];
    const formData = { ...formState.precios };

    if (!formData.sucursal) formData.sucursal = '[principal]';
    if (!formData.documento_cliente || !formData.cliente) errors.push('El Documento y Nombre del cliente son obligatorios.');
    if (!formData.fecha) errors.push('La Fecha es obligatoria.');

    const marcas = competidores.filter(c => c.trim() !== '');
    if (marcas.length < 2) errors.push('Debe ingresar al menos 2 marcas para comparar.');

    if (errors.length > 0) {
      errors.forEach(error => addToast(error, 'warning'));
      return;
    }

    setIsSubmitting(true);

    if (format === 'png') {
      try {
        const elementToCapture = dashboardRef.current;
        if (!elementToCapture) {
          addToast('No se encontró el dashboard para exportar.', 'error');
          return;
        }

        const computedStyle = getComputedStyle(document.documentElement);
        const bgColor = document.documentElement.classList.contains('dark')
          ? computedStyle.getPropertyValue('--color-bg-dark').trim()
          : computedStyle.getPropertyValue('--color-bg-secondary').trim();

        const canvas = await html2canvas(elementToCapture, {
          scale: 2,
          useCORS: true,
          backgroundColor: bgColor || (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc'),
        });

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const clientName = (formData.cliente || 'dashboard').toLowerCase().replace(/[^a-z0-9]/g, '_');
        const date = formatDateForFilename();

        link.download = `dashboard_${clientName}_${date}.png`;
        link.href = image;
        link.click();
        addToast('La imagen del dashboard se ha generado correctamente.', 'success');
      } catch (error) {
        debugError('Error al generar PNG del dashboard en el cliente:', error);
        addToast('No se pudo generar la imagen PNG del dashboard.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const updatedFormData = { ...formData };
      competidores.forEach((processedBrand, index) => {
        (updatedFormData as Record<string, string>)[`marca${index + 1}`] = processedBrand;
      });

      const includeDashboard = selectedColumns.includes('dashboard');
      const finalSelectedColumns = selectedColumns.filter(c => c !== 'dashboard');

      if (format === 'pdf') {
        addToast('La exportación PDF ha sido reemplazada por HTML navegable. Use el botón "Exportar HTML".', 'info');
        setIsSubmitting(false);
        return;
      }

      const payload: PreciosExport & {
        data?: { selectedColumns: string[] }
      } = {
        tipo: 'precios' as const,
        form: updatedFormData as PreciosExport['form'],
        list: dataConPorcentajes,
        usuario: { 'nombre': userName || '', 'correo': userEmail || '' },
        totales: totales,
        data: {
          selectedColumns: finalSelectedColumns,
        },
        ...(includeDashboard && { dashboard: dashboardKPIs }),
      };

      const { blob, filename } = await exportApi(payload, format);

      const finalFilename = filename && (filename.endsWith('.xlsx') || filename.endsWith('.pdf'))
        ? filename
        : `comparador_${(formData.cliente || 'cliente').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${formatDateForFilename()}.${format}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', finalFilename);
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 200);

      setConfirmState({
        message: 'El reporte se ha generado correctamente. ¿Desea limpiar el formulario y la lista de productos?',
        onConfirm: () => {
          resetearModulo();
          setConfirmState(null);
        },
      });
    } catch (error) {
      debugLog(`Error al exportar a ${format}:`, error);
      addToast(`No se pudo generar el archivo ${format.toUpperCase()}. Verifique el servidor.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [competidores, formState.precios, dataConPorcentajes, dashboardKPIs, totales, userName, userEmail, dashboardRef, addToast, resetearModulo]);

  const handleClearAll = useCallback(() => {
    setConfirmState({
      message: '¿Está seguro de que desea eliminar todos los datos del formulario y la lista de productos? Esta acción no se puede deshacer.',
      onConfirm: () => {
        resetearModulo();
        addToast('Se han limpiado todos los datos.', 'info');
        setConfirmState(null);
      },
    });
  }, [resetearModulo, addToast]);

  return {
    isSubmitting,
    confirmState,
    setConfirmState,
    handlePngExportClick,
    handleHTMLExport,
    handleConfirmExport,
    handleClearAll,
  };
};
