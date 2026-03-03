/**
 * @file comparisonUtils.ts
 * @description Utilidades para cálculos de comparación de precios
 * 
 * MANTENIMIENTO:
 * - Si las fórmulas de porcentaje cambian, actualizar aquí y en priceCalculations.ts
 * - Asegurar que la fórmula de variación sea consistente: ((Base / Competidor) - 1) * 100
 * - Los campos 'mX_ratio' se usan en el backend, no modificar sin consultar
 * 
 * @author Carlos Cusi
 * @date 2026-03-03
 */

import type { IProductoEditado } from '../interfaces';

export function calculateDataWithPercentages(
  lista: IProductoEditado[],
  competidores: string[]
): (IProductoEditado & Record<string, string | number | undefined>)[] {
  return lista.map(producto => {
    const precios = producto.precios || {};
    const p1 = precios[competidores[0]] || 0;
    const porcentajes: { [key: string]: string | number | undefined } = {};

    // Identificar el mejor precio (el más bajo > 0)
    let mejorPrecio = Infinity;
    let mejorCompetidor = '';

    competidores.forEach(comp => {
      const precio = precios[comp] || 0;
      if (precio > 0 && precio < mejorPrecio) {
        mejorPrecio = precio;
        mejorCompetidor = comp;
      }
    });

    if (mejorPrecio !== Infinity) {
      porcentajes['mejor_precio_competidor'] = mejorCompetidor;
    }

    if (p1 > 0) {
      // Calcular porcentajes contra competidores
      for (let i = 1; i < competidores.length; i++) {
        const competidorActual = competidores[i];
        const pi = precios[competidorActual] || 0;
        if (pi > 0) {
          // Fórmula: ((Base / Competidor) - 1) * 100
          const ratio = (p1 / pi) - 1;
          porcentajes[`% vs ${competidorActual}`] = `${(ratio * 100).toFixed(2)}%`;
          
          // Calcular ratio (Base / Competidor) - 1 para backend
          const ratioValue = (p1 / pi) - 1;
          porcentajes[`m${i + 1}_ratio`] = ratioValue;
        } else {
          porcentajes[`% vs ${competidorActual}`] = 'N/A';
          porcentajes[`m${i + 1}_ratio`] = undefined;
        }
      }

      // Calcular % Ajuste a Sugerido
      const precioSugerido = producto.precio_sugerido || 0;
      if (precioSugerido > 0) {
        // Fórmula: ((Sugerido / Base) - 1) * 100
        const ratioSugerido = (precioSugerido / p1) - 1;
        porcentajes['% Ajuste a Sugerido'] = `${(ratioSugerido * 100).toFixed(2)}%`;
      } else {
        porcentajes['% Ajuste a Sugerido'] = 'N/A';
      }

    } else {
      // Si no hay precio base, todos los cálculos son N/A
      for (let i = 1; i < competidores.length; i++) {
        porcentajes[`% vs ${competidores[i]}`] = 'N/A';
        porcentajes[`m${i + 1}_ratio`] = undefined;
      }
      porcentajes['% Ajuste a Sugerido'] = 'N/A';
    }

    // Calcular Precio Promedio - solo de los precios de competidores
    // IMPORTANTE: Solo incluir los precios de los competidores, no otros campos
    const preciosCompetidores = competidores
      .map(comp => precios[comp])
      .filter((p): p is number => typeof p === 'number' && p > 0);
    
    const precioPromedio = preciosCompetidores.length > 0
      ? preciosCompetidores.reduce((a, b) => a + b, 0) / preciosCompetidores.length
      : 0;

    return {
      ...producto,
      ...porcentajes,
      precio_promedio: precioPromedio
    } as (IProductoEditado & Record<string, string | number | undefined>);
  });
}

export function calculateSummary(
  dataWithPercentages: (IProductoEditado & Record<string, string | number | undefined>)[],
  competidores: string[]
) {
  const pctHeaders = competidores.slice(1).map((comp) => `% vs ${comp}`);
  pctHeaders.push('% Ajuste a Sugerido'); // Usar el nuevo encabezado de ajuste
  const valores: number[] = [];

  for (const row of dataWithPercentages) {
    for (const h of pctHeaders) {
      const raw = (row as unknown as Record<string, string | undefined>)[h];
      if (!raw) continue;
      const num = parseFloat(raw.replace('%', '').replace(',', '.'));
      if (Number.isFinite(num)) valores.push(num);
    }
  }

  if (valores.length === 0) {
    return { min: 0, max: 0, n: 0 };
  }
  let min = valores[0];
  let max = valores[0];
  for (const v of valores) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max, n: valores.length };
}
