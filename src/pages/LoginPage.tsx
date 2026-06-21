import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/auth';
import { MeshGradient, GrainyBackground } from '../components/ui/VisualEffects';
import { LogIn, User, Mail, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../utils/cn';

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
    <GrainyBackground className="flex items-center justify-center p-4 relative overflow-hidden bg-glow-top min-h-screen">
      <MeshGradient />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[var(--color-primary-600)] text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-400)] focus:ring-offset-2"
      >
        Ir al contenido principal
      </a>

      <div className="w-full max-w-5xl relative z-10 animate-fade-in" role="region" aria-label="Formulario de inicio de sesión">
        <div className="glass-card card-neon overflow-hidden border-white/20 dark:border-white/10 flex flex-col lg:flex-row" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

          {/* ========================================
              LEFT PANEL - Logo/Branding (hidden on mobile)
              ======================================== */}
          <div className="hidden lg:flex lg:w-5/12 px-8 py-16 text-center relative overflow-hidden items-center justify-center" style={{ 
            background: 'linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-secondary-900) 100%)',
          }}>
            <div className="absolute inset-0 opacity-[0.06] login-grid-pattern" aria-hidden="true"></div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-28 h-28 mx-auto bg-white rounded-3xl flex items-center justify-center mb-6 p-5 glow-accent" 
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
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-md" 
                id="login-title"
              >
                CIPSA
              </motion.h1>
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="h-1 w-16 mx-auto mb-4 rounded-full origin-center" 
                style={{ backgroundColor: 'var(--color-accent-500)' }}
              ></motion.div>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-xs font-bold uppercase tracking-[0.4em] text-blue-200/80"
              >
                Análisis de Precios
              </motion.p>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="mt-8 text-sm text-blue-200/60 leading-relaxed max-w-xs mx-auto"
              >
                Plataforma inteligente de monitoreo y comparación de precios para la toma de decisiones comerciales.
              </motion.p>
            </div>
          </div>

          {/* ========================================
              RIGHT PANEL - Form
              ======================================== */}
          <div className="w-full lg:w-7/12 px-8 py-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
              id="login-status"
            >
              {message || rateLimitError || ''}
            </div>

            {/* Mobile header (visible only on small screens) */}
            <div className="lg:hidden text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 mx-auto bg-white rounded-2xl flex items-center justify-center mb-4 p-4 shadow-lg" 
                style={{ 
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15), 0 0 0 3px rgba(255,255,255,0.1)',
                  borderBottom: '3px solid var(--color-accent-500)'
                }}
                aria-hidden="true"
              >
                <img 
                  src={`${import.meta.env.BASE_URL}favicon.svg`} 
                  alt="CIPSA Logo" 
                  className="w-full h-full object-contain" 
                />
              </motion.div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">CIPSA</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--text-tertiary)]">Análisis de Precios</p>
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Bienvenido</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-8">Ingrese sus credenciales corporativas para acceder</p>

            <form onSubmit={handleLogin} className="space-y-6" noValidate>

              <div className="space-y-2">
                <label htmlFor="name" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-500)]">
                  <User size={14} className="text-[var(--color-primary-500)]" />
                  Nombre Completo <span className="text-[var(--color-accent-500)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      "input input-neon focus:ring-2 focus:ring-[var(--color-primary-500)]/20",
                      errors.name ? "border-[var(--color-accent-500)] bg-[var(--color-accent-50)]/50" : "border-[var(--color-secondary-200)] dark:border-[var(--color-secondary-700)] bg-white/50"
                    )}
                    placeholder="Ingrese su nombre completo"
                    disabled={isLoading}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    aria-required="true"
                    autoComplete="name"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-xs flex items-center font-medium text-[var(--color-accent-600)]" id="name-error" role="alert">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-500)]">
                  <Mail size={14} className="text-[var(--color-primary-500)]" />
                  Correo Corporativo <span className="text-[var(--color-accent-500)]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn(
                      "input input-neon focus:ring-2 focus:ring-[var(--color-primary-500)]/20",
                      errors.email ? "border-[var(--color-accent-500)] bg-[var(--color-accent-50)]/50" : "border-[var(--color-secondary-200)] dark:border-[var(--color-secondary-700)] bg-white/50"
                    )}
                    placeholder={`usuario${requiredDomain}`}
                    disabled={isLoading}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    aria-required="true"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs flex items-center font-medium text-[var(--color-accent-600)]" id="email-error" role="alert">
                      <AlertCircle size={12} className="mr-1" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn btn-neon py-4 text-sm font-black uppercase tracking-widest border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 bg-[var(--color-primary-600)] text-white shadow-[0_10px_15px_-3px_rgba(21,68,176,0.3)] relative overflow-hidden"
                aria-describedby="login-instruction"
                aria-busy={isLoading}
              >
                <AnimatePresence mode="popLayout">
                  {isLoading ? (
                    <motion.span
                      key="loading"
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 80, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="flex items-center justify-center gap-2"
                    >
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                      <span>Iniciando...</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ x: -80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 80, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="flex items-center justify-center gap-2"
                    >
                      <LogIn size={18} />
                      <span>Iniciar Sesión</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {rateLimitError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl border flex items-center gap-3 border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300" 
                role="alert" 
                aria-live="assertive"
              >
                <ShieldAlert size={20} className="flex-shrink-0" />
                <p className="text-xs font-semibold leading-relaxed">{rateLimitError}</p>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mt-6 p-4 rounded-xl border flex items-center gap-3",
                  message.includes('Error') 
                    ? "border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300"
                )} 
                role="status" 
                aria-live="polite"
              >
                {message.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <p className="text-xs font-semibold leading-relaxed">{message}</p>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </GrainyBackground>
  );
};

export default LoginPage;