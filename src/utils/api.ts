
import type { PedidoExport, InventarioExport, DevolucionesExport, PreciosExport } from '../api/schemas';
import { API_BASE_URL } from './config';

type ExportPayload = PedidoExport | InventarioExport | DevolucionesExport | PreciosExport;

/**
 * Sana un filename para prevenir path traversal y caracteres inválidos
 */
function sanitizeFilename(raw: string): string {
  // Extraer solo el nombre del archivo (quitar cualquier ruta)
  const justName = raw.replace(/^.*[\\/]/, '');
  // Mantener solo caracteres seguros
  return justName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'reporte';
}

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
      // Sanitizar para prevenir path traversal
      filename = sanitizeFilename(filename);
    }
  }

  const blob = await response.blob();
  return { blob, filename };
};


