import React, { useState, ReactNode } from 'react';
import { AuthContext } from './auth';

/**
 * AUTENTICACIÓN SOLO CLIENTE - LIMITACIÓN DE SEGURIDAD
 * ====================================================
 * Esta implementación almacena la sesión en localStorage y la valida solo del lado cliente.
 * 
 * LIMITACIONES:
 * - Un atacante con acceso al navegador puede modificar localStorage para autenticarse
 *   como cualquier usuario sin conocer credenciales
 * - No hay validación de sesión con el servidor
 * - Los tokens de sesión no son a prueba de manipulaciones
 * 
 * RECOMENDACIÓN PARA PRODUCCIÓN:
 * - Implementar autenticación server-side con JWT en httpOnly cookies
 * - Validar sesión en el servidor en cada request protegido
 * - Usar HTTPS obligatorio
 * - Considerar OAuth/OIDC con proveedor externo
 */

const SESSION_KEY = 'g360_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

interface SessionData {
  isLoggedIn: boolean;
  userName: string | null;
  userEmail: string | null;
  timestamp: number;
}

const readSession = (): SessionData | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: SessionData = JSON.parse(raw);
    if (Date.now() - data.timestamp > SESSION_EXPIRY_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const writeSession = (data: Omit<SessionData, 'timestamp'>) => {
  const session: SessionData = { ...data, timestamp: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(() => readSession());

  const login = (name: string, email: string) => {
    const data = { isLoggedIn: true, userName: name, userEmail: email };
    writeSession(data);
    setSession({ ...data, timestamp: Date.now() });
  };

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const isLoggedIn = session?.isLoggedIn ?? false;
  const userName = session?.userName ?? null;
  const userEmail = session?.userEmail ?? null;

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
