/**
 * @file priceCalculations.ts
 * @description Utilidades centralizadas para cálculos de precios y porcentajes
 * 
 * MANTENIMIENTO:
 * - Funciones puras de cálculo, sin dependencias de estado
 * - Usar estas funciones para nuevos cálculos en lugar de duplicar lógica
 * - Las fórmulas están documentadas en cada función
 * 
 * @author Carlos Cusi
 * @date 2026-03-03
 */

/**
 * Utilidades centralizadas para cálculos de precios y porcentajes
 * Elimina duplicación de lógica matemática en toda la aplicación
 */

export interface PriceData {
  label: string;
  value: number | null;
}

export interface PercentageDifference {
  name: string;
  percentage: number;
  isBetter: boolean;
}

export interface CompetitiveAnalysis {
  myPosition: number;
  bestDiff: PercentageDifference | null;
  worstDiff: PercentageDifference | null;
  sortedPrices: PriceData[];
  validPrices: PriceData[];
}

/**
 * Calcula el porcentaje de diferencia entre dos precios
 * @param current - Precio actual
 * @param base - Precio base para comparación
 * @returns Porcentaje de diferencia
 */
export const calculatePercentage = (current: number, base: number): number => {
  if (base === 0) return 0;
  return ((current - base) / base) * 100;
};

/**
 * Formatea un precio con 2 decimales y símbolo de moneda
 * @param price - Valor del precio
 * @returns String formateado (ej: "S/ 12.34")
 */
export const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return 'N/A';
  return `S/ ${price.toFixed(2)}`;
};

/**
 * Formatea un porcentaje con 2 decimales y símbolo
 * @param percentage - Valor del porcentaje
 * @returns String formateado (ej: "33.33%")
 */
export const formatPercentage = (percentage: number): string => {
  return `${Math.abs(percentage).toFixed(2)}%`;
};

/**
 * Formatea una diferencia de porcentaje con indicador visual
 * @param percentage - Valor del porcentaje
 * @returns String formateado (ej: "▼ 33.33%" o "▲ 33.33%")
 */
export const formatPercentageWithIndicator = (percentage: number): string => {
  const indicator = percentage < 0 ? '▼' : '▲';
  return `${indicator} ${formatPercentage(percentage)}`;
};

/**
 * Calcula las diferencias de porcentaje respecto a un precio base
 * @param prices - Array de precios con etiquetas
 * @param basePrice - Precio base para comparación
 * @param baseLabel - Etiqueta del precio base
 * @returns Array de diferencias calculadas
 */
export const calculatePercentageDifferences = (
  prices: PriceData[],
  basePrice: number,
  baseLabel: string
): PercentageDifference[] => {
  return prices
    .filter(p => p.label !== baseLabel && p.value !== null && p.value > 0)
    .map(p => {
      const percentage = calculatePercentage(p.value!, basePrice);
      return {
        name: p.label,
        percentage,
        isBetter: percentage < 0
      };
    });
};

/**
 * Encuentra la mejor y peor diferencia de un array de porcentajes
 * @param differences - Array de diferencias de porcentaje
 * @returns Objeto con mejor y peor diferencia
 */
export const findBestAndWorstDifferences = (
  differences: PercentageDifference[]
): { best: PercentageDifference | null; worst: PercentageDifference | null } => {
  const best = differences.length > 0
    ? differences.reduce((best, current) =>
        current.isBetter && (!best || current.percentage < best.percentage) ? current : best
      )
    : null;

  const worst = differences.length > 0
    ? differences.reduce((worst, current) =>
        !current.isBetter && (!worst || current.percentage > worst.percentage) ? current : worst
      )
    : null;

  return { best, worst };
};

/**
 * Realiza análisis competitivo completo de precios
 * @param prices - Array de precios
 * @param myBrand - Marca principal para análisis
 * @returns Objeto con análisis competitivo completo
 */
export const performCompetitiveAnalysis = (
  prices: PriceData[],
  myBrand: string
): CompetitiveAnalysis => {
  // Filtrar precios válidos y ordenar
  const validPrices = prices.filter(p => p.value !== null);
  const sortedPrices = [...validPrices].sort((a, b) => (a.value || 0) - (b.value || 0));
  
  // Calcular posición de mi marca
  const myPosition = sortedPrices.findIndex(p => p.label === myBrand) + 1;
  
  // Obtener mi precio
  const myPrice = prices.find(p => p.label === myBrand)?.value ?? 0;
  
  // Calcular diferencias de porcentaje
  const differences = calculatePercentageDifferences(prices, myPrice, myBrand);
  
  // Encontrar mejor y peor diferencia
  const { best: bestDiff, worst: worstDiff } = findBestAndWorstDifferences(differences);
  
  return {
    myPosition,
    bestDiff,
    worstDiff,
    sortedPrices,
    validPrices
  };
};

/**
 * Calcula estadísticas básicas de precios
 * @param prices - Array de precios válidos
 * @returns Objeto con estadísticas
 */
export const calculatePriceStatistics = (prices: PriceData[]) => {
  const validPrices = prices.filter(p => p.value !== null && p.value !== undefined);
  
  if (validPrices.length === 0) {
    return {
      average: 0,
      min: 0,
      max: 0,
      count: 0
    };
  }
  
  const values = validPrices.map(p => p.value!);
  const sum = values.reduce((acc, val) => acc + val, 0);
  
  return {
    average: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    count: validPrices.length
  };
};