import React, { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import ToastContainer from '../components/ui/ToastContainer';
import type { ToastProps, ToastTypeString } from '../toastDefinitions';

interface ToastContextType {
  addToast: (message: string, type?: ToastTypeString) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Provider único del sistema de toasts: estado, contexto y contenedor.
 * Reemplaza al anterior par useToasts (hooks) + ToastContext (contexts).
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastTypeString = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, onClose: () => removeToast(id) }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};
