import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  const MAX_ATTEMPTS = 5;
  const WINDOW_MINUTES = 5;
  const STORAGE_KEY = 'login_attempts';
  const requiredDomain = '@cipsa.com.pe';

  const getAttempts = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { attempts: 0, lastAttempt: 0 };
    return JSON.parse(stored);
  };

  const setAttempts = (attempts: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      attempts,
      lastAttempt: Date.now()
    }));
  };

  const checkRateLimit = () => {
    const { attempts, lastAttempt } = getAttempts();
    const now = Date.now();
    const windowMs = WINDOW_MINUTES * 60 * 1000;

    if (now - lastAttempt > windowMs) {
      setAttempts(0);
      setRateLimitError(null);
      setTimeUntilReset(0);
      return true;
    }

    if (attempts >= MAX_ATTEMPTS) {
      const timeLeft = Math.ceil((windowMs - (now - lastAttempt)) / 1000 / 60);
      setRateLimitError(`Demasiados intentos de inicio de sesión. Intente nuevamente en ${timeLeft} minutos.`);
      setTimeUntilReset(timeLeft);
      return false;
    }

    return true;
  };

  const messageBorderColor = useMemo(() => {
    if (!message) return '';
    return message.includes('Error')
      ? 'border-[var(--color-error-200)] bg-[var(--color-error-50)] dark:bg-[var(--color-error-900)]/20 dark:border-[var(--color-error-800)]'
      : 'border-[var(--color-success-200)] bg-[var(--color-success-50)] dark:bg-[var(--color-success-900)]/20 dark:border-[var(--color-success-800)]';
  }, [message]);

  const messageTextColor = useMemo(() => {
    if (!message) return '';
    return message.includes('Error')
      ? 'text-[var(--color-error-800)] dark:text-[var(--color-error-300)]'
      : 'text-[var(--color-success-800)] dark:text-[var(--color-success-300)]';
  }, [message]);

  const messageIcon = useMemo(() => {
    if (message.includes('Error')) {
      return (
        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }, [message]);

  React.useEffect(() => {
    if (timeUntilReset > 0) {
      const interval = setInterval(() => {
        setTimeUntilReset(prev => {
          if (prev <= 1) {
            setRateLimitError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [timeUntilReset]);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!email.toLowerCase().endsWith(requiredDomain)) {
      newErrors.email = `El correo debe terminar con "${requiredDomain}"`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setRateLimitError(null);

    if (!validateForm()) {
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAttempts(0);
      setMessage('Inicio de sesión exitoso! Redirigiendo...');
      login(name, email);
      navigate('/comparador');
    } catch {
      const current = getAttempts();
      setAttempts(current.attempts + 1);
      setMessage('Error en el inicio de sesión. Inténtelo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-glow-top" style={{ backgroundColor: 'var(--bg-primary)' }}>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-offset-2"
      >
        Ir al contenido principal
      </a>

      {/* Decorative blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.07] blur-[130px]" style={{ backgroundColor: 'var(--color-primary-500)' }} aria-hidden="true"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full opacity-[0.06] blur-[130px]" style={{ backgroundColor: 'var(--color-secondary-800)' }} aria-hidden="true"></div>
      <div className="absolute top-[30%] right-[5%] w-[30%] h-[30%] rounded-full opacity-[0.04] blur-[100px]" style={{ backgroundColor: 'var(--color-accent-500)' }} aria-hidden="true"></div>

      {/* Decorative shapes */}
      <div className="absolute top-[12%] right-[12%] w-28 h-28 border-2 rounded-2xl rotate-45 opacity-25" style={{ borderColor: 'var(--color-primary-300)' }} aria-hidden="true"></div>
      <div className="absolute bottom-[18%] left-[10%] w-20 h-20 border-2 rounded-full opacity-20" style={{ borderColor: 'var(--color-accent-200)' }} aria-hidden="true"></div>
      <div className="absolute top-[35%] left-[4%] w-14 h-14 rounded-xl rotate-12 opacity-20" style={{ backgroundColor: 'var(--color-primary-200)' }} aria-hidden="true"></div>
      <div className="absolute bottom-[35%] right-[6%] w-10 h-10 rounded-lg rotate-[30deg] opacity-15" style={{ backgroundColor: 'var(--color-accent-100)' }} aria-hidden="true"></div>
      <div className="absolute top-[60%] left-[15%] w-6 h-6 rounded-full opacity-10" style={{ backgroundColor: 'var(--color-primary-400)' }} aria-hidden="true"></div>
      <div className="absolute bottom-[25%] right-[20%] w-8 h-8 border rounded-md rotate-[45deg] opacity-15" style={{ borderColor: 'var(--color-secondary-300)' }} aria-hidden="true"></div>

      <div className="w-full max-w-md relative z-10 animate-fade-in" role="region" aria-label="Formulario de inicio de sesión">
        <div className="glass-card card-neon overflow-hidden" style={{ boxShadow: '0 20px 50px rgba(6, 17, 48, 0.35)' }}>

          {/* ========================================
              HEADER - Dark Navy background con gradiente
              ======================================== */}
          <div className="px-8 py-24 text-center relative overflow-hidden header-neon-bottom" style={{ 
            background: 'linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-secondary-900) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div className="absolute inset-0 opacity-[0.06] login-grid-pattern" aria-hidden="true"></div>
            <div className="relative z-10">
              <div 
                className="w-28 h-28 mx-auto bg-white rounded-3xl flex items-center justify-center mb-8 p-6 transition-all duration-500 hover:translate-y-[-4px] glow-accent" 
                style={{ 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.1)',
                  borderBottom: '4px solid var(--color-accent-500)'
                }}
                aria-hidden="true"
              >
                <img 
                  src={`${import.meta.env.BASE_URL}favicon.svg`} 
                  alt="CIPSA Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <h1 className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-sm" id="login-title">CIPSA</h1>
              <div className="h-1.5 w-12 mx-auto mb-5 rounded-full" style={{ backgroundColor: 'var(--color-accent-500)' }}></div>
              <p className="text-[11px] font-black uppercase tracking-[0.6em] opacity-90" style={{ color: 'var(--color-secondary-200)' }}>Análisis de Precios</p>
            </div>
          </div>

          {/* ========================================
              FORMULARIO
              ======================================== */}
          <div className="px-8 py-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              id="login-status"
            >
              {message || rateLimitError || ''}
            </div>

            <form onSubmit={handleLogin} className="space-y-6" noValidate>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Nombre Completo <span style={{ color: 'var(--color-error-500)' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-neon focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                    style={{
                      borderColor: errors.name ? 'var(--color-error-500)' : 'var(--border-primary)',
                      boxShadow: errors.name ? '0 0 0 3px var(--color-input-tint-error-ring)' : undefined
                    }}
                    placeholder="Ingrese su nombre completo"
                    disabled={isLoading}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    aria-required="true"
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm flex items-center" style={{ color: 'var(--color-error-600)' }} id="name-error" role="alert">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Correo Corporativo <span style={{ color: 'var(--color-error-500)' }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-neon focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                    style={{
                      borderColor: errors.email ? 'var(--color-error-500)' : 'var(--border-primary)',
                      boxShadow: errors.email ? '0 0 0 3px var(--color-input-tint-error-ring)' : undefined
                    }}
                    placeholder={`usuario${requiredDomain}`}
                    disabled={isLoading}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-required="true"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm flex items-center" style={{ color: 'var(--color-error-600)' }} id="email-error" role="alert">
                      <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-neon py-3.5 text-base font-bold uppercase tracking-wide border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-offset-2 transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: 'var(--color-primary-500)',
                  color: 'var(--color-btn-primary-text)',
                  boxShadow: '0 4px 14px rgba(26, 86, 219, 0.35)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary-500)';
                  e.currentTarget.style.transform = 'none';
                }}
                aria-describedby="login-instruction"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    <span>Iniciando sesión...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                    <span>Iniciar Sesión</span>
                  </span>
                )}
              </button>
              <div id="login-instruction" className="sr-only">
                Presione Enter o haga clic para iniciar sesión. El formulario requiere nombre completo y correo corporativo.
              </div>
            </form>

            {rateLimitError && (
              <div className="mt-6 p-4 rounded-lg border flex items-center gap-3 animate-fade-in" style={{
                borderColor: 'var(--color-warning-200)',
                backgroundColor: 'var(--color-warning-50)',
                color: 'var(--color-warning-800)'
              }} role="alert" aria-live="assertive">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <p className="text-sm font-medium">{rateLimitError}</p>
              </div>
            )}

            {message && (
              <div className={`mt-6 p-4 rounded-lg border flex items-center gap-3 animate-fade-in ${messageBorderColor} ${messageTextColor}`} role="status" aria-live="polite">
                {messageIcon}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}
          </div>

          </div>
      </div>
    </div>
  );
};

export default LoginPage;