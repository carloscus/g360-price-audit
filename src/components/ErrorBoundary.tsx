import React from 'react';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="bg-[var(--surface-elevated)] border border-[var(--border-primary)] rounded-2xl p-10 max-w-md w-full">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[var(--color-danger)]" aria-hidden="true" />
            <h2 className="text-lg font-bold mb-3 text-[var(--text-primary)]">
              Error inesperado
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Ocurrió un error en la aplicación. Por favor, intente recargar la página.
            </p>
            <details className="mb-5 text-left text-xs">
              <summary className="cursor-pointer text-[var(--text-secondary)] flex items-center gap-1">
                <ChevronDown size={14} />
                Detalles del error
              </summary>
              <pre className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg overflow-auto text-[var(--color-danger)] whitespace-pre-wrap break-words">
                {this.state.error?.message}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-btn-primary-text)] border-none rounded-lg px-5 py-2.5 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={16} />
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
