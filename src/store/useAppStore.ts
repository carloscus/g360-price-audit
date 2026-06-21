// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/store/useAppStore.ts                              #
//                                                                             #
// MANTENIMIENTO:
// - Store principal de Zustand para el módulo de precios
// - Usa persistencia en localStorage (clave: 'app-storage')
// - El catálogo se carga desde public/data/catalogo_productos.json
// - También usa IndexedDB para caché del catálogo
// - Si el catálogo no carga, verificar: 
//   1. El archivo public/data/catalogo_productos.json existe
//   2. El servidor de desarrollo está corriendo
//   3. No hay errores de CORS
//
// @author Carlos Cusi
// @date 2026-03-03
// --------------------------------------------------------------------------- #

// --- 1. Importaciones necesarias ---
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveCatalogToIndexedDB } from '../utils/indexedDb';
import { sessionCache } from '../utils/sessionCache';
import type { IForm, IProducto, IProductoEditado } from '../interfaces';

// --- Tipos Adicionales ---

interface RawProduct {
  sku?: string | number;
  nombre?: string;
  ean13?: string;
  linea?: string;
  peso_kg?: number;
  precio_lista?: number;
  un_bx?: number;
  keywords?: string[];
}


// --- 2. Definición de la forma del Estado (State) ---
export interface State {
  catalogo: IProducto[];
  catalogCount: number;
  formState: {
    precios: IForm;
  };
  listas: {
    precios: IProductoEditado[];
  };
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

// --- 3. Definición de las Acciones (Actions) ---
interface Actions {
  cargarCatalogo: () => Promise<void>;
  actualizarFormulario: (campo: keyof IForm, valor: string | number) => void;
  agregarProductoToLista: (producto: IProducto) => void;
  actualizarProductoEnLista: <K extends keyof IProductoEditado>(
    codigo: string,
    campo: K,
    valor: IProductoEditado[K]
  ) => void;
  eliminarProductoDeLista: (codigo: string) => void;
  importarProductosMasivamente: (rows: any[]) => void;
  resetearModulo: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// --- 4. Estado Inicial ---
const initialState: Omit<State, keyof Actions> = {
  catalogo: [],
  catalogCount: 0,
  formState: {
    precios: {} as IForm,
  },
  listas: {
    precios: [],
  },
  loading: false,
  error: null,
  theme: 'light',
};

// --- 5. Adaptador de Datos para el nuevo JSON de productos ---
const mapRawProductToIProducto = (rawProduct: RawProduct): IProducto => {
  return {
    codigo: String(rawProduct.sku || ''),
    nombre: rawProduct.nombre || '',
    ean_14: rawProduct.ean13 || '',
    linea: rawProduct.linea || '',
    peso: rawProduct.peso_kg || 0,
    stock_referencial: 0, // No presente en este export de JSON
    precio_referencial: rawProduct.precio_lista || 0,
    cantidad_por_caja: rawProduct.un_bx || 1,
    keywords: Array.isArray(rawProduct.keywords) ? rawProduct.keywords : [],
  };
};


// --- 6. Creación del Store con Zustand ---
export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Implementación de las Acciones ---

      cargarCatalogo: async () => {
        if (get().loading) return;

        // Check if catalog is fresh (less than 12 hours old)
        const lastUpdate = sessionCache.get<number>('last_catalog_update');
        const now = Date.now();
        const isFresh = lastUpdate && (now - lastUpdate) < 12 * 60 * 60 * 1000;

        if (isFresh && get().catalogo.length > 0) {
          // Catalog is fresh, no need to fetch
          return;
        }

        set({ loading: true, error: null });
        try {
          // Cargar catálogo desde el frontend (public/data/productos.json)
          // El backend se usa solo para cálculos complejos y exportaciones
          const baseUrl = import.meta.env.BASE_URL;
          const response = await fetch(`${baseUrl}data/catalogo_productos.json`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el catálogo de productos. Estado: ${response.status}, Mensaje: ${errorText}`);
          }
          const data = await response.json();
          const rawData: RawProduct[] = data.productos || [];

          // Adaptar los datos crudos al formato IProducto
          const mappedData = rawData.map(mapRawProductToIProducto);

          await saveCatalogToIndexedDB(mappedData);

          // Update timestamp
          sessionCache.set('last_catalog_update', now, 12 * 60 * 60 * 1000);

          set({ catalogo: mappedData, catalogCount: mappedData.length, loading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Un error desconocido ocurrió.';
          set({ error: errorMessage, loading: false });
        }
      },

      actualizarFormulario: (campo, valor) => {
        set((state) => ({
          formState: {
            ...state.formState,
            precios: {
              ...state.formState.precios,
              [campo]: valor,
            },
          },
        }));
      },

      agregarProductoToLista: (producto) => {
        const listaActual = get().listas.precios;
        const productoExistente = listaActual.find(p => p.codigo === producto.codigo);

        if (productoExistente) {
          get().actualizarProductoEnLista(producto.codigo, 'cantidad', productoExistente.cantidad + 1);
        } else {
          // Aseguramos que el campo peso siempre sea un número válido
          const peso = producto.peso !== undefined ? Number(producto.peso) : 0;
          const nuevoProducto: IProductoEditado = {
            ...producto,
            peso,
            cantidad: 1,
            observaciones: '',
            precios: {},
      
          };
          set((state) => ({
            listas: {
              ...state.listas,
              precios: [...state.listas.precios, nuevoProducto],
            },
          }));
        }
      },

      actualizarProductoEnLista: <K extends keyof IProductoEditado>(
        codigo: string,
        campo: K,
        valor: IProductoEditado[K]
      ) => {
        set((state) => ({
          listas: {
            ...state.listas,
            precios: state.listas.precios.map((p) => {
              if (p.codigo !== codigo) return p;
              // Special handling for numeric conversions
              if (campo === 'cantidad') {
                const numericValue = typeof valor === 'string' ? parseFloat(valor) : valor;
                return { ...p, [campo]: isNaN(numericValue as number) ? 0 : numericValue };
              }
              return { ...p, [campo]: valor };
            }),
          },
        }));
      },

      eliminarProductoDeLista: (codigo) => {
        set((state) => ({
          listas: {
            ...state.listas,
            precios: state.listas.precios.filter((p) => p.codigo !== codigo),
          },
        }));
      },

      importarProductosMasivamente: (rows) => {
        const { catalogo, listas, formState } = get();
        const currentList = [...listas.precios];

        // Determinar la marca 1 (PRECIO_TIENDA en el Excel se mapea a esta marca)
        const marca1 = (formState.precios.marca1 || '').trim().toLowerCase();
        
        rows.forEach(row => {
          // Buscar producto en catálogo por SKU (codigo)
          const product = catalogo.find(p => p.codigo === String(row.sku || row.SKU || ''));
          if (!product) return;

          const existingIdx = currentList.findIndex(p => p.codigo === product.codigo);
          
          const preciosNuevos: Record<string, number> = {};
          // Mapear precios dinámicos según las columnas del Excel
          Object.entries(row).forEach(([key, val]) => {
            if (key.startsWith('PRECIO_') && val !== null && val !== undefined) {
              const brandName = key.replace('PRECIO_', '').replace(/_/g, ' ').toLowerCase().trim();
              preciosNuevos[brandName] = Number(val);
            }
          });

          // PRECIO_TIENDA se mapea a la marca 1 (ej. vinifan)
          if (marca1 && row.PRECIO_TIENDA !== null && row.PRECIO_TIENDA !== undefined) {
            preciosNuevos[marca1] = Number(row.PRECIO_TIENDA);
          }

          // Preservar precios existentes y mergear los nuevos
          const preciosExistentes = existingIdx > -1 ? currentList[existingIdx].precios || {} : {};
          const productoEditado: IProductoEditado = {
            ...(existingIdx > -1 ? currentList[existingIdx] : { ...product, cantidad: 1, observaciones: '', precios: {} }),
            precios: { ...preciosExistentes, ...preciosNuevos }
          };

          if (existingIdx > -1) {
            currentList[existingIdx] = productoEditado;
          } else {
            currentList.push(productoEditado);
          }
        });

        set({ listas: { precios: currentList } });
      },

      resetearModulo: () => {
        set((state) => ({
          formState: {
            ...state.formState,
            precios: initialState.formState.precios,
          },
          listas: {
            ...state.listas,
            precios: [],
          },
        }));
      },

      setTheme: (theme: 'light' | 'dark') => set(() => ({
        theme: theme
      }))
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        formState: state.formState,
        listas: state.listas,
        theme: state.theme,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);