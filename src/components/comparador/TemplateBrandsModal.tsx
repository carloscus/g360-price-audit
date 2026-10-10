import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { StyledInput } from '../ui/StyledInput';
import { useToast } from '../../contexts/ToastContext';

interface TemplateBrandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (marcas: string[]) => void;
  marcasIniciales: string[];
}

const MARCA_LABELS = [
  'Marca 1 (Mi Marca)',
  'Marca 2 (Competencia)',
  'Marca 3 (Competencia)',
  'Marca 4 (Competencia)',
  'Marca 5 (Competencia)',
];

/**
 * Modal que solicita los nombres de las 5 marcas (marca 1 = principal,
 * marcas 2-5 = competencia) antes de generar la plantilla de carga masiva.
 * La marca 1 es obligatoria y se requieren al menos 2 marcas completadas.
 */
export const TemplateBrandsModal: React.FC<TemplateBrandsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  marcasIniciales,
}) => {
  const { addToast } = useToast();
  // El componente se monta fresco en cada apertura (el padre usa key por apertura),
  // por lo que el estado inicial toma los valores de marcasIniciales del momento.
  const [marcas, setMarcas] = useState<string[]>(() =>
    MARCA_LABELS.map((_, i) => marcasIniciales[i] ?? '')
  );

  const handleChange = (index: number, value: string) => {
    setMarcas(prev => prev.map((m, i) => (i === index ? value : m)));
  };

  const handleConfirm = () => {
    const marcasLimpias = marcas.map(m => m.trim());

    if (!marcasLimpias[0]) {
      addToast('La Marca 1 (Mi Marca) es requerida.', 'error');
      return;
    }

    const marcasValidas = marcasLimpias.filter(m => m !== '');
    if (marcasValidas.length < 2) {
      addToast('Complete al menos 2 marcas para generar la plantilla.', 'error');
      return;
    }

    onConfirm(marcasLimpias);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Marcas para la plantilla"
      size="sm"
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Generar plantilla
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Ingrese los nombres de las marcas que incluirá la plantilla de carga
        masiva. La Marca 1 es la marca principal (Mi Marca).
      </p>
      <div className="flex flex-col gap-3">
        {MARCA_LABELS.map((label, i) => (
          <div key={label}>
            <label
              htmlFor={`marca-plantilla-${i + 1}`}
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              {label}
              {i === 0 && <span className="text-[var(--color-on-surface-error)]"> *</span>}
            </label>
            <StyledInput
              id={`marca-plantilla-${i + 1}`}
              name={`marca${i + 1}`}
              variant="comparador"
              value={marcas[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={i === 0 ? 'Ej: VINIFAN' : 'Opcional'}
              maxLength={40}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
};
