
// --------------------------------------------------------------------------- #
//
//                            src/interfaces.ts
//                                                                             #
// --------------------------------------------------------------------------- #

import { z } from 'zod';

/**
 * @description Zod schema for a competitor.
 */
export const CompetenciaSchema = z.object({
  nombre: z.string().min(1, 'El nombre del competidor es requerido.'),
});

/** @type ICompetencia - Inferred type for a competitor. */
export type ICompetencia = z.infer<typeof CompetenciaSchema>;

/**
 * @description Zod schema for a base product.
 */
export const ProductoSchema = z.object({
  /** Identificador único del producto. */
  codigo: z.string().min(1, 'El código es requerido.'),

  /** Código de barras EAN-14 del producto. */
  ean_14: z.string(),

  /** Nombre descriptivo del producto. */
  nombre: z.string().min(1, 'El nombre es requerido.'),

  /** Categoría o línea a la que pertenece el producto. */
  linea: z.string(),

  /** Peso del producto, generalmente en kilogramos. */
  peso: z.number().nonnegative('El peso no puede ser negativo.'),

  /** Cantidad de stock disponible como referencia. */
  stock_referencial: z.number().int('El stock debe ser un número entero.').nonnegative(),

  /** Precio de referencia del producto. */
  precio_referencial: z.number().nonnegative('El precio de referencia no puede ser negativo.').optional(),

  /** Cantidad de unidades por caja o empaque master. */
  cantidad_por_caja: z.number().int('La cantidad por caja debe ser un número entero.').positive('La cantidad por caja debe ser mayor a cero.').optional(),

  /** Palabras clave para facilitar la búsqueda del producto. */
  keywords: z.array(z.string()),
});

/** @type IProducto - Inferred type for a base product. */
export type IProducto = z.infer<typeof ProductoSchema>;

/**
 * @description Zod schema for an edited product, extending the base product.
 */
export const ProductoEditadoSchema = ProductoSchema.extend({
  /** La cantidad del producto que se está gestionando. */
  cantidad: z.number().int('La cantidad debe ser un número entero.').positive('La cantidad debe ser mayor a cero.'),

  /** Notas o comentarios adicionales sobre el producto en la lista. */
  observaciones: z.string().optional(),

  /** Un objeto para almacenar los precios de la competencia. */
  precios: z.record(z.string(), z.number()).optional(),


  /** Precio promedio de los competidores. */
  precio_promedio: z.number().nonnegative().optional(),

  // Descuento requerido calculado en el cliente: 1 - (precio_competidor / precio_propio).
  // Fórmula canónica en src/utils/priceCalculations.ts (calculateDsctoRequerido).
  /** Descuento requerido vs Marca 2: 1 - (precio_m2 / precio_m1) */
  m2_ratio: z.number().optional(),

  /** Descuento requerido vs Marca 3: 1 - (precio_m3 / precio_m1) */
  m3_ratio: z.number().optional(),

  /** Descuento requerido vs Marca 4: 1 - (precio_m4 / precio_m1) */
  m4_ratio: z.number().optional(),

  /** Descuento requerido vs Marca 5: 1 - (precio_m5 / precio_m1) */
  m5_ratio: z.number().optional(),
});

/** @type IProductoEditado - Inferred type for an edited product. */
export type IProductoEditado = z.infer<typeof ProductoEditadoSchema>;

/**
 * @description Zod schema for the general form data.
 * Provides runtime validation and an inferred TypeScript type from a single source of truth.
 * All fields are optional to handle different forms across the application.
 */
export const FormSchema = z.object({
  /** Tipo de documento seleccionado (RUC o DNI). */
  documentType: z.union([z.literal('ruc'), z.literal('dni')]).optional(),

  /** Nombre del cliente (usado en Devoluciones, Pedidos). */
  cliente: z.string().optional(),

  /** Documento del cliente (RUC/DNI). */
  documento_cliente: z.string().optional(),

  /** Código del cliente (opcional, usado en Devoluciones, Pedidos). */
  codigo_cliente: z.string().optional(),

  /** Fecha de la operación (común a todos los módulos). */
  fecha: z.string().optional(),



  /** Nombre de la Marca 1 para comparación de precios. */
  marca1: z.string().optional(),

  /** Nombre de la Marca 2 para comparación de precios. */
  marca2: z.string().optional(),

  /** Nombre de la Marca 3 para comparación de precios. */
  marca3: z.string().optional(),

  /** Nombre de la Marca 4 para comparación de precios. */
  marca4: z.string().optional(),

  /** Nombre de la Marca 5 para comparación de precios. */
  marca5: z.string().optional(),

  /** Sucursal de la operación (usado en Devoluciones, Pedido, Inventario, Comparador). */
  sucursal: z.string().optional(),

  /** Monto total original. */
  montoOriginal: z.number().optional(),
});

/**
 * @type IForm
 * @description Defines the structure of the general form data, inferred from the Zod schema.
 */
export type IForm = z.infer<typeof FormSchema>;

/**
 * @description Defines which fields to show in the universal DatosGeneralesForm.
 */
export interface FieldConfig {
  showRucDni?: boolean;
  showCodigoCliente?: boolean;
  showSucursal?: boolean;
  showFecha?: boolean;
  showMotivo?: boolean;
  showMarcas?: boolean;
  showMontoOriginal?: boolean;
  showCargarRespaldo?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'isNumeric' | 'isValidDate' | 'isDni' | 'isRuc' | 'maxLength' | 'minLength';
  value?: number;
  message: string;
}

export interface ICalcularApiParams {
  montoTotal: number;
  fechasValidas: string[];
  razonSocial: string;
}

export interface ICalcularApiResponse {
  montosAsignados: Record<string, number>;
  resumenMensual: Record<string, number>;
  fechasValidas: string[];
}

export interface BlobWithName extends Blob {
  name: string;
}

export type ComparisonTableRow = IProductoEditado & Record<string, unknown>;
