import React from 'react';
import type { ComparisonTableRow } from '../../interfaces';
import { Modal } from '../ui';
import PriceBarChart from './PricePieChart';

interface ProductPieChartModalProps {
  product: ComparisonTableRow | null;
  competidores: string[];
  onClose: () => void;
}

export const ProductPieChartModal: React.FC<ProductPieChartModalProps> = ({ product, competidores, onClose }) => {
  if (!product) return null;

  return (
    <Modal
      isOpen={!!product}
      onClose={onClose}
      title={`${product.nombre || ''}`}
      size="md"
    >
      <PriceBarChart
        data={competidores.map(comp => ({
          name: comp,
          value: product.precios?.[comp] ?? 0
        }))}
        aria-label={`Gráfico de barras de precios para ${product.nombre}`}
      />
    </Modal>
  );
};
