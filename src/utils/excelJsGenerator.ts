import * as ExcelJS from 'exceljs';
import { debugLog } from './config';

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

export interface ExcelData {
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

  const sheet1Name = 'AUDITORIA_DE_CAMPO';
  const worksheet = workbook.addWorksheet(sheet1Name);

  const currencyFormat = '#,##0.00';
  const percentageFormat = '0.0%';

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
  worksheet.getCell('B3').value = data.fecha || new Date().toLocaleDateString('es-PE');
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
      pctCell.value = { formula: `=IFERROR(${ptLetter}${r}/${priceColLetter}${r}-1,"")` };
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

  const mgHeaders = [
    'SKU', 'PRODUCTO', 
    'COSTO FÁBRICA (EDITABLE)', // Vacío para llenado del Jefe - Seguridad de información
    '% UTILIDAD MÍNIMA (EDITABLE)', // Nuevo: umbral de rentabilidad para Jefatura
    'COSTO MAYORISTA ACT.', 'P. TIENDA ACT.', 'MARGEN EMPRESA ACT.', 
    'P1 PRECIO TIENDA', 'MARGEN EMPRESA P1',
    'P2 COSTO MAYORISTA', 'P2 PRECIO TIENDA', 'CANTIDAD MÍNIMA', 'MARGEN EMPRESA P2',
    'UTILIDAD TOTAL ACT.', 'UTILIDAD TOTAL P2', 'STATUS'
  ];

  const mgHeaderRow = managementSheet.getRow(3);
  mgHeaders.forEach((h, i) => {
    const cell = mgHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    // Colores por secciones
    if (i < 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } }; // Info
    else if (i < 4) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EA580C' } }; // Inputs de Jefatura
    else if (i < 7) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } }; // Actual
    else if (i < 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A73E8' } }; // P1
    else if (i < 13) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '7B1FA2' } }; // P2
    else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '991B1B' } }; // Utilidades y STATUS
  });

  data.productos.forEach((prod, index) => {
    const mgR = index + 4; // Fila en Hoja 2
    const sourceR = index + tableStartRow + 1; // Fila en Hoja 1
    const row = managementSheet.getRow(mgR);

    // Referencias de columnas por letra para fórmulas
    const colC = colToLetter(3); // Costo Fábrica
    const colD = colToLetter(4); // % Utilidad Mínima
    const colE = colToLetter(5); // Costo Mayorista Act.
    const colJ = colToLetter(10); // P2 Costo Mayorista
    const colL = colToLetter(12); // Cantidad Mínima
    const colM = colToLetter(13); // Margen Empresa P2

    // 1. SKU y Nombre (Links a Hoja 1)
    row.getCell(1).value = { formula: `='${sheet1Name}'!${colToLetter(COL_CODIGO)}${sourceR}` };
    row.getCell(2).value = { formula: `='${sheet1Name}'!${colToLetter(COL_NOMBRE)}${sourceR}` };

    // 2. Costo Fábrica: VACÍO - Seguridad de información de fábrica
    const factoryCostCell = row.getCell(3);
    factoryCostCell.value = null; // Vacío para llenado manual por Jefatura
    factoryCostCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Amarillo brillante
    factoryCostCell.border = { top: {style:'medium'}, bottom: {style:'medium'}, left: {style:'medium'}, right: {style:'medium'} };

    // 3. % Utilidad Mínima: editable para Jefatura
    const minUtilCell = row.getCell(4);
    minUtilCell.value = 0.1; // 10% por defecto
    minUtilCell.numFmt = '0%';
    minUtilCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Amarillo brillante
    minUtilCell.border = { top: {style:'medium'}, bottom: {style:'medium'}, left: {style:'medium'}, right: {style:'medium'} };

    // 4. Enlaces Espejo directos a la Hoja 1
    row.getCell(5).value = { formula: `='${sheet1Name}'!${colToLetter(COL_COSTO)}${sourceR}` }; // Costo Mayorista Act.
    row.getCell(6).value = { formula: `='${sheet1Name}'!${colToLetter(COL_PRECIO_TIENDA)}${sourceR}` }; // P. Tienda Act.
    row.getCell(7).value = { formula: `=IFERROR((${colE}${mgR}-${colC}${mgR})/${colE}${mgR},"")` }; // Margen Empresa Act.

    // 5. Propuesta 1 (Mismo costo mayorista, nuevo precio tienda)
    row.getCell(8).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P1_PRECIO)}${sourceR}` }; // P1 Precio Tienda
    row.getCell(9).value = { formula: `=IFERROR((${colE}${mgR}-${colC}${mgR})/${colE}${mgR},"")` }; // Margen Empresa P1

    // 6. Propuesta 2 (Nuevo costo mayorista, nuevo precio tienda)
    row.getCell(10).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_COSTO)}${sourceR}` }; // P2 Costo Mayorista
    row.getCell(11).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_PRECIO)}${sourceR}` }; // P2 Precio Tienda
    row.getCell(12).value = { formula: `='${sheet1Name}'!${colToLetter(COL_P2_CANTIDAD_MINIMA)}${sourceR}` }; // Cantidad Mínima
    row.getCell(13).value = { formula: `=IFERROR((${colJ}${mgR}-${colC}${mgR})/${colJ}${mgR},"")` }; // Margen Empresa P2

    // 7. Utilidades Totales
    row.getCell(14).value = { formula: `=IFERROR(${colL}${mgR}*(${colE}${mgR}-${colC}${mgR}),"")` }; // Utilidad Total Actual
    row.getCell(15).value = { formula: `=IFERROR(${colL}${mgR}*(${colJ}${mgR}-${colC}${mgR}),"")` }; // Utilidad Total P2

    // 8. Árbitro Financiero - STATUS con IF en MAYÚSCULAS + % Utilidad Mínima
    const statusCell = row.getCell(16);
    statusCell.value = { 
      formula: `=IF(${colC}${mgR}="","",IF(${colJ}${mgR}<${colC}${mgR},"🛑 RECHAZADO: BAJO COSTO FÁBRICA",IF(${colM}${mgR}<${colD}${mgR},"⚠️ BAJO UMBRAL DE UTILIDAD MÍNIMA","🟢 PROPUESTA VIABLE")))`
    };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    statusCell.font = { bold: true };

    // 9. Formato Condicional para alertas visuales en STATUS
    managementSheet.addConditionalFormatting({
      ref: `P${mgR}`,
      rules: [
        {
          type: 'containsText',
          operator: 'containsText',
          text: '🛑',
          priority: 1,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } },
            font: { color: { argb: 'FF991B1B' }, bold: true }
          }
        },
        {
          type: 'containsText',
          operator: 'containsText',
          text: '⚠️',
          priority: 2,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } },
            font: { color: { argb: 'FFB45309' }, bold: true }
          }
        },
        {
          type: 'containsText',
          operator: 'containsText',
          text: '🟢',
          priority: 3,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } },
            font: { color: { argb: 'FF166534' }, bold: true }
          }
        }
      ]
    });

    // Formatos numéricos
    row.getCell(3).numFmt = currencyFormat;   // Costo Fábrica
    row.getCell(4).numFmt = '0%';             // % Utilidad Mínima
    row.getCell(5).numFmt = currencyFormat;   // Costo Mayorista Act.
    row.getCell(6).numFmt = currencyFormat;   // P. Tienda Act.
    row.getCell(7).numFmt = percentageFormat; // Margen Empresa Act.
    row.getCell(8).numFmt = currencyFormat;   // P1 Precio Tienda
    row.getCell(9).numFmt = percentageFormat; // Margen Empresa P1
    row.getCell(10).numFmt = currencyFormat;  // P2 Costo Mayorista
    row.getCell(11).numFmt = currencyFormat;  // P2 Precio Tienda
    row.getCell(12).numFmt = '#,##0';         // Cantidad Mínima
    row.getCell(13).numFmt = percentageFormat;// Margen Empresa P2
    row.getCell(14).numFmt = currencyFormat;  // Utilidad Total Act.
    row.getCell(15).numFmt = currencyFormat;  // Utilidad Total P2
  });

  // Ajustar anchos de columnas en Hoja 2
  managementSheet.getColumn(1).width = 12;  // SKU
  managementSheet.getColumn(2).width = 35;  // Producto
  managementSheet.getColumn(3).width = 22;  // Costo Fábrica
  managementSheet.getColumn(4).width = 18;  // % Utilidad Mínima
  for(let i=5; i<=12; i++) managementSheet.getColumn(i).width = 16;
  managementSheet.getColumn(13).width = 16; // Margen P2
  managementSheet.getColumn(14).width = 18; // Utilidad Total Act.
  managementSheet.getColumn(15).width = 18; // Utilidad Total P2
  managementSheet.getColumn(16).width = 36; // STATUS

  // Nota explicativa para Jefatura
  const noteStart = data.productos.length + 6;
  managementSheet.getCell(`A${noteStart}`).value = 'INSTRUCCIONES PARA JEFATURA:';
  managementSheet.getCell(`A${noteStart}`).font = { bold: true };
  managementSheet.mergeCells(`A${noteStart + 1}:F${noteStart + 5}`);
  managementSheet.getCell(`A${noteStart + 1}`).value = 
    '1. Ingrese el Costo de Fábrica real en la columna C (Celdas Amarillas).\n' +
    '2. Defina el % de Utilidad Mínima objetivo en la columna D.\n' +
    '3. El Margen Empresa indica la rentabilidad de la fábrica al vender al mayorista.\n' +
    '4. La Utilidad Total proyecta la ganancia basada en la Cantidad Mínima comprometida.\n' +
    '5. El STATUS evalúa: rechazo por bajo costo, alerta por umbral mínimo, o viable.';
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
