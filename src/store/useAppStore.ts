// --------------------------------------------------------------------------- #
//                                                                             #
//                       src/store/useAppStore.ts                              #
//                                                                             #
// MANTENIMIENTO:
// - Store principal de Zustand para el módulo de precios
// - Usa persistencia en localStorage (clave: 'app-storage')
// - El catálogo se carga desde public/data/productos.json
// - También usa IndexedDB para caché del catálogo
// - Si el catálogo no carga, verificar: 
//   1. El archivo public/data/productos.json existe
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

interface ModuleStats {
  precios: number;
}

interface RawProduct {
  codigo?: string | number;
  nombre?: string;
  ean?: string;
  ean_14?: string;
  linea?: string;
  can_kg_um?: number;
  stock_referencial?: number;
  precio?: number;
  u_por_caja?: number;
  keywords?: string;
}


// --- 2. Definición de la forma del Estado (State) ---
export interface State {
  catalogo: IProducto[];
  catalogCount: number;
  moduleUsage: ModuleStats;
  incompleteTasks: number;
  lastActivity: { [key: string]: Date };
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
  updateModuleUsage: () => void;
  addIncompleteTask: () => void;
  completeTask: () => void;
  recordActivity: () => void;
  cargarCatalogo: () => Promise<void>;
  actualizarFormulario: (campo: keyof IForm, valor: string | number) => void;
  agregarProductoToLista: (producto: IProducto) => void;
  actualizarProductoEnLista: <K extends keyof IProductoEditado>(
    codigo: string,
    campo: K,
    valor: IProductoEditado[K]
  ) => void;
  eliminarProductoDeLista: (codigo: string) => void;
  resetearModulo: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// --- 4. Estado Inicial ---
const initialState: Omit<State, keyof Actions> = {
  catalogo: [],
  catalogCount: 0,
  moduleUsage: {
    precios: 45,
  },
  incompleteTasks: 5,
  lastActivity: { precios: new Date() },
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
    codigo: String(rawProduct.codigo || ''),
    nombre: rawProduct.nombre || '',
    cod_ean: rawProduct.ean || '',
    ean_14: rawProduct.ean_14 || '',
    linea: rawProduct.linea || '',
    peso: rawProduct.can_kg_um || 0,
    stock_referencial: rawProduct.stock_referencial || 0,
    precio_referencial: rawProduct.precio || 0,
    cantidad_por_caja: rawProduct.u_por_caja || 0,
    keywords: (rawProduct.keywords || '').trim().split(/\s+/).filter(Boolean),
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
          const response = await fetch(`${baseUrl}data/productos.json`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`No se pudo cargar el catálogo de productos. Estado: ${response.status}, Mensaje: ${errorText}`);
          }
          const rawData: RawProduct[] = await response.json();

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
            precio_sugerido: undefined,
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
              if (campo === 'cantidad' || campo === 'precio_sugerido') {
                const numericValue = typeof valor === 'string' ? parseInt(valor, 10) : valor;
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

      resetearModulo: () => {
        console.log('Reseteando módulo precios');
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

      updateModuleUsage: () => set((state) => ({
        moduleUsage: {
          ...state.moduleUsage,
          precios: Math.min(100, state.moduleUsage.precios + Math.random() * 10)
        }
      })),

      recordActivity: () => set((state) => ({
        lastActivity: {
          ...state.lastActivity,
          precios: new Date()
        }
      })),

      addIncompleteTask: () => set((state) => ({
        incompleteTasks: state.incompleteTasks + 1
      })),

      completeTask: () => set((state) => ({
        incompleteTasks: Math.max(0, state.incompleteTasks - 1)
      })),

      setTheme: (theme: 'light' | 'dark') => set(() => ({
        theme: theme
      }))
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        formState: state.formState,
        listas: state.listas,
        moduleUsage: state.moduleUsage,
        incompleteTasks: state.incompleteTasks,
        lastActivity: state.lastActivity,
        theme: state.theme,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);