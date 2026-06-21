import React from 'react';
import type { ComparisonTableRow } from '../../interfaces';
import { getBrandColor } from '../../utils/colorScheme';
import { useCompetitiveAnalysis } from '../../hooks/useCompetitiveAnalysis';

interface PrintReportProps {
  products: ComparisonTableRow[];
  competidores: string[];
  datosGenerales: {
    fecha: string;
    usuario: string;
    tienda: string;
    supervisor: string;
    supervisor2: string;
    supervisor3: string;
  };
}

export const PrintReport: React.FC<PrintReportProps> = ({
  products,
  competidores,
  datosGenerales
}) => {
  // Calcular estadísticas generales
  const totalProductos = products.length;

  return (
    <div className="print-report-container">
      {/* Primera hoja: Portada y Datos Generales */}
      <div className="print-page cover-page">
        <div className="cover-content">
          <div className="cover-header">
            <h1 className="report-title">REPORTE DE COMPARADOR DE PRECIOS</h1>
            <div className="report-subtitle">Análisis Competitivo de Precios</div>
          </div>
          
          <div className="cover-stats">
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Fecha:</span>
                <span className="stat-value">{datosGenerales.fecha}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tienda:</span>
                <span className="stat-value">{datosGenerales.tienda}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Productos:</span>
                <span className="stat-value">{totalProductos}</span>
              </div>
            </div>
          </div>

          <div className="cover-team">
            <div className="team-section">
              <h3>Equipo de Trabajo</h3>
              <div className="team-grid">
                <div className="team-member">
                  <span className="member-label">Analista:</span>
                  <span className="member-name">{datosGenerales.usuario}</span>
                </div>
                <div className="team-member">
                  <span className="member-label">Supervisor 1:</span>
                  <span className="member-name">{datosGenerales.supervisor}</span>
                </div>
                <div className="team-member">
                  <span className="member-label">Supervisor 2:</span>
                  <span className="member-name">{datosGenerales.supervisor2}</span>
                </div>
                <div className="team-member">
                  <span className="member-label">Supervisor 3:</span>
                  <span className="member-name">{datosGenerales.supervisor3}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cover-footer">
            <div className="footer-note">
              Este reporte contiene análisis detallado de precios comparativos
              para optimización de estrategias comerciales
            </div>
          </div>
        </div>
      </div>

      {/* Segunda hoja: Resumen Ejecutivo */}
      <div className="print-page summary-page">
        <div className="page-header">
          <h2>RESUMEN EJECUTIVO</h2>
          <div className="page-meta">Página 2 de {Math.ceil(totalProductos / 4) + 2}</div>
        </div>

        <div className="summary-content">
          <div className="summary-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{totalProductos}</div>
                <div className="stat-label">Total Productos</div>
                <div className="stat-percentage">100%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-footer">
          <div className="insights">
            <h4>Resumen del Análisis</h4>
            <ul>
              <li>Total de productos analizados: {totalProductos}</li>
              <li>Competidores evaluados: {competidores.length}</li>
              <li>Reporte generado para: {datosGenerales.tienda}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tercera hoja en adelante: Tarjetas de Productos */}
      <ProductCardsPrint products={products} competidores={competidores} />
    </div>
  );
};

// Componente para las tarjetas de productos
interface ProductCardsPrintProps {
  products: ComparisonTableRow[];
  competidores: string[];
}

const ProductCardsPrint: React.FC<ProductCardsPrintProps> = ({ products, competidores }) => {
  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <>
      {Array.from({ length: totalPages }, (_, pageIndex) => (
        <div key={pageIndex} className="print-page cards-page">
          <div className="page-header">
            <h2>TARJETAS DE ANÁLISIS DE PRODUCTOS</h2>
            <div className="page-meta">
              Página {pageIndex + 3} de {totalPages + 2} | Productos {pageIndex * itemsPerPage + 1} - {Math.min((pageIndex + 1) * itemsPerPage, products.length)}
            </div>
          </div>

          <div className="cards-grid">
            {products
              .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
              .map((product, index) => (
                <ProductCardPrint
                  key={product.codigo}
                  item={product}
                  competidores={competidores}
                  positionInPage={index + 1}
                />
              ))}
          </div>

          <div className="page-footer">
            <div className="footer-meta">
              Página {pageIndex + 3} de {totalPages + 2}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// Componente individual de tarjeta para impresión
interface ProductCardPrintProps {
  item: ComparisonTableRow;
  competidores: string[];
  positionInPage: number;
}

const ProductCardPrint: React.FC<ProductCardPrintProps> = ({ item, competidores }) => {
  // Usar el hook centralizado para análisis competitivo
  const {
    myBrand,
    allPrices,
    analysis,
    formatPrice,
    formatPercentage
  } = useCompetitiveAnalysis(item, competidores);

  // Calcular porcentajes de diferencia usando los datos del hook
  const percentageDifferences = allPrices
    .filter(p => p.label !== myBrand && p.value !== null && p.value > 0)
    .map(p => {
      const myPrice = allPrices.find(price => price.label === myBrand)?.value || 0;
      const diff = ((p.value! - myPrice) / myPrice) * 100;
      return {
        name: p.label,
        percentage: diff,
        isBetter: diff < 0
      };
    });

  // Obtener diferencias más relevantes
  const bestDiff = percentageDifferences.length > 0
    ? percentageDifferences.reduce((best, current) =>
        current.isBetter && (!best || current.percentage < best.percentage) ? current : best
      )
    : null;

  const worstDiff = percentageDifferences.length > 0
    ? percentageDifferences.reduce((worst, current) =>
        !current.isBetter && (!worst || current.percentage > worst.percentage) ? current : worst
      )
    : null;

  // Filtrar precios válidos para cálculos
  const validPrices = allPrices.filter(p => p.value !== null);

  // Calcular precio promedio, min, max
  const avgPrice = validPrices.length > 0
    ? validPrices.reduce((sum, p) => sum + (p.value || 0), 0) / validPrices.length
    : 0;
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices.map(p => p.value || 0)) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices.map(p => p.value || 0)) : 0;

  // Máximo precio para escalar barras
  const maxPriceValue = validPrices.length > 0 ? Math.max(...validPrices.map(p => p.value || 0)) : 1;

  return (
    <div className="product-card-print">
      {/* Encabezado centrado arriba del gráfico */}
      <div className="card-header-print">
        <h3 className="card-title-print">{item.nombre}</h3>
        <div className="card-price-print">{formatPrice(allPrices.find(p => p.label === myBrand)?.value || 0)}</div>
      </div>

      {/* Contenido horizontal: gráfico a la izquierda, textos a la derecha */}
      <div className="card-content-horizontal">
        {/* Gráfico de barras a la izquierda */}
        <div className="card-chart-print">
          <h4 className="chart-title-print">Comparativa de Precios</h4>
          <div className="chart-bars-print">
            {allPrices.map((price, index) => {
              const priceValue = price.value;
              const widthPercentage = priceValue ? (priceValue / maxPriceValue) * 100 : 0;
              const color = getBrandColor(price.label);

              return (
                <div key={index} className="chart-bar-item-print">
                  <div className="bar-label-print">
                    {price.label}
                  </div>
                  <div className="bar-container-print">
                    <div
                      className="bar-print"
                      style={{
                        width: `${widthPercentage}%`,
                        backgroundColor: color
                      }}
                    />
                    <div className="bar-value-print">
                      {priceValue ? formatPrice(priceValue) : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloques de texto a la derecha */}
        <div className="card-text-blocks-print">
          <div className="text-block-print">
            <span className="text-label-print">Código:</span>
            <span className="text-value-print">{item.codigo}</span>
          </div>
          <div className="text-block-print">
            <span className="text-label-print">Posición:</span>
            <span className="text-value-print position-badge-print">{analysis.myPosition > 0 ? `${analysis.myPosition}°` : '—'}</span>
          </div>
          <div className="text-block-print">
            <span className="text-label-print">Total marcas:</span>
            <span className="text-value-print">{allPrices.length}</span>
          </div>
          {bestDiff && (
            <div className="text-block-print">
              <span className="text-label-print">Mejor vs MI:</span>
              <span className="text-value-print positive-print">▼ {formatPercentage(bestDiff.percentage)}</span>
            </div>
          )}
          {worstDiff && (
            <div className="text-block-print">
              <span className="text-label-print">Peor vs MI:</span>
              <span className="text-value-print negative-print">▲ {formatPercentage(worstDiff.percentage)}</span>
            </div>
          )}
          <div className="text-block-print">
            <span className="text-label-print">Precio promedio:</span>
            <span className="text-value-print">{formatPrice(avgPrice)}</span>
          </div>
          <div className="text-block-print">
            <span className="text-label-print">Min:</span>
            <span className="text-value-print">{formatPrice(minPrice)}</span>
          </div>
          <div className="text-block-print">
            <span className="text-label-print">Máx:</span>
            <span className="text-value-print">{formatPrice(maxPrice)}</span>
          </div>
          <div className="text-block-print">
            <span className="text-label-print">Producto:</span>
            <span className="text-value-print">{item.nombre}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
