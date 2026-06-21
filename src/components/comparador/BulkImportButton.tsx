import React, { useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../../store/useAppStore';
import { useToast } from '../../contexts/ToastContext';
import { generateBulkUploadTemplate } from '../../utils/excelJsGenerator';
import { downloadBlob } from '../../utils/downloadBlob';

export const BulkImportButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importarProductosMasivamente = useAppStore((state) => state.importarProductosMasivamente);
  const formState = useAppStore((state) => state.formState.precios);
  const { addToast } = useToast();

  const handleDownloadTemplate = async () => {
    const marcas = [
      formState.marca1 || 'Mi Marca',
      formState.marca2,
      formState.marca3,
      formState.marca4,
      formState.marca5,
    ].filter((m): m is string => !!m);

    if (marcas.length < 2) {
      addToast('Debe configurar al menos 2 marcas en Datos Generales para generar la plantilla.', 'error');
      return;
    }

    const blob = await generateBulkUploadTemplate(marcas);
    downloadBlob(blob, 'plantilla_carga_masiva.xlsx');
    addToast('Plantilla descargada. Complete los SKUs y precios.', 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          addToast('El archivo está vacío', 'error');
          return;
        }

        importarProductosMasivamente(data);
        addToast(`${data.length} productos procesados correctamente`, 'success');
      } catch (error) {
        addToast('Error al procesar el archivo Excel', 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <button
        onClick={handleDownloadTemplate}
        className="btn btn-secondary text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center gap-2 border-[var(--border-primary)]"
        title="Descargar planilla base"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>Plantilla</span>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-primary text-xs sm:text-sm py-2.5 flex-1 sm:flex-initial flex items-center justify-center gap-2 shadow-sm"
        aria-label="Cargar archivo Excel de productos"
      >
        <Upload className="w-4 h-4" />
        Cargar Excel
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </>
  );
};