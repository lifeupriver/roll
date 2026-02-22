'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-[var(--space-section)] p-[var(--space-component)]">
          <p className="text-[var(--color-error)] font-[family-name:var(--font-body)] text-[length:var(--text-body)]">
            Something went wrong.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-[var(--radius-sharp)] bg-[var(--color-action)] px-[var(--space-section)] py-[var(--space-element)] text-[var(--color-ink-inverse)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)]"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
