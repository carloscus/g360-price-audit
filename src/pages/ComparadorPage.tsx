import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import '../styles/corporate-design.css';
import '../styles/bar-chart-vertical.css';
import '../styles/design-system.css';
import html2canvas from 'html2canvas';
import { DatosGeneralesForm } from '../components/DatosGeneralesForm';
import { useAppStore } from '../store/useAppStore';
import { useSearch } from '../hooks/useSearch';
import type { IForm, FieldConfig, IProductoEditado } from '../interfaces';
import { LineSelectorModalTrigger } from '../components/LineSelectorModal';
import { calculateDataWithPercentages } from '../utils/comparisonUtils';
import { DataTable, type IColumn } from '../components/DataTable';
import { PriceInput } from '../components/comparador/PriceInput';
import { MiniPriceChart } from '../components/comparador/MiniPriceChart';
import PricePieChart from '../components/comparador/PricePieChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { PreciosExport } from '../api/schemas';
import { ExportOptionsModal, EXPORT_COLUMN_GROUPS } from '../components/ExportOptionsModal';
import { exportApi } from '../utils/api';
import { useAuth } from '../contexts/auth';
import { useToast } from '../contexts/ToastContext';
import { ComparisonBar } from '../components/comparador/ComparisonBar';
import { ProductAnalysisCardWithBarChartRefactor } from '../components/comparador/ProductAnalysisCardWithBarChartRefactor';
import { getBrandColor, getBrandHeaderStylesByPosition, getBrandColorByPosition } from '../utils/colorScheme';
// Nuevos componentes avanzados
import {
  Trash2,
  Download,
  RefreshCw,
  Search,
  Moon,
  Sun,
  BarChart3,
  Info,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Tooltip, Modal } from '../components/ui';
import { ExcelJSExportButton } from '../components/ExcelJSExportButton';
import { generateHTMLSnapshot } from '../utils/htmlSnapshot';

// Tipo para las filas de la tabla de comparación, extendiendo el producto editado con propiedades dinámicas
export type ComparisonTableRow = IProductoEditado & Record<string, string | number | undefined>;

// Constantes para el dashboard - Colores fijos de alta gama para mejor contraste y consistencia
// Nota: Los colores ahora se gestionan mediante el esquema de colores unificado en colorScheme.ts

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; payload: { percent?: number } }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data || !data.value || !data.payload || !data.payload.percent) {
      return null;
    }
    return (
      <div className="bg-[var(--surface-elevated)] p-3 rounded-lg border border-[var(--border-primary)] shadow-lg">
        <p className="text-[var(--text-primary)] font-semibold">{data.name}</p>
        <p className="text-[var(--color-comparador-primary)] font-bold">
          S/ {data.value.toFixed(2)}
        </p>
        <p className="text-[var(--text-secondary)] text-sm">
          {data.payload.percent.toFixed(1)}% del total
        </p>
      </div>
    );
  }
  return null;
};

// --- 2. Definición del Componente de Página ---
export const ComparadorPage: React.FC = () => {
  // --- A. Conexión con el Store de Zustand ---
  // Extraemos acciones y estado global necesarios para el comparador
  const { catalogo, cargarCatalogo, formState, agregarProductoToLista, actualizarProductoEnLista, eliminarProductoDeLista, resetearModulo } = useAppStore();
  const lista = useAppStore((state) => state.listas.precios);

  // --- B. Estado Local del Componente ---
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda para filtrar productos
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga para la exportación
  const [competidores, setCompetidores] = useState<string[]>([]); // Lista de competidores derivada del formulario
  const [selectedProductForModal, setSelectedProductForModal] = useState<ComparisonTableRow | null>(null);
  const [selectedProductForPieChart, setSelectedProductForPieChart] = useState<ComparisonTableRow | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportColumns] = useState<string[]>(
    EXPORT_COLUMN_GROUPS.flatMap(g => g.columns.map(c => c.id))
  );
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null); // Estado para ordenamiento
  const [tableSearchTerm] = useState(''); // Término de búsqueda para filtrar la tabla
  const [searchResultsVisible] = useState(false); // Control de visibilidad de resultados
  const [selectedSearchResults, setSelectedSearchResults] = useState<Set<string>>(new Set()); // Estado para selección múltiple en búsqueda
  const [activeSection] = useState<string>(''); // Seguimiento de sección activa
  const [highlightedBrand, setHighlightedBrand] = useState<string | null>(null); // MARCA RESALTADA PARA INTERACTIVIDAD
  const datosGeneralesRef = useRef<HTMLDivElement>(null); // Ref para el formulario de datos generales
  const pieChartRef = useRef<HTMLDivElement>(null); // Ref para el gráfico de torta
  const dashboardRef = useRef<HTMLDivElement>(null); // Ref para el dashboard
  const exportWrapperRef = useRef<HTMLDivElement>(null); // Ref wrapper para exportar ambas secciones
  const comparisonTableRef = useRef<HTMLDivElement>(null); // Ref para la tabla de comparación
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref para input de búsqueda
  const searchResultsListRef = useRef<HTMLUListElement>(null); // Ref para lista de resultados virtualizada


  // --- C. Hooks y Utilidades ---
  const { addToast } = useToast();

  // Callback para manejar el resaltado de marcas en toda la app
  const handleBrandHover = useCallback((brandName: string | null) => {
    setHighlightedBrand(brandName);
  }, []);

  // Función para manejar ordenamiento
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Efecto: Derivar los competidores de formState.precios con manejo de duplicados
  // Se ejecuta cada vez que cambian los datos del formulario de precios
  useEffect(() => {
    const marcas: string[] = [];
    // Recorremos los campos de marca (marca1 a marca5)
    for (let i = 1; i <= 5; i++) {
      const marcaKey = `marca${i}` as keyof IForm;
      const marca = formState.precios[marcaKey];
      if (typeof marca === 'string' && marca.trim() !== '') {
        marcas.push(marca.trim());
      }
    }

    // Si hay menos de 2 marcas, usamos valores por defecto para evitar errores visuales
    if (marcas.length < 2) {
      setCompetidores(['Mi Marca', 'Competidor 1']);
    } else {
      // Lógica para manejar nombres de marca duplicados
      const marcasSet = new Set(marcas);
      if (marcasSet.size < marcas.length) {
        // Se encontraron marcas duplicadas. Se han numerado automáticamente para evitar conflictos en la tabla.
      }

      const marcasUnicas: string[] = [];
      const contadorMarcas: { [key: string]: number } = {};

      for (const marca of marcas) {
        if (marcasUnicas.includes(marca)) {
          // Si la marca ya existe, le agregamos un número (ej: Marca2)
          contadorMarcas[marca] = (contadorMarcas[marca] || 1) + 1;
          const marcaConNumeral = `${marca}${contadorMarcas[marca]}`;
          marcasUnicas.push(marcaConNumeral);
        } else {
          contadorMarcas[marca] = 1;
          marcasUnicas.push(marca);
        }
      }
      setCompetidores(marcasUnicas);
    }
  }, [formState.precios, addToast]);

  // --- C. Carga inicial de datos ---
  // Carga el catálogo de productos al montar el componente
  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  // --- D. Lógica de Búsqueda ---
  // Hook personalizado para filtrar el catálogo basado en el término de búsqueda
  const searchResults = useSearch(catalogo, searchTerm);
  
  // Usar todos los resultados con virtualización para mejor rendimiento
  const displayedResults = searchResults;
  
  // Virtualizador para la lista de resultados de búsqueda
  const rowVirtualizer = useVirtualizer({
    count: displayedResults.length,
    getScrollElement: () => searchResultsListRef.current,
    estimateSize: () => 72, // Altura estimada de cada fila (p-4 + contenido)
    overscan: 5, // Renderizar 5 elementos extra fuera de la vista
  });

  // Funciones para manejar selección múltiple en resultados de búsqueda
  const toggleSearchResultSelection = useCallback((codigo: string) => {
    setSelectedSearchResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codigo)) {
        newSet.delete(codigo);
      } else {
        newSet.add(codigo);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAllSearchResults = useCallback(() => {
    if (selectedSearchResults.size === displayedResults.length) {
      setSelectedSearchResults(new Set());
    } else {
      setSelectedSearchResults(new Set(displayedResults.map(p => p.codigo)));
    }
  }, [displayedResults, selectedSearchResults.size]);

  const addSelectedSearchResults = useCallback(() => {
    const productsToAdd = displayedResults.filter(p => selectedSearchResults.has(p.codigo));
    productsToAdd.forEach(p => agregarProductoToLista(p));
    setSearchTerm('');
    setSelectedSearchResults(new Set());
    if (productsToAdd.length > 0) {
      addToast(`${productsToAdd.length} producto(s) agregado(s) a la lista.`, 'success');
    }
  }, [displayedResults, selectedSearchResults, agregarProductoToLista, addToast]);

  // Limpiar selección cuando el término de búsqueda cambia
  useEffect(() => {
    setSelectedSearchResults(new Set());
  }, [searchTerm]);
  
  // Cerrar dropdown al hacer clic fuera (dropdown centrado en pantalla)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (displayedResults.length > 0 && searchInputRef.current) {
        const inputRect = searchInputRef.current.getBoundingClientRect();
        const isClickInsideInput = (
          event.clientX >= inputRect.left &&
          event.clientX <= inputRect.right &&
          event.clientY >= inputRect.top &&
          event.clientY <= inputRect.bottom
        );
        
        // El dropdown está centrado, verificamos si el clic está cerca del centro
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const dropdownCenterX = windowWidth / 2;
        const dropdownCenterY = windowHeight / 2;
        const dropdownWidth = Math.min(windowWidth * 0.9, 600);
        const dropdownHeight = 384; // max-h-96 approx
        
        const isClickInsideDropdown = (
          event.clientX >= dropdownCenterX - dropdownWidth / 2 &&
          event.clientX <= dropdownCenterX + dropdownWidth / 2 &&
          event.clientY >= dropdownCenterY - dropdownHeight / 2 &&
          event.clientY <= dropdownCenterY + dropdownHeight / 2
        );
        
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setSearchTerm('');
        }
      }
    };
    
    if (displayedResults.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [displayedResults.length, setSearchTerm]);

  // --- E. Lógica de la Tabla de Comparación ---

  // Manejador para cambios de precio en la tabla
  const handlePriceChange = useCallback((codigo: string, competidor: string, valor: number | null) => {
    const productoActual = lista.find(p => p.codigo === codigo);
    if (!productoActual) return;

    if (competidor === 'precio_sugerido') {
      // Actualización directa del precio sugerido
      actualizarProductoEnLista(codigo, 'precio_sugerido', valor ?? 0);
    } else {
      // Actualización de precios de competidores dentro del objeto 'precios'
      const nuevosPrecios = { ...(productoActual.precios || {}) };
      if (valor === null) {
        delete nuevosPrecios[competidor];
      } else {
        nuevosPrecios[competidor] = valor;
      }
      actualizarProductoEnLista(codigo, 'precios', nuevosPrecios);
    }
  }, [lista, actualizarProductoEnLista]);

  // Cálculo memorizado de datos con porcentajes de variación
  const dataConPorcentajes = useMemo(() => {
    return calculateDataWithPercentages(lista, competidores);
  }, [lista, competidores]);

  // Cálculo memorizado de datos ordenados y filtrados
  const sortedData = useMemo(() => {
    let data = dataConPorcentajes;
    
    // Filtrar por término de búsqueda en la tabla
    if (tableSearchTerm.trim()) {
      const searchLower = tableSearchTerm.toLowerCase();
      data = data.filter(item => 
        item.codigo?.toLowerCase().includes(searchLower) ||
        item.nombre?.toLowerCase().includes(searchLower) ||
        item.cod_ean?.toLowerCase().includes(searchLower)
      );
    }
    
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Para porcentajes (strings como "10.5%")
      if (typeof aValue === 'string' && aValue.includes('%')) {
        const aNum = parseFloat(aValue.replace('%', ''));
        const bNum = parseFloat((bValue as string).replace('%', ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
      }

      return 0;
    });
  }, [dataConPorcentajes, sortConfig, tableSearchTerm]);

  // Cálculo de KPIs para el dashboard
  const dashboardKPIs = useMemo(() => {
    const dataWithRank = dataConPorcentajes.map(p => {
        const prices = competidores
            .map(c => p.precios?.[c] ?? 0)
            .filter(price => price > 0)
            .sort((a, b) => a - b);
        const basePrice = p.precios?.[competidores[0]] ?? 0;
        if (basePrice <= 0) return { ...p, rank: null };
        const rank = prices.indexOf(basePrice) + 1;
        return { ...p, rank: rank > 0 ? rank : null };
    });

    if (dataWithRank.length === 0) return null;

    const productsWithAvg = dataWithRank.filter(p => (p.precio_promedio ?? 0) > 0);
    if (productsWithAvg.length === 0) return null;

    const cheapestProduct = productsWithAvg.reduce((min, p) => (p.precio_promedio ?? 0) < (min.precio_promedio ?? 0) ? p : min);
    const mostExpensiveProduct = productsWithAvg.reduce((max, p) => (p.precio_promedio ?? 0) > (max.precio_promedio ?? 0) ? p : max);

    const brandAverages: { [key: string]: number[] } = {};
    competidores.forEach(brand => {
        brandAverages[brand] = dataWithRank.map(p => p.precios?.[brand] || 0).filter(price => price > 0);
    });

    const calculateStdDev = (values: number[]) => {
        if (values.length < 2) return 0;
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    const brandAvgPrices = competidores.map(brand => {
        const prices = brandAverages[brand];
        const avg = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
        const stdDev = calculateStdDev(prices);
        const cv = avg > 0 ? (stdDev / avg) * 100 : 0; // Coefficient of Variation
        return { brand, avg, stdDev, cv };
    }).filter(b => b.avg > 0).sort((a, b) => a.avg - b.avg);

    const cheapestBrand = brandAvgPrices.length > 0 ? brandAvgPrices[0] : { brand: 'N/A', avg: 0, stdDev: 0, cv: 0 };
    const mostExpensiveBrand = brandAvgPrices.length > 0 ? brandAvgPrices[brandAvgPrices.length - 1] : { brand: 'N/A', avg: 0, stdDev: 0, cv: 0 };
    const mostVariableBrand = brandAvgPrices.length > 0 ? brandAvgPrices.reduce((max, b) => b.cv > max.cv ? b : max) : { brand: 'N/A', avg: 0, stdDev: 0, cv: 0 };

    // New KPIs
    const baseBrandRanks = dataWithRank.map(p => p.rank).filter(r => r !== null) as number[];
    const averageRanking = baseBrandRanks.length > 0 ? baseBrandRanks.reduce((sum, r) => sum + r, 0) / baseBrandRanks.length : 0;

    const priceWins = dataWithRank.filter(p => p.rank === 1).length;
    const priceWinRate = dataWithRank.length > 0 ? (priceWins / dataWithRank.length) * 100 : 0;

    return {
        cheapestProduct,
        mostExpensiveProduct,
        cheapestBrand,
        mostExpensiveBrand,
        mostVariableBrand,
        brandRanking: brandAvgPrices,
        averageRanking,
        priceWins,
        priceWinRate
    };
}, [dataConPorcentajes, competidores]);

  // Cálculo de totales para mostrar en la UI
  const totales = useMemo(() => {
    const totalElementos = lista.length;
    return { totalElementos };
  }, [lista]);

  const { userName, userEmail } = useAuth();

  const handlePngExportClick = async () => {
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
      // Aplicar modo export para optimizar la tabla PNG
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
      const date = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      link.download = `tabla_comparacion_${clientName}_${date}.png`;
      link.href = image;
      link.click();
      addToast('La imagen de la tabla se ha generado correctamente.', 'success');

    } catch (error) {
      console.error('Error al generar PNG de la tabla:', error);
      addToast('No se pudo generar la imagen PNG de la tabla.', 'error');
    } finally {
      document.body.removeChild(captureContainer);
      setIsSubmitting(false);
    }
  };

  // Función para exportar HTML navegable
  const handleHTMLExport = async () => {
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
        includePrintStyles: true,
        includeInteractivity: true,
      });
      
      addToast('El archivo HTML se ha generado correctamente.', 'success');
    } catch (error) {
      console.error('Error al generar HTML:', error);
      addToast('No se pudo generar el archivo HTML.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmExport = async (selectedColumns: string[], format: 'xlsx' | 'pdf' | 'png') => {
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
          scale: 2, // Buena calidad
          useCORS: true,
          backgroundColor: bgColor || (document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc'),
        });

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const clientName = (formData.cliente || 'dashboard').toLowerCase().replace(/[^a-z0-9]/g, '_');
        const date = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
        
        link.download = `dashboard_${clientName}_${date}.png`;
        link.href = image;
        link.click();
        addToast('La imagen del dashboard se ha generado correctamente.', 'success');
      } catch (error) {
        console.error('Error al generar PNG del dashboard en el cliente:', error);
        addToast('No se pudo generar la imagen PNG del dashboard.', 'error');
      } finally {
        setIsSubmitting(false);
      }
      return; // <-- CRÍTICO: Detener la ejecución para no llamar al backend.
    }

    // Lógica para PDF y XLSX que sí usa el backend.
    try {
      const updatedFormData = { ...formData };
      competidores.forEach((processedBrand, index) => {
        (updatedFormData as Record<string, string>)[`marca${index + 1}`] = processedBrand;
      });

      const includeDashboard = selectedColumns.includes('dashboard');
      const finalSelectedColumns = selectedColumns.filter(c => c !== 'dashboard');

      if (format === 'pdf') {
        // PDF eliminado - ahora usamos HTML navegable
        addToast('La exportación PDF ha sido reemplazada por HTML navegable. Use el botón "Exportar HTML".', 'info');
        setIsSubmitting(false);
        return;
      }

      // Lógica para XLSX (y anteriormente PDF genérico)
      const payload: PreciosExport & { 
        data?: { 
          selectedColumns: string[]
        } 
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
        : `comparador_${(formData.cliente || 'cliente').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.${format}`;

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

      if (window.confirm('El reporte se ha generado correctamente. ¿Desea limpiar el formulario y la lista de productos?')) {
        resetearModulo();
      }
    } catch (error) {
      console.error(`Error al exportar a ${format}:`, error);
      addToast(`No se pudo generar el archivo ${format.toUpperCase()}. Verifique el servidor.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Función para limpiar todo manualmente
  const handleClearAll = () => {
    if (window.confirm('¿Está seguro de que desea eliminar todos los datos del formulario y la lista de productos? Esta acción no se puede deshacer.')) {
      resetearModulo();
      addToast('Se han limpiado todos los datos.', 'info');
    }
  };

  // Función para determinar el estilo de las celdas de porcentaje (verde/rojo)
  

  // Definición de columnas de la tabla (memorizada para rendimiento)
  //
  // IMPORTANTE: Esta tabla implementa un flujo de análisis de precios en 8 etapas lógicas:
  // 1. INFORMACIÓN BÁSICA: Identificación del producto (código, EAN, nombre)
  // 2. PRECIOS BASE: Precios de todos los competidores para análisis comparativo
  // 3. ANÁLISIS COMPARATIVO: Porcentajes de variación respecto a cada competidor
  // 4. RESUMEN ESTADÍSTICO: Precio promedio como referencia de mercado
  // 5. DECISIÓN ESTRATÉGICA: Precio sugerido (editable) para el cliente
  // 6. EVALUACIÓN FINAL: Porcentaje de ajuste del precio sugerido vs precio base
  // 7. VISUALIZACIÓN: Gráficos resumen para análisis rápido
  // 8. ACCIONES: Controles para gestión del producto
  //
  // ADVERTENCIA: No eliminar ni reorganizar columnas sin entender el flujo lógico
  // Cada columna depende de cálculos previos y sigue un orden estratégico para
  // facilitar la toma de decisiones de precios. El orden actual está optimizado
  // para la usabilidad y comprensión del usuario final.
  //
  // NOTA: Las columnas de porcentajes (% vs competidor) dependen de la existencia
  // de al menos 2 competidores. Si se eliminan competidores, estas columnas se
  // ajustan automáticamente mediante competidores.slice(1).
  const columns = useMemo((): IColumn<ComparisonTableRow>[] => {
    // Columnas dinámicas para cada competidor (Inputs de precio) con colores unificados
    const dynamicCompetitorColumns: IColumn<ComparisonTableRow>[] = competidores.map((comp) => {
      const color = getBrandColorByPosition(comp, competidores);
      return {
        header: (
          <div 
            style={getBrandHeaderStylesByPosition(comp, competidores)} 
            className={`px-2 py-1 rounded-lg text-center text-xs font-semibold transition-opacity duration-200 cursor-pointer hover:opacity-80 ${highlightedBrand && highlightedBrand !== comp ? 'opacity-50' : ''}`}
            onMouseEnter={() => handleBrandHover(comp)}
            onMouseLeave={() => handleBrandHover(null)}
            onClick={() => handleSort(`precios.${comp}`)}
          >
            {comp}
          </div>
        ),
        accessor: `precios.${comp}`,
        sortable: true,
        onSort: handleSort,
        cellRenderer: (item) => (
          <PriceInput
            initialValue={item.precios?.[comp] ?? null}
            onPriceChange={(value) => handlePriceChange(item.codigo, comp, value)}
            competidor={comp}
            item={item}
            isBestOffer={item.mejor_precio_competidor === comp}
            textColor={color}
          />
        ),
      };
    });

    // Columnas dinámicas para porcentajes de variación
    // Fórmula: ((Base / Competidor) - 1) * 100
    const dynamicPercentageColumns: IColumn<ComparisonTableRow>[] = competidores.slice(1).map((comp) => ({
      header: (
        <Tooltip content={`Variación porcentual: (Base / ${comp} - 1) × 100`} position="top">
          <div className="header-multiline cursor-pointer" onClick={() => handleSort(`% vs ${comp}`)}>
            <span className="flex items-center gap-1 justify-center">
              <BarChart3 className="w-3 h-3" />
              <span>% vs</span>
            </span>
            <span>{comp}</span>
          </div>
        </Tooltip>
      ),
      accessor: `% vs ${comp}`,
      sortable: true,
      onSort: handleSort,
      cellRenderer: (item) => {
        const keyPct = `% vs ${comp}`;
        const valorPct = (item as Record<string, string | undefined>)[keyPct];
        return <ComparisonBar percentage={valorPct} type="competitor" />;
      },
    }));

    // Columna para porcentaje de ajuste al precio sugerido
    const suggestedPricePercentageColumn: IColumn<ComparisonTableRow> = {
      header: (
        <Tooltip content="Diferencia porcentual entre el precio sugerido y el precio base" position="top">
          <div className="header-multiline cursor-pointer" onClick={() => handleSort('% Ajuste a Sugerido')}>
            <span className="flex items-center gap-1 justify-center">
              <TrendingUp className="w-3 h-3" />
              <span>Ajuste a</span>
            </span>
            <span>Sugerido</span>
          </div>
        </Tooltip>
      ),
      accessor: '% Ajuste a Sugerido',
      sortable: true,
      onSort: handleSort,
      cellRenderer: (item) => {
        const valorPct = (item as Record<string, string | undefined>)['% Ajuste a Sugerido'];
        return <ComparisonBar percentage={valorPct} type="sugerido" />;
      },
    };

    return [
      // --- INFORMACIÓN BÁSICA (Identificación del producto) ---
      { header: 'Código', accessor: 'codigo', cellClassName: 'w-20 font-medium text-[var(--text-primary)]', sortable: true, onSort: handleSort },
      { header: 'Cod. EAN', accessor: 'cod_ean', cellClassName: 'w-24 text-[var(--text-secondary)] column-ean', headerClassName: 'column-ean', sortable: true, onSort: handleSort },
      { 
        header: 'Nombre', 
        accessor: 'nombre', 
        cellClassName: 'min-w-[234px] max-w-[325px] font-medium text-[var(--text-primary)] product-name-column', 
        sortable: true, 
        onSort: handleSort 
      },
      
      // --- PRECIOS BASE (Datos fundamentales para el análisis) ---
      ...dynamicCompetitorColumns,
      
      // --- ANÁLISIS COMPARATIVO (Resultados del cálculo de variaciones) ---
      ...dynamicPercentageColumns,
      
      // --- RESUMEN ESTADÍSTICO (Cálculo promedio para referencia) ---
      {
        header: (
          <div className="header-multiline">
            <span>Precio</span>
            <span>Promedio</span>
          </div>
        ),
        accessor: 'precio_promedio',
        cellClassName: 'w-20 bg-[var(--bg-tertiary)]/50 font-bold text-[var(--color-comparador-primary)] price-cell',
        sortable: true,
        onSort: handleSort,
        cellRenderer: (item) => {
          const rowData = item as Record<string, unknown>;
          const avg = rowData.precio_promedio as number;
          return typeof avg === 'number' && avg > 0
            ? (
              <span>
                <span className="currency-symbol">S/</span>
                <span className="font-semibold">{avg.toFixed(2)}</span>
              </span>
            )
            : 'N/A';
        }
      },
      
      // --- DECISIÓN ESTRATÉGICA (Precio sugerido para el cliente) ---
      {
        header: (
          <div className="header-multiline">
            <span>Precio</span>
            <span>Sugerido</span>
          </div>
        ),
        accessor: 'precio_sugerido',
        cellClassName: 'w-24',
        sortable: true,
        onSort: handleSort,
        cellRenderer: (item) => (
          <PriceInput
            initialValue={item.precio_sugerido ?? null}
            onPriceChange={(value) => handlePriceChange(item.codigo, 'precio_sugerido', value)}
            competidor="Sugerido"
            item={item}
            textColor="var(--color-accent)"
          />
        ),
      },
      
      // --- EVALUACIÓN FINAL (Impacto del precio sugerido vs base) ---
      suggestedPricePercentageColumn,
      
      // --- VISUALIZACIÓN (Gráficos resumen para análisis rápido) ---
      {
        header: 'Comparativa',
        accessor: 'comparativa',
        cellClassName: 'w-24',
        cellRenderer: (item) => {
          const prices = competidores.map(comp => ({
            label: comp,
            value: item.precios?.[comp] ?? null
          }));
          return (
            <div className="flex items-center gap-2">
              <MiniPriceChart prices={prices} />
              <Tooltip content="Ver gráfico de torta" position="top">
                <button
                  onClick={() => setSelectedProductForPieChart(item)}
                  className="p-1 rounded-full hover:bg-[var(--color-comparador-primary)]/10 text-[var(--color-comparador-primary)] transition-all duration-200 hover:scale-110"
                  aria-label={`Ver gráfico de torta para ${item.nombre}`}
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>
          );
        }
      },
      
      // --- ACCIONES (Controles para gestión del producto) ---
      {
        header: 'Acciones',
        accessor: 'accion',
        cellClassName: 'column-acciones',
        headerClassName: 'column-acciones',
        cellRenderer: (item) => (
          <div className="flex items-center gap-2">
            <Tooltip content="Ver detalles del producto" position="left">
              <button
                onClick={() => setSelectedProductForModal(item)}
                className="p-2 rounded-full hover:bg-[var(--color-comparador-primary)]/10 text-[var(--color-comparador-primary)] transition-all duration-200 hover:scale-110"
                aria-label={`Ver detalles de ${item.nombre}`}
              >
                <Info className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip content="Eliminar de la lista" position="left">
              <button
                onClick={() => eliminarProductoDeLista(item.codigo)}
                className="p-2 rounded-full hover:bg-[var(--color-danger)]/10 text-[var(--color-danger)] transition-all duration-200 hover:scale-110"
                aria-label={`Eliminar ${item.nombre}`}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ];
  }, [competidores, handlePriceChange, eliminarProductoDeLista, handleBrandHover, highlightedBrand, handleSort]);

  // Configuración de campos visibles en el formulario
  const fieldConfig: FieldConfig = { showRucDni: true, showCodigoCliente: true, showSucursal: true, showFecha: true, showMarcas: true };

  // --- D. Lógica de Tema ---
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500 module-comparador" role="main">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
      >
        Ir al contenido principal
      </a>

      <div className="container-app py-8 space-y-8" id="main-content">

        {/* Sección de Encabezado */}
        <div className="relative text-center space-y-4 animate-fade-in" role="banner">
          {/* Botón de cambio de tema */}
          <div className="absolute right-0 top-0">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? <Sun className="w-6 h-6" aria-hidden="true" /> : <Moon className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight" id="page-title">
            Comparador de Precios
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto" id="page-description">
            Optimiza tus decisiones de compra comparando precios entre competidores en tiempo real.
          </p>
        </div>

        {/* Sección de Formulario (Datos Generales) */}
        <section ref={datosGeneralesRef} className="glass-card p-6 md:p-8 animate-slide-up section-tint-comparador" style={{ animationDelay: '100ms' }} aria-labelledby="form-section-title">
          <h2 id="form-section-title" className="sr-only">Formulario de Datos Generales</h2>
          <DatosGeneralesForm tipo="precios" formState={formState.precios} fieldConfig={fieldConfig} />
        </section>

        {/* Sección de Búsqueda y Acciones */}
        <section className="glass-card p-6 md:p-8 animate-slide-up section-tint-comparador" style={{ animationDelay: '200ms' }} aria-labelledby="search-section-title">
          <h2 id="search-section-title" className="sr-only">Búsqueda y Selección de Productos</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Búsqueda y Selección</h3>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones de producto">
              {/* Trigger para modal de selección por línea */}
              <LineSelectorModalTrigger
                moduloKey="precios"
                showStockRef={false}
                buttonClassName="btn btn-primary"
                onConfirm={(_, s) => s && s.length > 0 && console.warn(`Se omitieron ${s.length} duplicados.`)}
              />
              {/* Botón para añadir manualmente si no se encuentra en búsqueda */}
              <Tooltip content="Añadir producto manualmente si no se encuentra en la búsqueda" position="top">
                <button
                  onClick={() => { agregarProductoToLista({ codigo: searchTerm, nombre: searchTerm, cod_ean: '', ean_14: '', peso: 0, stock_referencial: 0, linea: '', keywords: [] }); setSearchTerm(''); }}
                  disabled={!searchTerm || displayedResults.length > 0}
                  className="btn btn-primary"
                  aria-label="Añadir producto manualmente"
                >
                  Añadir Manualmente
                </button>
              </Tooltip>
              {/* Botón de Limpiar Todo */}
              <Tooltip content="Limpiar formulario y lista de productos" position="top">
                <button
                  onClick={handleClearAll}
                  disabled={lista.length === 0 && Object.keys(formState.precios).length === 0}
                  className="btn btn-danger"
                  aria-label="Limpiar formulario y lista de productos"
                  aria-describedby="clear-instruction"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" aria-hidden="true" />
                    Limpiar
                  </span>
                </button>
              </Tooltip>
              <div id="clear-instruction" className="sr-only">
                Presione para limpiar todos los datos del formulario y la lista de productos. Esta acción no se puede deshacer.
              </div>
            </div>
          </div>

          {/* Input de Búsqueda con resultados desplegables */}
          <div className="relative" role="search" aria-label="Búsqueda de productos">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              id="product-search"
              aria-label="Buscar producto"
              aria-describedby="search-instruction"
              aria-expanded={displayedResults.length > 0}
              aria-haspopup="listbox"
              placeholder="Buscar producto por código, EAN o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 py-3 text-lg"
              autoComplete="off"
            />
            <div id="search-instruction" className="sr-only">
              Ingrese el código, EAN o nombre del producto para buscar. Use las teclas de flecha para navegar por los resultados.
            </div>
            
            {/* Lista de resultados de búsqueda - Renderizado con Portal y Virtualización */}
            {displayedResults.length > 0 && (
              createPortal(
                <ul
                  ref={searchResultsListRef}
                  className="fixed bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-xl shadow-2xl max-h-96 overflow-y-auto custom-scrollbar animate-fade-in"
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: '600px',
                    height: '400px', // Altura fija para que funcione la virtualización
                    zIndex: 99999,
                  }}
                  role="listbox"
                  aria-label="Resultados de búsqueda"
                >
                {/* Cabecera con selección múltiple */}
                <li className="sticky top-0 bg-[var(--surface-elevated)] border-b border-[var(--border-primary)] p-3 z-10">
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)] font-medium">
                      <input
                        type="checkbox"
                        checked={selectedSearchResults.size === displayedResults.length && displayedResults.length > 0}
                        onChange={toggleSelectAllSearchResults}
                        className="w-4 h-4 rounded border-[var(--border-primary)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span>Seleccionar todos ({displayedResults.length})</span>
                    </label>
                    {selectedSearchResults.size > 0 && (
                      <button
                        onClick={addSelectedSearchResults}
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors flex items-center gap-1"
                      >
                        <span>Agregar {selectedSearchResults.size} seleccionado{selectedSearchResults.size !== 1 ? 's' : ''}</span>
                      </button>
                    )}
                  </div>
                </li>
                {/* Contenedor virtualizado */}
                <li
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const p = displayedResults[virtualItem.index];
                    const isAlreadyAdded = lista.some(item => item.codigo === p.codigo);
                    return (
                      <div
                        key={p.codigo}
                        role="option"
                        tabIndex={0}
                        onClick={(e) => {
                          if (isAlreadyAdded) return;
                          e.stopPropagation();
                          toggleSearchResultSelection(p.codigo);
                        }}
                        onKeyDown={(e) => {
                          if (isAlreadyAdded) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSearchResultSelection(p.codigo);
                          }
                        }}
                        className={`absolute w-full p-4 cursor-pointer border-b border-[var(--border-secondary)] transition-colors ${
                          selectedSearchResults.has(p.codigo)
                            ? 'bg-[var(--color-primary)]/10'
                            : isAlreadyAdded
                              ? 'bg-[var(--color-warning)]/5 opacity-60'
                              : 'hover:bg-[var(--bg-tertiary)] focus:bg-[var(--bg-tertiary)]'
                        }`}
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSearchResults.has(p.codigo)}
                            disabled={isAlreadyAdded}
                            onChange={() => toggleSearchResultSelection(p.codigo)}
                            className={`mt-1 w-4 h-4 rounded border-[var(--border-primary)] focus:ring-[var(--color-primary)] ${isAlreadyAdded ? 'cursor-not-allowed' : 'text-[var(--color-primary)]'}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                              {p.nombre}
                              {isAlreadyAdded && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-warning)]/20 text-[var(--color-warning)] text-xs font-medium">
                                  <AlertCircle className="w-3 h-3" />
                                  Ya en lista
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] flex gap-4 mt-1">
                              <span>Código: {p.codigo}</span>
                              {p.cod_ean && <span>EAN: {p.cod_ean}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </li>
              </ul>,
              document.body
            )
            )}
          </div>
        </section>

        {/* Wrapper para exportar tanto el dashboard como la tabla */}
        <div ref={exportWrapperRef} className="export-wrapper space-y-8">
          {/* Sección de Tabla de Comparación */}
          <section ref={comparisonTableRef} className="glass-card p-4 md:p-6 animate-slide-up section-tint-comparador" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Tabla de Comparación</h2>
              {/* Input de búsqueda para filtrar la tabla */}
              <div className="flex flex-wrap gap-3" role="group" aria-label="Acciones de exportación">
                {/* Botón de Exportar XLSX (ExcelJS - sin backend) */}
                <ExcelJSExportButton 
                  productos={dataConPorcentajes.map(p => ({
                    ...p,
                    precios: p.precios ?? Object.fromEntries(competidores.map(m => [m, null]))
                  }))}
                  marcas={competidores}
                  cliente={formState.precios.cliente || ''}
                  documento={formState.precios.documento_cliente}
                  codigo_cliente={formState.precios.codigo_cliente}
                  sucursal={formState.precios.sucursal}
                  responsable={userName || ''}
                  disabled={isSubmitting || lista.length === 0}
                />
                {/* Botón de Exportar a HTML navegable */}
                <Tooltip content="Exportar como página HTML navegable (se abre en el navegador)" position="top">
                  <button
                    onClick={handleHTMLExport}
                    disabled={isSubmitting || lista.length === 0}
                    className="btn btn-primary"
                    aria-label={isSubmitting ? "Generando HTML..." : "Exportar como HTML navegable"}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Generando...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="w-5 h-5" aria-hidden="true" />
                        <span>Exportar HTML</span>
                      </span>
                    )}
                  </button>
                </Tooltip>
                {/* Botón de Exportar a PNG */}
                <Tooltip content="Exportar tabla de comparación a PNG" position="top">
                  <button
                    onClick={handlePngExportClick}
                    disabled={isSubmitting || lista.length === 0}
                    className="btn btn-primary"
                    aria-label={isSubmitting ? "Generando PNG..." : "Exportar tabla de comparación a PNG"}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Generando...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Download className="w-5 h-5" aria-hidden="true" />
                        <span>Exportar PNG</span>
                      </span>
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            {lista.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-[var(--border-primary)] shadow-sm">
                  <DataTable data={sortedData} columns={columns} tableClassName="w-full" />
                </div>
            ) : (
              // Estado vacío
              <div className="text-center py-20 px-4 rounded-xl border-2 border-dashed border-[var(--border-secondary)] bg-[var(--bg-tertiary)]/30">
                <div className="w-20 h-20 mx-auto bg-[var(--color-comparador-surface)] rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <PieChartIcon className="h-10 w-10 text-[var(--color-comparador-primary)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Comienza a comparar</h3>
                <p className="mt-2 text-[var(--text-secondary)] max-w-md mx-auto">
                  Utiliza el buscador superior para agregar productos a la lista y comenzar el análisis de precios.
                </p>
              </div>
            )}
          </section>

          {/* Sección de Análisis por Producto - Gráfico de Barras */}
          {lista.length > 0 && (
            <section className="animate-slide-up" style={{ animationDelay: '500ms' }}>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Análisis Individual por Producto</h2>
              <div className="product-analysis-grid-corporate">
                {sortedData.map(item => (
                  <div key={`card-wrapper-${item.codigo}`} id={`product-card-${item.codigo}`}>
                    <ProductAnalysisCardWithBarChartRefactor
                      key={item.codigo}
                      item={item}
                      competidores={competidores}
                      onExpand={(expandedItem) => setSelectedProductForModal(expandedItem)}
                      highlightedBrand={highlightedBrand}
                      onBrandHover={handleBrandHover}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sección de Dashboard */}
          {dashboardKPIs && (
            <section ref={dashboardRef} className="glass-card p-6 md:p-8 animate-slide-up section-tint-comparador" style={{ animationDelay: '300ms' }} aria-labelledby="dashboard-section-title">
              <h2 id="dashboard-section-title" className="sr-only">Dashboard de Comparación de Precios</h2>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard de Comparación</h3>
                <Tooltip content="Resumen visual de métricas de comparación de precios" position="top">
                  <BarChart3 className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
                </Tooltip>
              </div>

              <div ref={pieChartRef} className="glass-card p-4" role="img" aria-label="Gráfico circular de distribución de precios por marca">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Distribución de Precios por Marca</h3>
                <div className="sr-only" aria-live="polite">
                  Gráfico circular que muestra la distribución de precios promedio por marca.
                  {dashboardKPIs.brandRanking.map((item, index) =>
                    `${item.brand}: ${item.avg.toFixed(2)} soles, ${(item.avg / dashboardKPIs.brandRanking.reduce((sum, b) => sum + b.avg, 0) * 100).toFixed(1)}% del total`
                  ).join('. ')}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardKPIs.brandRanking.map(item => ({
                        name: item.brand,
                        value: item.avg,
                        color: getBrandColor(item.brand)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                      outerRadius={100}
                      dataKey="value"
                      aria-label="Distribución de precios por marca"
                    >
                      {dashboardKPIs.brandRanking.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBrandColorByPosition(entry.brand, competidores)} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Modal de Detalles del Producto */}
      <Modal
        isOpen={!!selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        title="Detalles del Producto"
        size="lg"
        aria-describedby="product-details-instruction"
      >
        <div id="product-details-instruction" className="sr-only">
          Detalles del producto seleccionado. Use Escape para cerrar el modal.
        </div>
        {selectedProductForModal && (
          <div className="space-y-6" role="document" aria-label={`Detalles del producto ${selectedProductForModal.nombre}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-[var(--border-primary)] pb-2">Información General</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[var(--text-secondary)]">Nombre:</span>
                  <span className="font-medium">{selectedProductForModal.nombre}</span>
                  <span className="text-[var(--text-secondary)]">Código:</span>
                  <span className="font-medium">{selectedProductForModal.codigo}</span>
                  <span className="text-[var(--text-secondary)]">EAN:</span>
                  <span className="font-medium">{selectedProductForModal.cod_ean || 'N/A'}</span>
                  <span className="text-[var(--text-secondary)]">EAN 14:</span>
                  <span className="font-medium">{selectedProductForModal.ean_14 || 'N/A'}</span>
                  <span className="text-[var(--text-secondary)]">Línea:</span>
                  <span className="font-medium">{selectedProductForModal.linea || 'N/A'}</span>
                  <span className="text-[var(--text-secondary)]">Peso:</span>
                  <span className="font-medium">{selectedProductForModal.peso} kg</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold border-b border-[var(--border-primary)] pb-2">Análisis de Precios</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[var(--text-secondary)]">Precio Promedio:</span>
                  <span className="font-bold text-[var(--color-comparador-primary)]">
                    {typeof (selectedProductForModal as Record<string, unknown>).precio_promedio === 'number'
                      ? `S/ ${((selectedProductForModal as Record<string, unknown>).precio_promedio as number).toFixed(2)}`
                      : 'N/A'}
                  </span>
                  <span className="text-[var(--text-secondary)]">Precio Sugerido:</span>
                  <span className="font-bold text-[var(--color-pedido-primary)]">
                    {selectedProductForModal.precio_sugerido ? `S/ ${selectedProductForModal.precio_sugerido.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-bold mb-2">Precios por Competidor</h4>
                  <div className="space-y-2" role="list" aria-label="Lista de precios por competidor">
                    {competidores.map(comp => (
                      <div key={comp} className="flex justify-between items-center p-2 bg-[var(--bg-tertiary)] rounded-md" role="listitem">
                        <span className="text-xs font-medium">{comp}</span>
                        <span className="text-sm font-bold">
                          {selectedProductForModal.precios?.[comp]
                            ? `S/ ${selectedProductForModal.precios[comp]?.toFixed(2)}`
                            : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {selectedProductForModal.keywords && selectedProductForModal.keywords.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold border-b border-[var(--border-primary)] pb-2">Palabras Clave</h3>
                <div className="flex flex-wrap gap-2" role="list" aria-label="Palabras clave del producto">
                  {selectedProductForModal.keywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)]" role="listitem">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Gráfico de Torta */}
      <Modal
        isOpen={!!selectedProductForPieChart}
        onClose={() => setSelectedProductForPieChart(null)}
        title={`Gráfico de Precios - ${selectedProductForPieChart?.nombre || ''}`}
        size="lg"
        aria-describedby="pie-chart-instruction"
      >
        <div id="pie-chart-instruction" className="sr-only">
          Gráfico circular interactivo de distribución de precios. Use las teclas de flecha para navegar por las porciones.
        </div>
        {selectedProductForPieChart && (
          <PricePieChart
            data={competidores.map(comp => ({
              name: comp,
              value: selectedProductForPieChart.precios?.[comp] ?? 0
            })).filter(item => item.value > 0)}
            title={`Distribución de Precios para ${selectedProductForPieChart.nombre}`}
            aria-label={`Gráfico circular de distribución de precios para ${selectedProductForPieChart.nombre}`}
          />
        )}
      </Modal>

      <ExportOptionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleConfirmExport}
        initialSelectedColumns={selectedExportColumns}
      />
    </div>
  );
};
