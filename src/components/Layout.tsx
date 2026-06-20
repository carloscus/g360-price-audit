import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { useAppStore } from '../store/useAppStore';
import { ConfirmModal } from './ui/ConfirmModal';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, userName, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLoginPage = location.pathname === '/';
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
          userMenuButtonRef.current && !userMenuButtonRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-15%] left-[-8%] w-[50%] h-[50%] rounded-full bg-[var(--color-primary-500)] opacity-[0.06] blur-[120px]"></div>
        <div className="absolute bottom-[-15%] right-[-8%] w-[45%] h-[45%] rounded-full bg-[var(--color-accent-500)] opacity-[0.04] blur-[120px]"></div>
        <div className="absolute top-[40%] right-[-5%] w-[25%] h-[25%] rounded-full bg-[var(--color-secondary-400)] opacity-[0.03] blur-[100px]"></div>
        <div className="absolute bottom-[30%] left-[-5%] w-[20%] h-[20%] rounded-full bg-[var(--color-primary-300)] opacity-[0.03] blur-[90px]"></div>
      </div>

      {isLoggedIn && !isLoginPage && (
        <header className="sticky top-0 z-50 w-full glass border-b border-[var(--border-glass)]" role="banner">
          <div className="w-full px-4 h-14 flex items-center justify-between">

            <div className="flex items-center gap-3" aria-label="CIPSA Logo">
              <img
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt="CIPSA Logo"
                className="h-9 w-auto block object-contain"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">CIPSA</span>
                <span className="text-[10px] font-medium text-[var(--text-tertiary)] tracking-wider uppercase">Price Audit</span>
              </div>
            </div>

            <div className="relative">
              <button
                ref={userMenuButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowUserMenu(!showUserMenu);
                  }
                }}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-controls="user-menu"
                aria-label={`Menú de usuario, ${userName}`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))', color: 'var(--color-text-inverse)' }}>
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} aria-hidden="true"></div>
                  <div
                    className="absolute right-0 mt-2 w-52 glass-card overflow-hidden z-50 animate-fade-in origin-top-right"
                    role="menu"
                    id="user-menu"
                    aria-labelledby="user-menu-button"
                    ref={userMenuRef}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => toggleTheme()}
                        className="w-full text-left px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center justify-between transition-colors"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2.5">
                          {theme === 'dark' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m15.66 7.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          )}
                          <span>Tema</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                          {theme === 'dark' ? 'Oscuro' : 'Claro'}
                        </span>
                      </button>
                      <div className="border-t border-[var(--border-primary)] my-1"></div>
                      <button
                        onClick={() => {
                          handleLogoutClick();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[var(--color-on-surface-error)] hover:bg-[var(--color-input-tint-error-bg)] flex items-center gap-2.5 transition-colors"
                        role="menuitem"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="relative w-full px-3 sm:px-4 lg:px-6 py-4">
        {children}
      </main>

      {isLoggedIn && !isLoginPage && <Footer />}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Cerrar Sesión"
        message="¿Seguro que deseas cerrar sesión?"
        confirmText="Sí, cerrar sesión"
        variant="danger"
      />
    </div>
  );
};

export default Layout;