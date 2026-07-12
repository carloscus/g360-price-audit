
import type { PedidoExport, InventarioExport, DevolucionesExport, PreciosExport } from '../api/schemas';
import { API_BASE_URL } from './config';

type ExportPayload = PedidoExport | InventarioExport | DevolucionesExport | PreciosExport;

export const exportApi = async (payload: ExportPayload, export_format: 'xlsx' | 'pdf' | 'png' = 'xlsx'): Promise<{ blob: Blob; filename: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, export_format }),
  });

  if (!response.ok) {
    let errorMessage = 'Error desconocido al exportar el archivo';
    try {
      const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = await response.text();
    }
    throw new Error(errorMessage);
  }

  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = '';
  if (export_format === 'pdf') {
      filename = 'reporte.pdf';
  } else if (export_format === 'png') {
      filename = 'reporte.png';
  } else {
      filename = 'reporte.xlsx';
  }

  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
      if (filename.toLowerCase().startsWith("utf-8''")) {
        filename = decodeURIComponent(filename.substring(7));
      }
    }
  }

  const blob = await response.blob();
  return { blob, filename };
};


