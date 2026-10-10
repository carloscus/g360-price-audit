import * as ExcelJS from 'exceljs';
import { debugLog, APP_LOCALE } from './config';

export interface ExcelProducto {
  codigo: string;
  ean_14?: string;
  linea?: string;
  nombre: string;
  costo?: number | null;
  precioTienda?: number | null;
  precios: Record<string, number | null>;
  prop1Precio?: number | null;
  prop2Costo?: number | null;
  prop2Precio?: number | null;
  prop2CantidadMinima?: number | null;
}

interface ExcelData {
  productos: ExcelProducto[];
  marcas: string[];
  cliente: string;
  documento?: string;
  codigo_cliente?: string;
  sucursal?: string;
  responsable?: string;
  fecha?: string;
}

function colToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * Genera una plantilla básica para la carga masiva de precios.
 */
export async function generateBulkUploadTemplate(marcas: string[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('CARGA_MASIVA');

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } },
    alignment: { horizontal: 'center' }
  };

  // Cabeceras: SKU es el identificador único obligatorio
  const headers = ['SKU', 'PRECIO_TIENDA'];
  
  // Añadir columnas para competidores (saltamos la marca 1 que es "Mi Marca")
  // Contar cuántas veces aparece cada marca antes del slice (marca1)
  const before: Record<string, number> = {};
  marcas.slice(0, 1).forEach(m => {
    if (m && m.trim() !== '') {
      const key = m.toUpperCase().replace(/\s+/g, '_');
      before[key] = (before[key] || 0) + 1;
    }
  });
  // Generar headers con el mismo criterio de sufijos que la vista (ComparadorPage)
  const seen: Record<string, number> = {};
  marcas.slice(1).forEach(m => {
    if (m && m.trim() !== '') {
      const key = m.toUpperCase().replace(/\s+/g, '_');
      seen[key] = (seen[key] || 0) + 1;
      const suffix = (before[key] || 0) + seen[key];
      headers.push(`PRECIO_${key}${suffix > 1 ? suffix : ''}`);
    }
  });

  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell(cell => {
    cell.style = headerStyle;
  });

  // Ajustar anchos
  worksheet.getColumn(1).width = 15; // SKU
  worksheet.getColumn(2).width = 18; // Precio Tienda
  for (let i = 3; i <= headers.length; i++) worksheet.getColumn(i).width = 15;

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function generateExcelWithExcelJS(data: ExcelData): Promise<Blob> {
  debugLog('Generando Excel unificado (Actual + Prop1 + Prop2)...');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ccusi';
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const sheet1Name = 'AUDITORIA_DE_CAMPO';
  const worksheet = workbook.addWorksheet(sheet1Name);

  const currencyFormat = '#,##0.00';
  const percentageFormat = '0.00%';

  const marcasValidas = data.marcas.filter(m => m && m.trim() !== '');
  const numMarcas = marcasValidas.length;
  const numCompetidores = Math.max(0, numMarcas - 1);

  if (numMarcas === 0) {
    throw new Error('No hay marcas configuradas para exportar');
  }

  worksheet.getCell('A1').value = 'CLIENTE:';
  worksheet.getCell('A1').font = { bold: true };
  worksheet.getCell('B1').value = data.cliente;
  worksheet.getCell('A2').value = 'DOCUMENTO:';
  worksheet.getCell('A2').font = { bold: true };
  worksheet.getCell('B2').value = data.documento || '';
  worksheet.getCell('A3').value = 'FECHA:';
  worksheet.getCell('A3').font = { bold: true };
  worksheet.getCell('B3').value = data.fecha || new Date().toLocaleDateString(APP_LOCALE);
  worksheet.getCell('A4').value = 'RESPONSABLE:';
  worksheet.getCell('A4').font = { bold: true };
  worksheet.getCell('B4').value = data.responsable || '';

  let marcaRow = 6;
  marcasValidas.forEach((marca, index) => {
    worksheet.getCell(`A${marcaRow}`).value = `MARCA ${index + 1}:`;
    worksheet.getCell(`A${marcaRow}`).font = { bold: true };
    worksheet.getCell(`B${marcaRow}`).value = marca;
    marcaRow++;
  });

  const editableBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2CC' } };
  const editableBorder: Partial<ExcelJS.Borders> = { top: { style: 'dashed' }, bottom: { style: 'dashed' } };
  const formulaBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } };
  const formulaAccentBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E9D7F3' } };
  const rankingBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DBEEF4' } };
  const prop1Bg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F0FE' } };
  const prop2Bg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3E8FD' } };
  const p1EditBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D4E8FC' } };
  const p2EditBg: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EAD8F5' } };

  const brandColors: string[] = ['B8E6D0', 'C6E0B4', 'B8CCE4', 'FFE699', 'D5A6BD'];

  const COL_CODIGO = 1;
  const COL_EAN = 2;
  const COL_LINEA = 3;
  const COL_NOMBRE = 4;
  const COL_COSTO = 5;
  const COL_PRECIO_TIENDA = 6;
  const COL_GANANCIA = 7;
  const COL_MARGEN = 8;

  const competenciaColStart = 9;
  const competidorPriceCols: number[] = [];
  for (let i = 0; i < numCompetidores; i++) {
    competidorPriceCols.push(competenciaColStart + (i * 3));
  }

  const lastCompetitorCol = numCompetidores > 0 ? competenciaColStart + (numCompetidores * 3) - 1 : competenciaColStart - 1;
  const afterCompCol = lastCompetitorCol + 1;
  const COL_RANKING = afterCompCol;

  const COL_P1_PRECIO = COL_RANKING + 1;
  const COL_P1_MARGEN = COL_P1_PRECIO + 1;
  const COL_P1_GANANCIA = COL_P1_PRECIO + 2;
  const COL_P1_RANKING = COL_P1_PRECIO + 3;

  const COL_P2_COSTO = COL_P1_RANKING + 1;
  const COL_P2_PRECIO = COL_P2_COSTO + 1;
  const COL_P2_CANTIDAD_MINIMA = COL_P2_COSTO + 2;
  const COL_P2_MARGEN = COL_P2_COSTO + 3;
  const COL_P2_GANANCIA = COL_P2_COSTO + 4;
  const COL_P2_DIF_COSTO = COL_P2_COSTO + 5;
  const COL_P2_IMPACTO = COL_P2_COSTO + 6;
  const COL_P2_RANKING = COL_P2_COSTO + 7;

  const headers: string[] = [
    'CODIGO', 'EAN13', 'LÍNEA', 'NOMBRE PRODUCTO',
    'COSTO (S/)', 'P. TIENDA (S/)', 'GANANCIA (S/)', 'MARGEN (%)',
  ];

  for (let i = 1; i < numMarcas; i++) {
    const marcaName = marcasValidas[i];
    headers.push(`${marcaName}_PRECIO`, `${marcaName}_DIF`, `${marcaName}_PCT`);
  }

  headers.push('RANKING');
  headers.push('P1 PRECIO (S/)', 'P1 MARGEN (%)', 'P1 GANANCIA (S/)', 'P1 RANKING');
  headers.push('P2 COSTO (S/)', 'P2 PRECIO (S/)', 'P2 CANTIDAD MÍNIMA', 'P2 MARGEN (%)', 'P2 GANANCIA (S/)', 'P2 DIF COSTO (S/)', 'P2 IMPACTO (%)', 'P2 RANKING');

  const tableStartRow = marcaRow + 2;

  const headerColorMap: Record<number, string> = {};
  headerColorMap[COL_CODIGO] = '00a86b';
  headerColorMap[COL_EAN] = '00a86b';
  headerColorMap[COL_LINEA] = '00a86b';
  headerColorMap[COL_NOMBRE] = '00a86b';
  headerColorMap[COL_COSTO] = 'F57F17';
  headerColorMap[COL_PRECIO_TIENDA] = 'F57F17';
  headerColorMap[COL_GANANCIA] = '2E7D32';
  headerColorMap[COL_MARGEN] = '6A1B9A';
  headerColorMap[COL_RANKING] = '1565C0';
  competidorPriceCols.forEach((_, i) => {
    const base = competenciaColStart + i * 3;
    const c = brandColors[i % brandColors.length];
    headerColorMap[base] = c;
    headerColorMap[base + 1] = c;
    headerColorMap[base + 2] = c;
  });
  for (let c = COL_P1_PRECIO; c <= COL_P1_RANKING; c++) headerColorMap[c] = '1A73E8';
  for (let c = COL_P2_COSTO; c <= COL_P2_RANKING; c++) headerColorMap[c] = '7B1FA2';

  const editableCols = new Set([
    COL_COSTO, COL_PRECIO_TIENDA,
    ...competidorPriceCols,
    COL_P1_PRECIO, COL_P2_COSTO, COL_P2_PRECIO, COL_P2_CANTIDAD_MINIMA,
  ]);

  headers.forEach((header, index) => {
    const colNum = index + 1;
    const cell = worksheet.getCell(tableStartRow, colNum);
    cell.value = header;
    const isEditable = editableCols.has(colNum);
    const isLightHeader = isEditable || colNum >= competenciaColStart;
    cell.font = { name: 'Calibri', bold: true, size: 10, color: { argb: isLightHeader ? '000000' : 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColorMap[colNum] || '00a86b' } };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  });

  let dataRow = tableStartRow + 1;

  const costoLetter = colToLetter(COL_COSTO);
  const ptLetter = colToLetter(COL_PRECIO_TIENDA);
  const p1pLetter = colToLetter(COL_P1_PRECIO);
  const p2cLetter = colToLetter(COL_P2_COSTO);
  const p2pLetter = colToLetter(COL_P2_PRECIO);

  const compPriceColLetters = competidorPriceCols.map(c => colToLetter(c));

  for (const producto of data.productos) {
    const row = worksheet.getRow(dataRow);
    const r = dataRow;
    const preciosMap = producto.precios || {};

    row.getCell(COL_CODIGO).value = producto.codigo || '';
    row.getCell(COL_CODIGO).alignment = { horizontal: 'left' };

    row.getCell(COL_EAN).value = producto.ean_14 || '';
    row.getCell(COL_EAN).alignment = { horizontal: 'left' };

    row.getCell(COL_LINEA).value = producto.linea || '';
    row.getCell(COL_LINEA).alignment = { horizontal: 'left' };

    row.getCell(COL_NOMBRE).value = producto.nombre || '';
    row.getCell(COL_NOMBRE).alignment = { horizontal: 'left' };

    const costoCell = row.getCell(COL_COSTO);
    costoCell.value = producto.costo ?? null;
    costoCell.numFmt = currencyFormat;
    costoCell.alignment = { horizontal: 'right' };
    costoCell.fill = editableBg;
    costoCell.border = editableBorder;

    const ptCell = row.getCell(COL_PRECIO_TIENDA);
    ptCell.value = producto.precioTienda ?? preciosMap[marcasValidas[0]] ?? null;
    ptCell.numFmt = currencyFormat;
    ptCell.alignment = { horizontal: 'right' };
    ptCell.fill = editableBg;
    ptCell.border = editableBorder;

    const gCell = row.getCell(COL_GANANCIA);
    gCell.value = { formula: `=IF(AND(${costoLetter}${r}<>"",${ptLetter}${r}<>""),${ptLetter}${r}-${costoLetter}${r},"")` };
    gCell.numFmt = currencyFormat;
    gCell.alignment = { horizontal: 'right' };
    gCell.fill = formulaBg;
    gCell.font = { bold: true };

    const mCell = row.getCell(COL_MARGEN);
    mCell.value = { formula: `=IF(AND(${costoLetter}${r}<>"",${ptLetter}${r}<>""),(${ptLetter}${r}-${costoLetter}${r})/${ptLetter}${r},"")` };
    mCell.numFmt = percentageFormat;
    mCell.alignment = { horizontal: 'right' };
    mCell.fill = formulaAccentBg;

    for (let i = 0; i < numCompetidores; i++) {
      const marcaName = marcasValidas[i + 1];
      const price = preciosMap[marcaName] || null;
      const colorIndex = i % brandColors.length;
      const brandColor = brandColors[colorIndex];
      const priceCol = competidorPriceCols[i];
      const difCol = priceCol + 1;
      const pctCol = priceCol + 2;
      const priceColLetter = colToLetter(priceCol);

      const priceCell = row.getCell(priceCol);
      priceCell.value = price;
      priceCell.numFmt = currencyFormat;
      priceCell.alignment = { horizontal: 'right' };
      priceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
      priceCell.border = editableBorder;

      const difCell = row.getCell(difCol);
      difCell.value = { formula: `=IFERROR(${ptLetter}${r}-${priceColLetter}${r},"")` };
      difCell.numFmt = currencyFormat;
      difCell.alignment = { horizontal: 'right' };
      difCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };

      const pctCell = row.getCell(pctCol);
      pctCell.value = { formula: `=IFERROR(1-${priceColLetter}${r}/${ptLetter}${r},"")` };
      pctCell.numFmt = percentageFormat;
      pctCell.alignment = { horizontal: 'right' };
      pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: brandColor } };
    }

  const rankCell = row.getCell(COL_RANKING);
  if (compPriceColLetters.length > 0) {
    const comparisons = compPriceColLetters.map(l => `IF(AND(${l}${r}<>"",${l}${r}<${ptLetter}${r}),1,0)`).join('+');
    rankCell.value = { formula: `=IF(${ptLetter}${r}<>"",1+${comparisons},"")` };
  }
  rankCell.alignment = { horizontal: 'center' };
  rankCell.fill = rankingBg;
  rankCell.font = { bold: true };

    const p1pCell = row.getCell(COL_P1_PRECIO);
    p1pCell.value = producto.prop1Precio ?? null;
    p1pCell.numFmt = currencyFormat;
    p1pCell.alignment = { horizontal: 'right' };
    p1pCell.fill = p1EditBg;
    p1pCell.border = editableBorder;

    const p1mCell = row.getCell(COL_P1_MARGEN);
    p1mCell.value = { formula: `=IF(AND(${costoLetter}${r}<>"",${p1pLetter}${r}<>""),(${p1pLetter}${r}-${costoLetter}${r})/${p1pLetter}${r},"")` };
    p1mCell.numFmt = percentageFormat;
    p1mCell.alignment = { horizontal: 'right' };
    p1mCell.fill = prop1Bg;

    const p1gCell = row.getCell(COL_P1_GANANCIA);
    p1gCell.value = { formula: `=IF(AND(${costoLetter}${r}<>"",${p1pLetter}${r}<>""),${p1pLetter}${r}-${costoLetter}${r},"")` };
    p1gCell.numFmt = currencyFormat;
    p1gCell.alignment = { horizontal: 'right' };
    p1gCell.fill = prop1Bg;
    p1gCell.font = { bold: true };

  const p1rCell = row.getCell(COL_P1_RANKING);
  if (compPriceColLetters.length > 0) {
    const comparisons = compPriceColLetters.map(l => `IF(AND(${l}${r}<>"",${l}${r}<${p1pLetter}${r}),1,0)`).join('+');
    p1rCell.value = { formula: `=IF(${p1pLetter}${r}<>"",1+${comparisons},"")` };
  }
  p1rCell.alignment = { horizontal: 'center' };
  p1rCell.fill = rankingBg;
  p1rCell.font = { bold: true };

    const p2cCell = row.getCell(COL_P2_COSTO);
    p2cCell.value = producto.prop2Costo ?? null;
    p2cCell.numFmt = currencyFormat;
    p2cCell.alignment = { horizontal: 'right' };
    p2cCell.fill = p2EditBg;
    p2cCell.border = editableBorder;

    const p2pCell = row.getCell(COL_P2_PRECIO);
    p2pCell.value = producto.prop2Precio ?? null;
    p2pCell.numFmt = currencyFormat;
    p2pCell.alignment = { horizontal: 'right' };
    p2pCell.fill = p2EditBg;
    p2pCell.border = editableBorder;

    const p2cmCell = row.getCell(COL_P2_CANTIDAD_MINIMA);
    p2cmCell.value = producto.prop2CantidadMinima ?? null;
    p2cmCell.numFmt = '#,##0';
    p2cmCell.alignment = { horizontal: 'right' };
    p2cmCell.fill = p2EditBg;
    p2cmCell.border = editableBorder;

    const p2mCell = row.getCell(COL_P2_MARGEN);
    p2mCell.value = { formula: `=IF(AND(${p2cLetter}${r}<>"",${p2pLetter}${r}<>""),(${p2pLetter}${r}-${p2cLetter}${r})/${p2pLetter}${r},"")` };
    p2mCell.numFmt = percentageFormat;
    p2mCell.alignment = { horizontal: 'right' };
    p2mCell.fill = prop2Bg;

    const p2gCell = row.getCell(COL_P2_GANANCIA);
    p2gCell.value = { formula: `=IF(AND(${p2cLetter}${r}<>"",${p2pLetter}${r}<>""),${p2pLetter}${r}-${p2cLetter}${r},"")` };
    p2gCell.numFmt = currencyFormat;
    p2gCell.alignment = { horizontal: 'right' };
    p2gCell.fill = prop2Bg;
    p2gCell.font = { bold: true };

    const p2dcCell = row.getCell(COL_P2_DIF_COSTO);
    p2dcCell.value = { formula: `=IF(AND(${p2cLetter}${r}<>"",${costoLetter}${r}<>""),${p2cLetter}${r}-${costoLetter}${r},"")` };
    p2dcCell.numFmt = currencyFormat;
    p2dcCell.alignment = { horizontal: 'right' };
    p2dcCell.fill = prop2Bg;

    const p2iCell = row.getCell(COL_P2_IMPACTO);
    p2iCell.value = { formula: `=IF(AND(${p2cLetter}${r}<>"",${costoLetter}${r}<>"",${costoLetter}${r}<>0),(${p2cLetter}${r}-${costoLetter}${r})/${costoLetter}${r},"")` };
    p2iCell.numFmt = percentageFormat;
    p2iCell.alignment = { horizontal: 'right' };
    p2iCell.fill = prop2Bg;

  const p2rCell = row.getCell(COL_P2_RANKING);
  if (compPriceColLetters.length > 0) {
    const comparisons = compPriceColLetters.map(l => `IF(AND(${l}${r}<>"",${l}${r}<${p2pLetter}${r}),1,0)`).join('+');
    p2rCell.value = { formula: `=IF(${p2pLetter}${r}<>"",1+${comparisons},"")` };
  }
  p2rCell.alignment = { horizontal: 'center' };
  p2rCell.fill = rankingBg;
  p2rCell.font = { bold: true };

    dataRow++;
  }

  // ==========================================================================
  // HOJA 2: TABLERO DE DECISIÓN ESTRATÉGICA (JEFATURA)
  // ==========================================================================
  const managementSheet = workbook.addWorksheet('Tablero de Decisión');
  
  managementSheet.getCell('A1').value = 'TABLERO DE DECISIÓN ESTRATÉGICA - JEFATURA';
  managementSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: '006540' } };

  // Tablero: Actual vs P2 (P1 es decisión del cliente, no afecta fábrica)
  // 6 bloques: Info, Inputs Jefatura, Actual, Propuesta P2, Evaluación, Resultado
  // Bloque 1: Información
  const MG_COL_SKU = 1;
  const MG_COL_PRODUCTO = 2;
  // Bloque 2: Inputs Jefatura
  const MG_COL_COSTO_FABRICA = 3;
  const MG_COL_PCT_UTILIDAD_MIN = 4;
  // Bloque 3: Escenario Actual
  const MG_COL_COSTO_MAYORISTA_ACT = 5;
  const MG_COL_PRECIO_TIENDA_ACT = 6;
  const MG_COL_MARGEN_MAYORISTA_ACT = 7;
  const MG_COL_MARGEN_CLIENTE_ACT = 8;
  // Bloque 4: Propuesta P2
  const MG_COL_P2_COSTO_MAYORISTA = 9;
  const MG_COL_P2_PRECIO_TIENDA = 10;
  const MG_COL_CANTIDAD_MINIMA = 11;
  const MG_COL_MARGEN_MAYORISTA_P2 = 12;
  const MG_COL_MARGEN_CLIENTE_P2 = 13;
  // Bloque 5: Evaluación
  const MG_COL_UTILIDAD_UNIDAD_ACTUAL = 14;
  const MG_COL_UTILIDAD_UNIDAD_P2 = 15;
  const MG_COL_UTILIDAD_ACTUAL = 16;
  const MG_COL_UTILIDAD_P2 = 17;
  const MG_COL_VAR_UTILIDAD = 18;
  const MG_COL_VAR_UTILIDAD_PCT = 19;
  const MG_COL_PRECIO_MIN_FINANCIERO = 20;
  const MG_COL_DESVIACION_PRECIO_MIN = 21;
  const MG_COL_PVP_MINIMO_MERCADO = 22;
  const MG_COL_INVERSION_COMERCIAL = 23;
  const MG_COL_VOL_EQUILIBRIO = 24;
  // Bloque 6: Resultado
  const MG_COL_STATUS = 25;
  const MG_LAST_COL = MG_COL_STATUS;

  const mgHeaders = [
    'SKU', 'PRODUCTO',
    'COSTO FÁBRICA (EDITABLE)',
    '% UTILIDAD MÍNIMA (EDITABLE)',
    'COSTO MAYORISTA ACT.', 'P. TIENDA ACT.', 'MARGEN MAYORISTA ACT.', 'MARGEN CLIENTE ACT.',
    'P2 COSTO MAYORISTA', 'P2 PRECIO TIENDA', 'CANTIDAD MÍNIMA', 'MARGEN MAYORISTA P2', 'MARGEN CLIENTE P2',
    'UTILIDAD UNIDAD ACT.', 'UTILIDAD UNIDAD P2',
    'UTILIDAD ACTUAL', 'UTILIDAD P2', 'VAR. UTILIDAD (S/)', 'VAR. UTILIDAD (%)',
    'PRECIO MÍN. FINANCIERO', 'DESVIACIÓN VS MÍN.',
    'PVP MÍNIMO MERCADO', 'INVERSIÓN COMERCIAL', 'VOL. EQUILIBRIO',
    'STATUS'
  ];

  const mgBlockColors = [
    // Info (0-1)
    '334155', '334155',
    // Inputs Jefatura (2-3)
    'EA580C', 'EA580C',
    // Actual (4-7)
    '059669', '059669', '059669', '059669',
    // P2 (8-12)
    '7B1FA2', '7B1FA2', '7B1FA2', '7B1FA2', '7B1FA2',
    // Evaluación (13-23)
    '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1', '0369A1',
    // STATUS (24)
    '991B1B',
  ];

  const mgHeaderRow = managementSheet.getRow(3);
  mgHeaders.forEach((h, i) => {
    const cell = mgHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mgBlockColors[i] || '334155' } };
  });

  data.productos.forEach((prod, index) => {
    const mgR = index + 4;
    const sourceR = index + tableStartRow + 1;
    const row = managementSheet.getRow(mgR);

    // Letras de columnas para fórmulas
    const colC = colToLetter(MG_COL_COSTO_FABRICA);            // 3
    const colD = colToLetter(MG_COL_PCT_UTILIDAD_MIN);          // 4
    const colE = colToLetter(MG_COL_COSTO_MAYORISTA_ACT);       // 5
    const colF = colToLetter(MG_COL_PRECIO_TIENDA_ACT);         // 6
    const colI = colToLetter(MG_COL_P2_COSTO_MAYORISTA);        // 9
    const colK = colToLetter(MG_COL_CANTIDAD_MINIMA);           // 11
    const colL = colToLetter(MG_COL_MARGEN_MAYORISTA_P2);       // 12
    const colP = colToLetter(MG_COL_UTILIDAD_ACTUAL);           // 16
    const colQ = colToLetter(MG_COL_UTILIDAD_P2);               // 17
    const colS = colToLetter(MG_COL_VAR_UTILIDAD_PCT);          // 19
    const colT = colToLetter(MG_COL_PRECIO_MIN_FINANCIERO);     // 20
    const colX = colToLetter(MG_COL_VOL_EQUILIBRIO);            // 24

    // ============================================================
    // Bloque 1: Información básica (desde Hoja 1)
    // ============================================================
    row.getCell(MG_COL_SKU).value = { formula: `='${sheet1Name}'!${colToLetter(COL_CODIGO)}${sourceR}` };
    row.getCell(MG_COL_PRODUCTO).value = { formula: `='${sheet1Name}'!${colToLetter(COL_NOMBRE)}${sourceR}` };

    // ============================================================
    // Bloque 2: Inputs de Jefatura (editables)
    // ============================================================
    const factoryCostCell = row.getCell(MG_COL_COSTO_FABRICA);
    factoryCostCell.value = null;
    factoryCostCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    factoryCostCell.border = { top: {style:'medium'}, bottom: {style:'medium'}, left: {style:'medium'}, right: {style:'medium'} };

    const minUtilCell = row.getCell(MG_COL_PCT_UTILIDAD_MIN);
    minUtilCell.value = 0.1;
    minUtilCell.numFmt = '0%';
    minUtilCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
    minUtilCell.border = { top: {style:'medium'}, bottom: {style:'medium'}, left: {style:'medium'}, right: {style:'medium'} };

    // ============================================================
    // Bloque 3: Escenario Actual
    // ============================================================
    row.getCell(MG_COL_COSTO_MAYORISTA_ACT).value = { formula: `='${sheet1Name}'!${colToLetter(COL_COSTO)}${sourceR}` };
    row.getCell(MG_COL_PRECIO_TIENDA_ACT).value = { formula: `='${sheet1Name}'!${colToLetter(COL_PRECIO_TIENDA)}${sourceR}` };
    row.getCell(MG_COL_MARGEN_MAYORISTA_ACT).value = { formula: `=IFERROR((${colE}${mgR}-${colC}${mgR})/${colE}${mgR},"")` };
    row.getCell(MG_COL_MARGEN_CLIENTE_ACT).value = { formula: `=IFERROR((${colF}${mgR}-${colE}${mgR})/${colF}${mgR},"")` };

    // ============================================================
    // Bloque 4: Propuesta P2
    // ============================================================
    row.getCell(MG_COL_P2_COSTO_MAYORISTA).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_COSTO)}${sourceR}` };
    row.getCell(MG_COL_P2_PRECIO_TIENDA).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_PRECIO)}${sourceR}` };
    row.getCell(MG_COL_CANTIDAD_MINIMA).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_CANTIDAD_MINIMA)}${sourceR}` };
    row.getCell(MG_COL_MARGEN_MAYORISTA_P2).value = { formula: `=IFERROR((${colI}${mgR}-${colC}${mgR})/${colI}${mgR},"")` };
    const colJ = colToLetter(MG_COL_P2_PRECIO_TIENDA); // 10
    row.getCell(MG_COL_MARGEN_CLIENTE_P2).value = { formula: `=IFERROR((${colJ}${mgR}-${colI}${mgR})/${colJ}${mgR},"")` };

    // ============================================================
    // Bloque 5: Evaluación
    // ============================================================
    // Utilidad Unidad Actual = CostoMayoristaAct - CostoFabrica
    row.getCell(MG_COL_UTILIDAD_UNIDAD_ACTUAL).value = { formula: `=IFERROR(${colE}${mgR}-${colC}${mgR},"")` };
    // Utilidad Unidad P2 = P2CostoMayorista - CostoFabrica
    row.getCell(MG_COL_UTILIDAD_UNIDAD_P2).value = { formula: `=IFERROR(${colI}${mgR}-${colC}${mgR},"")` };
    // Utilidad Actual (total) = CantMin × (CostoMayoristaAct - CostoFabrica)
    row.getCell(MG_COL_UTILIDAD_ACTUAL).value = { formula: `=IFERROR(${colK}${mgR}*(${colE}${mgR}-${colC}${mgR}),"")` };
    // Utilidad P2 (total) = CantMin × (P2CostoMayorista - CostoFabrica)
    row.getCell(MG_COL_UTILIDAD_P2).value = { formula: `=IFERROR(${colK}${mgR}*(${colI}${mgR}-${colC}${mgR}),"")` };
    // Var Utilidad (S/) = UtilidadP2 - UtilidadActual
    row.getCell(MG_COL_VAR_UTILIDAD).value = { formula: `=IFERROR(${colQ}${mgR}-${colP}${mgR},"")` };
    // Var Utilidad (%) = (UtilidadP2 - UtilidadActual) / UtilidadActual
    row.getCell(MG_COL_VAR_UTILIDAD_PCT).value = { formula: `=IFERROR((${colQ}${mgR}-${colP}${mgR})/${colP}${mgR},"")` };
    // Precio Mín Financiero = CostoFabrica × (1 + %UtilidadMin)
    row.getCell(MG_COL_PRECIO_MIN_FINANCIERO).value = { formula: `=IFERROR(${colC}${mgR}*(1+${colD}${mgR}),"")` };
    // Desviación vs Precio Mín = (P2CostoMayorista - PrecioMinFin) / PrecioMinFin
    row.getCell(MG_COL_DESVIACION_PRECIO_MIN).value = { formula: `=IFERROR((${colI}${mgR}-${colT}${mgR})/${colT}${mgR},"")` };
    // PVP Mínimo Mercado = MIN(precios competencia de Hoja 1)
    if (competidorPriceCols.length > 0) {
      const compRefs = competidorPriceCols.map(c => `'${sheet1Name}'!${colToLetter(c)}${sourceR}`);
      row.getCell(MG_COL_PVP_MINIMO_MERCADO).value = { formula: `=IFERROR(MIN(${compRefs.join(',')}),"")` };
    }
    // Inversión Comercial = CantMin × (CostoMayoristaAct - P2CostoMayorista)
    row.getCell(MG_COL_INVERSION_COMERCIAL).value = { formula: `=IFERROR(${colK}${mgR}*(${colE}${mgR}-${colI}${mgR}),"")` };
    // Vol Equilibrio = ROUND(CantMin × (MayoristaAct - Fabrica) / (P2Mayorista - Fabrica), 0)
    row.getCell(MG_COL_VOL_EQUILIBRIO).value = { formula: `=IFERROR(ROUND(${colK}${mgR}*(${colE}${mgR}-${colC}${mgR})/(${colI}${mgR}-${colC}${mgR}),0),"—")` };

    // ============================================================
    // Bloque 6: Status — lógica multicondición
    // ============================================================
    // 🛑 = P2 bajo costo fábrica
    // 🔴 = margen P2 bajo mínimo
    // 🟡 = utilidad cae >60% o vol equilibrio > compromiso
    // 🟢 = todo ok
    const statusCell = row.getCell(MG_COL_STATUS);
    statusCell.value = {
      formula: `=IF(${colC}${mgR}="","",IF(${colI}${mgR}<${colC}${mgR},"🛑 RECHAZADO: P2 BAJO COSTO FÁBRICA",IF(${colL}${mgR}<${colD}${mgR},"🔴 RECHAZAR: BAJO MARGEN MÍNIMO",IF(${colS}${mgR}<-0.6,"🟡 REVISAR: UTILIDAD CAE >60%",IF(${colX}${mgR}>${colK}${mgR},"🟡 REVISAR: VOL.EQUILIBRIO > COMPROMISO","🟢 APROBAR")))))`
    };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    statusCell.font = { bold: true };

    // Formato condicional: 4 reglas para los 4 status
    const statusRef = `${colToLetter(MG_COL_STATUS)}${mgR}`;
    managementSheet.addConditionalFormatting({
      ref: statusRef,
      rules: [
        { type: 'containsText', operator: 'containsText', text: '🛑', priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }, font: { color: { argb: 'FF991B1B' }, bold: true } } },
        { type: 'containsText', operator: 'containsText', text: '🔴', priority: 2, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }, font: { color: { argb: 'FF991B1B' }, bold: true } } },
        { type: 'containsText', operator: 'containsText', text: '🟡', priority: 3, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }, font: { color: { argb: 'FFB45309' }, bold: true } } },
        { type: 'containsText', operator: 'containsText', text: '🟢', priority: 4, style: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }, font: { color: { argb: 'FF166534' }, bold: true } } },
      ]
    });

    // Formatos numéricos
    row.getCell(MG_COL_COSTO_FABRICA).numFmt = currencyFormat;
    row.getCell(MG_COL_PCT_UTILIDAD_MIN).numFmt = '0%';
    row.getCell(MG_COL_COSTO_MAYORISTA_ACT).numFmt = currencyFormat;
    row.getCell(MG_COL_PRECIO_TIENDA_ACT).numFmt = currencyFormat;
    row.getCell(MG_COL_MARGEN_MAYORISTA_ACT).numFmt = percentageFormat;
    row.getCell(MG_COL_MARGEN_CLIENTE_ACT).numFmt = percentageFormat;
    row.getCell(MG_COL_P2_COSTO_MAYORISTA).numFmt = currencyFormat;
    row.getCell(MG_COL_P2_PRECIO_TIENDA).numFmt = currencyFormat;
    row.getCell(MG_COL_CANTIDAD_MINIMA).numFmt = '#,##0';
    row.getCell(MG_COL_MARGEN_MAYORISTA_P2).numFmt = percentageFormat;
    row.getCell(MG_COL_MARGEN_CLIENTE_P2).numFmt = percentageFormat;
    row.getCell(MG_COL_UTILIDAD_UNIDAD_ACTUAL).numFmt = currencyFormat;
    row.getCell(MG_COL_UTILIDAD_UNIDAD_P2).numFmt = currencyFormat;
    row.getCell(MG_COL_UTILIDAD_ACTUAL).numFmt = currencyFormat;
    row.getCell(MG_COL_UTILIDAD_P2).numFmt = currencyFormat;
    row.getCell(MG_COL_VAR_UTILIDAD).numFmt = currencyFormat;
    row.getCell(MG_COL_VAR_UTILIDAD_PCT).numFmt = percentageFormat;
    row.getCell(MG_COL_PRECIO_MIN_FINANCIERO).numFmt = currencyFormat;
    row.getCell(MG_COL_DESVIACION_PRECIO_MIN).numFmt = percentageFormat;
    row.getCell(MG_COL_PVP_MINIMO_MERCADO).numFmt = currencyFormat;
    row.getCell(MG_COL_INVERSION_COMERCIAL).numFmt = currencyFormat;
    row.getCell(MG_COL_VOL_EQUILIBRIO).numFmt = '#,##0';
  });

  // Ajustar anchos de columnas en Hoja 2
  managementSheet.getColumn(MG_COL_SKU).width = 12;
  managementSheet.getColumn(MG_COL_PRODUCTO).width = 35;
  managementSheet.getColumn(MG_COL_COSTO_FABRICA).width = 22;
  managementSheet.getColumn(MG_COL_PCT_UTILIDAD_MIN).width = 18;
  for (let i = MG_COL_COSTO_MAYORISTA_ACT; i <= MG_COL_MARGEN_CLIENTE_P2; i++) managementSheet.getColumn(i).width = 16;
  for (let i = MG_COL_UTILIDAD_UNIDAD_ACTUAL; i <= MG_COL_INVERSION_COMERCIAL; i++) managementSheet.getColumn(i).width = 18;
  managementSheet.getColumn(MG_COL_VOL_EQUILIBRIO).width = 16;
  managementSheet.getColumn(MG_COL_STATUS).width = 40;

  // Nota explicativa para Jefatura
  const noteStart = data.productos.length + 6;
  const noteCol = colToLetter(MG_LAST_COL);
  managementSheet.getCell(`A${noteStart}`).value = 'INSTRUCCIONES PARA JEFATURA:';
  managementSheet.getCell(`A${noteStart}`).font = { bold: true };
  managementSheet.mergeCells(`A${noteStart + 1}:${noteCol}${noteStart + 14}`);
  managementSheet.getCell(`A${noteStart + 1}`).value = 
    '1. Ingrese el Costo de Fábrica real en la columna C (celdas amarillas).\n' +
    '2. Defina el % de Utilidad Mínima objetivo en la columna D (ej: 10%).\n' +
    '3. MARGEN MAYORISTA = (Mayorista - Fábrica) / Mayorista.\n' +
    '4. MARGEN CLIENTE = (PVP - Mayorista) / PVP — mide el incentivo del distribuidor.\n' +
    '5. UTILIDAD UNIDAD = ganancia por unidad al mayorista.\n' +
    '6. UTILIDAD TOTAL = Cant.Mín × Utilidad Unidad.\n' +
    '7. VAR. UTILIDAD (%) = (Utilidad P2 - Utilidad Actual) / Utilidad Actual.\n' +
    '8. PRECIO MÍN. FINANCIERO = Fábrica × (1 + %Utilidad Mín) — piso absoluto.\n' +
    '9. DESVIACIÓN VS MÍN. = (P2 Mayorista - Mín Fin) / Mín Fin — negativo = bajo el umbral.\n' +
    '10. PVP MÍNIMO MERCADO = menor precio de competencia.\n' +
    '11. INVERSIÓN COMERCIAL = Cant.Mín × (Mayorista Act - P2 Mayorista) — utilidad cedida.\n' +
    '12. VOL. EQUILIBRIO = unidades necesarias a P2 para igualar la utilidad actual.\n' +
    '13. STATUS evalúa 4 condiciones en orden: 🛑 costo, 🔴 margen, 🟡 caída utilidad / volumen, 🟢 viable.';
  managementSheet.getCell(`A${noteStart + 1}`).alignment = { wrapText: true, vertical: 'top' };


  // Volver a la Hoja 1 para aplicar autoFiltros finales
  worksheet.autoFilter = {
    from: `A${tableStartRow}`,
    to: `${colToLetter(headers.length)}${dataRow - 1}`,
  };

  worksheet.getColumn(COL_CODIGO).width = 12;
  worksheet.getColumn(COL_EAN).width = 16;
  worksheet.getColumn(COL_LINEA).width = 14;
  worksheet.getColumn(COL_NOMBRE).width = 35;
  worksheet.getColumn(COL_COSTO).width = 14;
  worksheet.getColumn(COL_PRECIO_TIENDA).width = 16;
  worksheet.getColumn(COL_GANANCIA).width = 14;
  worksheet.getColumn(COL_MARGEN).width = 12;
  competidorPriceCols.forEach((_, i) => {
    const base = competenciaColStart + i * 3;
    worksheet.getColumn(base).width = 14;
    worksheet.getColumn(base + 1).width = 12;
    worksheet.getColumn(base + 2).width = 12;
  });
  worksheet.getColumn(COL_RANKING).width = 10;
  worksheet.getColumn(COL_P1_PRECIO).width = 14;
  worksheet.getColumn(COL_P1_MARGEN).width = 12;
  worksheet.getColumn(COL_P1_GANANCIA).width = 14;
  worksheet.getColumn(COL_P1_RANKING).width = 10;
  worksheet.getColumn(COL_P2_COSTO).width = 14;
  worksheet.getColumn(COL_P2_PRECIO).width = 14;
  worksheet.getColumn(COL_P2_MARGEN).width = 12;
  worksheet.getColumn(COL_P2_GANANCIA).width = 14;
  worksheet.getColumn(COL_P2_CANTIDAD_MINIMA).width = 16;
  worksheet.getColumn(COL_P2_DIF_COSTO).width = 14;
  worksheet.getColumn(COL_P2_IMPACTO).width = 12;
  worksheet.getColumn(COL_P2_RANKING).width = 10;

  const noteRow = dataRow + 2;
  worksheet.getCell(noteRow, 1).value = 'CAMPOS EDITABLES (amarillo):';
  worksheet.getCell(noteRow, 1).font = { bold: true, size: 11 };
  const notes = [
    '• Costo = Precio de venta al mayorista',
    '• P. Tienda = "Mi Marca" en tienda',
    '• Precios de Competencia = Editables para what-if',
    '• P1 Precio = Propuesta 1 — mismo costo, nuevo precio',
    '• P2 Costo = Propuesta 2 — nuevo costo (concesión mayorista)',
    '• P2 Precio = Propuesta 2 — nuevo precio en tienda',
    '• P2 Cantidad Mínima = Compromiso de compra del mayorista',
    '',
    'FÓRMULAS (se recalculan automáticamente al editar):',
    '• Ganancia = P. Tienda - Costo',
    '• Margen (%) = (P. Tienda - Costo) / P. Tienda',
    '• Ranking = 1 + SUM(IF(precio competencia < mi precio)) — por fila',
    '• Dif S/ = P. Tienda - Precio Competencia',
    '• Dif % = (P. Tienda / Precio Competencia) - 1',
    '• P1 Margen = (P1 Precio - Costo) / P1 Precio',
    '• P2 Margen = (P2 Precio - P2 Costo) / P2 Precio',
    '• P2 Dif Costo = P2 Costo - Costo actual',
    '• P2 Impacto % = (P2 Costo - Costo actual) / Costo actual',
    '',
    'RANKING: 1 = más barato. Se recalcula si editas precios de competencia.',
  ];
  notes.forEach((text, idx) => {
    worksheet.getCell(noteRow + 1 + idx, 1).value = text;
    worksheet.getCell(noteRow + 1 + idx, 1).font = { size: 10, color: { argb: '666666' } };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  debugLog('Excel unificado generado correctamente');

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export default generateExcelWithExcelJS;
