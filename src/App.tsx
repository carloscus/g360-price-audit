import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ComparadorPage } from './pages/ComparadorPage';
import { useToasts } from './hooks/useToasts';
import ToastContainer from './components/ui/ToastContainer';
import { ToastContext } from './contexts/ToastContext';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/auth';
import { useAppStore } from './store/useAppStore';
import { ErrorBoundary } from './components/ErrorBoundary';

// --- Componente de Ruta Protegida ---
// Verifica si el usuario está autenticado antes de renderizar el contenido.
// Si no lo está, redirige a la página de inicio de sesión.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// --- Wrapper de Tema ---
// Gestiona la aplicación del tema (claro/oscuro) tanto para Material UI como para CSS variables.
// Sincroniza el estado del tema de Zustand con la clase 'dark' en el elemento raíz HTML.
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentTheme = useAppStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  return <>{children}</>;
};

// --- Componente Principal de la Aplicación ---
function App() {
  const { toasts, addToast, removeToast } = useToasts();

  return (
    <ErrorBoundary>
    <ToastContext.Provider value={{ addToast }}>
      <AuthProvider>
        <ThemeWrapper>
          <Layout>
            <Routes>
              <Route path="/" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/home" element={<ProtectedRoute><Navigate to="/comparador" replace /></ProtectedRoute>} />
              <Route path="/comparador" element={<ProtectedRoute><ErrorBoundary><ComparadorPage /></ErrorBoundary></ProtectedRoute>} />
                      <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <ToastContainer toasts={toasts} onClose={removeToast} />
          </Layout>
        </ThemeWrapper>
      </AuthProvider>
    </ToastContext.Provider>
    </ErrorBoundary>
  );
}
export default App;
