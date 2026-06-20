// --------------------------------------------------------------------------- #
//                                                                             #
//           src/components/DatosGeneralesForm.tsx (Universal)                 #
//                                                                             #
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { FormGroup, Label } from './ui/FormControls';
import { StyledInput } from './ui/StyledInput';
import { SucursalInput } from './ui/SucursalInput';
import { useFormValidation } from '../hooks/useFormValidation';
import { useToast } from '../contexts/ToastContext';
import type { IForm, ValidationRule, FieldConfig } from '../interfaces';

// --- 2. Definición de las Props del Componente ---
interface Props {
  tipo: 'devoluciones' | 'pedido' | 'inventario' | 'precios'; // Tipo de módulo actual
  formState: IForm; // Estado del formulario pasado como prop desde el store
  fieldConfig: FieldConfig; // Configuración de qué campos mostrar
  onFormChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; // Callback opcional para cambios
  onOpenBackupModal?: () => void; // Callback para abrir modal de respaldo
}

// --- 3. Definición del Componente Universal ---
/**
 * Componente de Formulario de Datos Generales
 * 
 * Este componente es reutilizable a través de los diferentes módulos de la aplicación.
 * Se encarga de recopilar la información básica del encabezado (Cliente, Fecha, Sucursal, Marcas, etc.).
 * 
 * Características:
 * - Validación en tiempo real.
 * - Detección de marcas duplicadas.
 * - Adaptable según la configuración (fieldConfig).
 */
export const DatosGeneralesForm = React.forwardRef<{ getGeneralData: () => Record<string, string | number | boolean> }, Props>(({ tipo, formState, fieldConfig, onOpenBackupModal }, ref) => {
  // --- A. Conexión con el Store de Zustand ---
  const actualizarFormulario = useAppStore((state) => state.actualizarFormulario);

  // --- B. Hooks y Lógica Común ---
  // Determinar la variante de estilo basada en el tipo de módulo
  const variant = tipo === 'precios' ? 'comparador' : tipo;

  const { validate } = useFormValidation();
  const { addToast } = useToast();

  // Estado para tooltips de marcas duplicadas
  const [marcaTooltips, setMarcaTooltips] = useState<{ [key: string]: string }>({});

  // --- C. Lógica de Manejo de Cambios y Validación ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;

    // Filtrar solo dígitos para documento_cliente
    if (name === 'documento_cliente') {
      value = value.replace(/\D/g, '');
    }

    // Lógica de validación (se puede expandir)
    let rules: ValidationRule[] = [];
    if (name === 'fecha') {
      rules = [{ type: 'required', message: 'La fecha es obligatoria.' }, { type: 'isValidDate', message: 'La fecha no es válida.' }];
    } else if (name === 'codigo_cliente') {
      rules = [{ type: 'isNumeric', message: 'El código de cliente debe ser numérico.' }];
    }

    // Validar el campo actual
    const { isValid, errorMessage } = validate(value, rules);
    if (!isValid) {
      addToast(errorMessage!, 'error');
    }

    // Actualizar el estado global del formulario
    actualizarFormulario(name as keyof IForm, value);
  };

  // Función para manejar cambios en inputs de marca (limpia tooltips)
  const handleMarcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    // Limpiar tooltips cuando se cambia cualquier marca para re-evaluar al perder el foco
    setMarcaTooltips({});
  };

  // Función para manejar pérdida de foco en inputs de marca
  // Detecta si el usuario ingresó la misma marca en múltiples campos
  const handleMarcaBlur = () => {
    if (!fieldConfig.showMarcas) return;

    const marcas: string[] = [];
    const duplicados: { [key: string]: number } = {};

    // Recopilar todas las marcas ingresadas
    for (let i = 1; i <= 5; i++) {
      const marca = formState[`marca${i}` as keyof IForm] as string;
      if (marca && marca.trim()) {
        marcas.push(marca.trim());
      }
    }

    // Detectar duplicados y generar mensajes de tooltip
    const newTooltips: { [key: string]: string } = {};
    const seen = new Set<string>();

    for (let i = 1; i <= 5; i++) {
      const marca = formState[`marca${i}` as keyof IForm] as string;
      if (marca && marca.trim()) {
        const marcaTrim = marca.trim();
        if (seen.has(marcaTrim)) {
          // Es un duplicado
          duplicados[marcaTrim] = (duplicados[marcaTrim] || 1) + 1;
          newTooltips[`marca${i}`] = `Esta marca se duplicará como "${marcaTrim}${duplicados[marcaTrim]}" para comparación entre sucursales.`;
        } else {
          seen.add(marcaTrim);
        }
      }
    }

    setMarcaTooltips(newTooltips);
  };

  // --- D. Efecto para setear la fecha actual por defecto ---
  useEffect(() => {
    if (fieldConfig.showFecha && !formState.fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      actualizarFormulario('fecha', hoy);
    }
  }, [tipo, formState.fecha, fieldConfig.showFecha, actualizarFormulario]);

  // --- F. Función para obtener datos generales ---
  // Recopila todos los datos del formulario en un objeto plano para exportación o procesamiento
  const getGeneralData = (): Record<string, string | number | boolean> => {
    const data: Record<string, string | number | boolean> = {};

    if (fieldConfig.showRucDni) {
      data['Cliente'] = formState.cliente || '';
      data['Documento de Cliente'] = formState.documento_cliente || '';
    }

    if (fieldConfig.showCodigoCliente) {
      data['Código de Cliente'] = formState.codigo_cliente || '';
    }

    if (fieldConfig.showSucursal) {
      data['Sucursal'] = formState.sucursal || '';
    }

    if (fieldConfig.showFecha) {
      data['Fecha'] = formState.fecha || '';
    }

    if (fieldConfig.showMotivo && tipo === 'devoluciones') {
      data['Motivo'] = (formState as IForm & { motivo?: string }).motivo || '';
    }

    if (fieldConfig.showMarcas) {
      for (let i = 1; i <= 5; i++) {
        const marcaKey = `marca${i}` as keyof IForm;
        const marcaValue = formState[marcaKey] as string;
        if (marcaValue) {
          data[`Marca ${i}`] = marcaValue;
        }
      }
    }

    if (fieldConfig.showMontoOriginal) {
      data['Monto Total (S/)'] = formState.montoOriginal || '';
    }

    return data;
  };

  // Exponer la función para que pueda ser usada desde el componente padre mediante ref
  React.useImperativeHandle(ref, () => ({
    getGeneralData,
  }));

  // --- F. Renderizado del Componente ---
  return (
    <div className="w-full">
      <h2 className="text-base font-semibold mb-3 text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1">
        Datos Generales
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">

        {/* Campos de Cliente y Documento */}
        {fieldConfig.showRucDni && (
          <>
            <FormGroup>
              <Label htmlFor="documento_cliente">Documento</Label>
              <div className="relative">
                <StyledInput id="documento_cliente" name="documento_cliente" value={formState.documento_cliente || ''} onChange={handleChange} maxLength={11} placeholder="8 o 11 dígitos" variant={variant} className="h-7 text-sm pr-14" />
                {(() => {
                  const digits = (formState.documento_cliente || '').replace(/\D/g, '');
                  const len = digits.length;
                  if (len === 11) {
                    return <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white bg-[var(--color-accent-500)] px-1.5 py-0.5 rounded pointer-events-none">RUC</span>;
                  }
                  if (len === 8) {
                    return <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white bg-[var(--color-success-500)] px-1.5 py-0.5 rounded pointer-events-none">DNI</span>;
                  }
                  return null;
                })()}
              </div>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="cliente">Cliente</Label>
              <StyledInput id="cliente" name="cliente" value={formState.cliente || ''} onChange={handleChange} placeholder="Nombre o razón social" variant={variant} className="h-7 text-sm" />
            </FormGroup>
          </>
        )}

        {/* Campo Código de Cliente */}
        {fieldConfig.showCodigoCliente && (
          <FormGroup>
            <Label htmlFor="codigo_cliente">Cód.Cliente</Label>
            <StyledInput type="text" id="codigo_cliente" name="codigo_cliente" value={formState.codigo_cliente || ''} onChange={handleChange} placeholder="Opcional" variant={variant} className="h-7 text-sm" />
          </FormGroup>
        )}

        {/* Selector de Sucursal */}
        {fieldConfig.showSucursal && (
          <SucursalInput value={formState.sucursal || ''} onChange={handleChange} variant={variant} />
        )}

        {/* Selector de Fecha */}
        {fieldConfig.showFecha && (
          <FormGroup>
            <Label htmlFor="fecha">Fecha</Label>
            <StyledInput type="date" id="fecha" name="fecha" value={formState.fecha || ''} onChange={handleChange} variant={variant} className="h-7 text-sm" />
          </FormGroup>
        )}

        {/* Campos de Marcas (Compacteros) */}
        {fieldConfig.showMarcas && (
          Array.from({ length: 5 }).map((_, i) => {
            const marcaKey = `marca${i + 1}`;
            const hasTooltip = marcaTooltips[marcaKey];

            return (
              <FormGroup key={i}>
                <Label htmlFor={marcaKey} className="text-xs">{`Marca ${i + 1}`}</Label>
                <div className="relative">
                  <StyledInput
                    type="text"
                    id={marcaKey}
                    name={marcaKey}
                    value={formState[marcaKey as keyof IForm] as string || ''}
                    onChange={handleMarcaChange}
                    onBlur={handleMarcaBlur}
                    placeholder={`Marca ${i + 1}`}
                    variant={variant}
                    className="h-7 text-sm"
                  />
                  {hasTooltip && (
                     <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded shadow-lg z-10 max-w-xs border border-[var(--border-primary)]">
                      {marcaTooltips[marcaKey]}
                    </div>
                  )}
                </div>
              </FormGroup>
            );
          })
        )}

        {/* Campo Monto Original */}
        {fieldConfig.showMontoOriginal && (
          <FormGroup>
            <Label htmlFor="montoOriginal">Monto (S/)</Label>
            <StyledInput id="montoOriginal" name="montoOriginal" type="number" required value={formState.montoOriginal || ''} onChange={handleChange} variant={variant} max={1000000} step={0.01} className="input-qty w-28 h-7 text-sm" />
          </FormGroup>
        )}

        {/* Botón de Carga de Respaldo */}
        {fieldConfig.showCargarRespaldo && (
          <div className="lg:col-span-5 flex justify-end items-center mt-2">
            <button type="button" onClick={onOpenBackupModal} title="Cargar un estado guardado previamente" className="btn btn-primary btn-sm">
              Cargar Respaldo
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
