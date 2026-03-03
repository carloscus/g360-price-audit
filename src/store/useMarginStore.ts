// --------------------------------------------------------------------------- #
//                                                                             #
//                  src/store/useMarginStore.ts                                #
//           Store para Calculadora de Margen                                  #
//                                                                             #
// MANTENIMIENTO:
// - Este store usa Zustand con persistencia en localStorage
// - Las fórmulas de cálculo están centralizadas en este archivo
// - Si se modifica la lógica de cálculo, actualizar también priceCalculations.ts
// - El campo 'lockedFields' controla qué campos se calculan automáticamente
//
// @author Carlos Cusi
// @date 2026-03-03
// --------------------------------------------------------------------------- #

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IProducto } from '../interfaces';

// --- Tipos ---

/**
 * Producto en la calculadora de margen
 */
export interface MarginProduct {
  /** Código único del producto */
  codigo: string;
  /** Nombre del producto */
  nombre: string;
  /** Precio de costo (mi precio) */
  costo: number | null;
  /** Precio de venta al público */
  precio: number | null;
  /** Markup % = ((precio - costo) / costo) × 100 */
  markup: number | null;
  /** Margen % = ((precio - costo) / precio) × 100 */
  margen: number | null;
  /** Campos bloqueados (no se pueden editar) */
  lockedFields: ('costo' | 'precio' | 'markup' | 'margen')[];
}

/**
 * Información del cliente para la calculadora
 */
export interface MarginClient {
  nombre: string;
  documento: string;
  ruc?: string;
  codigoCliente?: string;
}

/**
 * Estado del store de margen
 */
interface MarginState {
  /** Lista de productos en la calculadora */
  productos: MarginProduct[];
  /** Margen global para aplicar a todos */
  margenGlobal: number;
  /** Markup global para aplicar a todos */
  markupGlobal: number;
  /** Información del cliente */
  cliente: MarginClient;
  
  // Acciones
  /** Agregar producto desde catálogo */
  agregarProducto: (producto: IProducto) => void;
  /** Actualizar un campo de un producto */
  actualizarCampo: (codigo: string, campo: 'costo' | 'precio' | 'markup' | 'margen', valor: number) => void;
  /** Aplicar margen global a todos los productos */
  aplicarMargenGlobal: () => void;
  /** Aplicar markup global a todos los productos */
  aplicarMarkupGlobal: () => void;
  /** Eliminar producto de la lista */
  eliminarProducto: (codigo: string) => void;
  /** Limpiar todos los productos */
  limpiarTodo: () => void;
  /** Establecer margen global */
  setMargenGlobal: (valor: number) => void;
  /** Establecer markup global */
  setMarkupGlobal: (valor: number) => void;
  /** Establecer cliente */
  setCliente: (cliente: MarginClient) => void;
  /** Limpiar cliente */
  limpiarCliente: () => void;
}

// --- Funciones de Cálculo ---

/**
 * Calcula el markup desde costo y precio
 * Markup = ((precio - costo) / costo) × 100
 */
const calcularMarkup = (costo: number, precio: number): number => {
  if (costo === 0) return 0;
  return ((precio - costo) / costo) * 100;
};

/**
 * Calcula el margen desde costo y precio
 * Margen = ((precio - costo) / precio) × 100
 */
const calcularMargen = (costo: number, precio: number): number => {
  if (precio === 0) return 0;
  return ((precio - costo) / precio) * 100;
};

/**
 * Calcula el precio desde costo y markup
 * Precio = Costo × (1 + Markup/100)
 */
const calcularPrecioDesdeMarkup = (costo: number, markup: number): number => {
  return costo * (1 + markup / 100);
};

/**
 * Calcula el precio desde costo y margen
 * Precio = Costo / (1 - Margen/100)
 */
const calcularPrecioDesdeMargen = (costo: number, margen: number): number => {
  if (margen >= 100) return costo; // Evitar división por cero o negativo
  return costo / (1 - margen / 100);
};

/**
 * Calcula el costo desde precio y markup
 * Costo = Precio / (1 + Markup/100)
 */
const calcularCostoDesdeMarkup = (precio: number, markup: number): number => {
  return precio / (1 + markup / 100);
};

/**
 * Calcula el costo desde precio y margen
 * Costo = Precio × (1 - Margen/100)
 */
const calcularCostoDesdeMargen = (precio: number, margen: number): number => {
  return precio * (1 - margen / 100);
};

/**
 * Determina qué campos bloquear basándose en cuáles fueron editados
 * Regla: Solo 2 campos pueden estar editados a la vez
 * Excepción: Markup + Margen no pueden ser los únicos editados (sin valor absoluto)
 */
const determinarCamposBloqueados = (
  campoEditado: 'costo' | 'precio' | 'markup' | 'margen',
  producto: MarginProduct
): ('costo' | 'precio' | 'markup' | 'margen')[] => {
  const camposConValor: ('costo' | 'precio' | 'markup' | 'margen')[] = [];
  
  if (producto.costo !== null) camposConValor.push('costo');
  if (producto.precio !== null) camposConValor.push('precio');
  if (producto.markup !== null) camposConValor.push('markup');
  if (producto.margen !== null) camposConValor.push('margen');
  
  // Si el campo editado no está en la lista, agregarlo
  if (!camposConValor.includes(campoEditado)) {
    camposConValor.push(campoEditado);
  }
  
  // Si solo hay markup y margen, no es válido (necesitamos un valor absoluto)
  if (camposConValor.length === 2 && 
      camposConValor.includes('markup') && 
      camposConValor.includes('margen')) {
    // No bloquear nada - necesitamos que el usuario ingrese costo o precio
    return [];
  }
  
  // Si hay 2 campos con valor, bloquear los otros 2
  if (camposConValor.length >= 2) {
    const todosLosCampos: ('costo' | 'precio' | 'markup' | 'margen')[] = ['costo', 'precio', 'markup', 'margen'];
    return todosLosCampos.filter(c => !camposConValor.includes(c));
  }
  
  return [];
};

/**
 * Recalcula los valores basándose en los campos editados
 */
const recalcularValores = (producto: MarginProduct): Partial<MarginProduct> => {
  const { costo, precio, markup, margen, lockedFields } = producto;
  
  // Determinar qué campos están editados (no bloqueados)
  const camposEditados: ('costo' | 'precio' | 'markup' | 'margen')[] = [];
  if (!lockedFields.includes('costo') && costo !== null) camposEditados.push('costo');
  if (!lockedFields.includes('precio') && precio !== null) camposEditados.push('precio');
  if (!lockedFields.includes('markup') && markup !== null) camposEditados.push('markup');
  if (!lockedFields.includes('margen') && margen !== null) camposEditados.push('margen');
  
  // Caso: Costo + Precio → Calcular Markup y Margen
  if (costo !== null && precio !== null && !lockedFields.includes('costo') && !lockedFields.includes('precio')) {
    return {
      markup: calcularMarkup(costo, precio),
      margen: calcularMargen(costo, precio),
    };
  }
  
  // Caso: Costo + Markup → Calcular Precio y Margen
  if (costo !== null && markup !== null && !lockedFields.includes('costo') && !lockedFields.includes('markup')) {
    const nuevoPrecio = calcularPrecioDesdeMarkup(costo, markup);
    return {
      precio: nuevoPrecio,
      margen: calcularMargen(costo, nuevoPrecio),
    };
  }
  
  // Caso: Costo + Margen → Calcular Precio y Markup
  if (costo !== null && margen !== null && !lockedFields.includes('costo') && !lockedFields.includes('margen')) {
    const nuevoPrecio = calcularPrecioDesdeMargen(costo, margen);
    return {
      precio: nuevoPrecio,
      markup: calcularMarkup(costo, nuevoPrecio),
    };
  }
  
  // Caso: Precio + Markup → Calcular Costo y Margen
  if (precio !== null && markup !== null && !lockedFields.includes('precio') && !lockedFields.includes('markup')) {
    const nuevoCosto = calcularCostoDesdeMarkup(precio, markup);
    return {
      costo: nuevoCosto,
      margen: calcularMargen(nuevoCosto, precio),
    };
  }
  
  // Caso: Precio + Margen → Calcular Costo y Markup
  if (precio !== null && margen !== null && !lockedFields.includes('precio') && !lockedFields.includes('margen')) {
    const nuevoCosto = calcularCostoDesdeMargen(precio, margen);
    return {
      costo: nuevoCosto,
      markup: calcularMarkup(nuevoCosto, precio),
    };
  }
  
  return {};
};

// --- Store ---

// --- Estado inicial del cliente ---
const initialClient: MarginClient = {
  nombre: '',
  documento: '',
  ruc: '',
};

export const useMarginStore = create<MarginState>()(
  persist(
    (set, get) => ({
      productos: [],
      margenGlobal: 30,
      markupGlobal: 50,
      cliente: initialClient,

      agregarProducto: (producto: IProducto) => {
        const productosActuales = get().productos;
        const existe = productosActuales.find(p => p.codigo === producto.codigo);
        
        if (existe) return; // No duplicar
        
        const nuevoProducto: MarginProduct = {
          codigo: producto.codigo,
          nombre: producto.nombre,
          costo: producto.precio_referencial || null,
          precio: null,
          markup: null,
          margen: null,
          lockedFields: [],
        };
        
        set(state => ({
          productos: [...state.productos, nuevoProducto],
        }));
      },

      actualizarCampo: (codigo, campo, valor) => {
        set(state => {
          const productosActualizados = state.productos.map(p => {
            if (p.codigo !== codigo) return p;
            
            // Actualizar el campo editado
            const productoActualizado: MarginProduct = {
              ...p,
              [campo]: valor,
            };
            
            // Determinar campos bloqueados
            const nuevosBloqueados = determinarCamposBloqueados(campo, productoActualizado);
            productoActualizado.lockedFields = nuevosBloqueados;
            
            // Recalcular valores
            const valoresCalculados = recalcularValores(productoActualizado);
            
            return {
              ...productoActualizado,
              ...valoresCalculados,
            };
          });
          
          return { productos: productosActualizados };
        });
      },

      aplicarMargenGlobal: () => {
        const { productos, margenGlobal } = get();
        
        const productosActualizados = productos.map(p => {
          if (p.costo !== null) {
            const nuevoPrecio = calcularPrecioDesdeMargen(p.costo, margenGlobal);
            return {
              ...p,
              precio: nuevoPrecio,
              margen: margenGlobal,
              markup: calcularMarkup(p.costo, nuevoPrecio),
              lockedFields: ['markup'] as ('costo' | 'precio' | 'markup' | 'margen')[],
            };
          }
          return p;
        });
        
        set({ productos: productosActualizados });
      },

      aplicarMarkupGlobal: () => {
        const { productos, markupGlobal } = get();
        
        const productosActualizados = productos.map(p => {
          if (p.costo !== null) {
            const nuevoPrecio = calcularPrecioDesdeMarkup(p.costo, markupGlobal);
            return {
              ...p,
              precio: nuevoPrecio,
              markup: markupGlobal,
              margen: calcularMargen(p.costo, nuevoPrecio),
              lockedFields: ['margen'] as ('costo' | 'precio' | 'markup' | 'margen')[],
            };
          }
          return p;
        });
        
        set({ productos: productosActualizados });
      },

      eliminarProducto: (codigo) => {
        set(state => ({
          productos: state.productos.filter(p => p.codigo !== codigo),
        }));
      },

      limpiarTodo: () => {
        set({ productos: [] });
      },

      setMargenGlobal: (valor) => {
        set({ margenGlobal: valor });
      },

      setMarkupGlobal: (valor) => {
        set({ markupGlobal: valor });
      },

      setCliente: (cliente) => {
        set({ cliente });
      },

      limpiarCliente: () => {
        set({ cliente: initialClient });
      },
    }),
    {
      name: 'margin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        productos: state.productos,
        margenGlobal: state.margenGlobal,
        markupGlobal: state.markupGlobal,
        cliente: state.cliente,
      }),
    }
  )
);
