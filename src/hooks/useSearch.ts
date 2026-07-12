import { useMemo, useState, useEffect } from 'react';
import type { IProducto } from '../interfaces';

export const useSearch = (items: IProducto[] = [], searchTerm: string, delay = 250): IProducto[] => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  const filteredItems = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return [];
    }

    const lowercasedSearchTerm = debouncedTerm.toLowerCase();

    return items.filter(item => {
      if (item.codigo.toLowerCase() === lowercasedSearchTerm) {
        return true;
      }

      if (item.ean_14 && item.ean_14.toLowerCase().includes(lowercasedSearchTerm)) {
        return true;
      }

      if (item.keywords && item.keywords.some(keyword => keyword.toLowerCase().startsWith(lowercasedSearchTerm))) {
        return true;
      }

      if (item.nombre.toLowerCase().includes(lowercasedSearchTerm)) {
        return true;
      }
      
      return false;
    });
  }, [items, debouncedTerm]);

  return filteredItems;
};
