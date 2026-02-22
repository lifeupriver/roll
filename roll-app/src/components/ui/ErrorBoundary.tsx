'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Called when the user clicks retry */
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isNetworkError =
        this.state.error?.message?.toLowerCase().includes('fetch') ||
        this.state.error?.message?.toLowerCase().includes('network') ||
        this.state.error?.name === 'TypeError';

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-[var(--space-component)] p-[var(--space-component)] text-center">
          <AlertTriangle
            size={32}
            strokeWidth={1.5}
            className="text-[var(--color-ink-tertiary)]"
          />
          <p className="font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)]">
            {isNetworkError
              ? 'Connection problem — check your internet and try again.'
              : 'Something went wrong.'}
          </p>
          {this.state.error?.message && !isNetworkError && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] max-w-md">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-[var(--space-tight)] rounded-[var(--radius-sharp)] bg-[var(--color-action)] px-[var(--space-section)] py-[var(--space-element)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] transition-opacity hover:opacity-90"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
