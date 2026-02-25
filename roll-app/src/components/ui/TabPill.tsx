'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface TabOption {
  value: string;
  label: string;
  count?: number;
}

interface TabPillProps {
  activeValue: string;
  onChange: (value: string) => void;
  options: TabOption[];
  variant?: 'primary' | 'secondary';
}

export function TabPill({ activeValue, onChange, options, variant = 'primary' }: TabPillProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || variant !== 'primary') return;
    const activeButton = containerRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
    if (activeButton) {
      setIndicatorStyle({
        width: activeButton.offsetWidth,
        transform: `translateX(${activeButton.offsetLeft}px)`,
        transition: 'transform 200ms ease-in-out, width 200ms ease-in-out',
      });
    }
  }, [variant]);

  useEffect(() => {
    updateIndicator();
  }, [activeValue, updateIndicator]);

  // Also update on resize
  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className="relative flex gap-[var(--space-tight)] overflow-x-auto no-scrollbar"
    >
      {/* Sliding background indicator for primary variant */}
      {variant === 'primary' && (
        <div
          className="absolute top-0 left-0 h-full bg-[#2A2522] rounded-[var(--radius-pill)] pointer-events-none z-0"
          style={indicatorStyle}
        />
      )}

      {options.map((option) => {
        const isActive = activeValue === option.value;

        const primaryStyles = isActive
          ? 'text-[#FAF7F2] z-10'
          : 'text-[#6B5E54] hover:text-[#2A2522] z-10';

        const secondaryStyles = isActive
          ? 'border-b-2 border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent'
          : 'border-b-2 border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] bg-transparent';

        const styles = variant === 'primary' ? primaryStyles : secondaryStyles;
        const shapeStyles = variant === 'primary'
          ? 'rounded-[var(--radius-pill)]'
          : 'rounded-none';

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`relative px-[var(--space-component)] py-[var(--space-tight)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium whitespace-nowrap transition-colors duration-150 ease-out ${shapeStyles} ${styles}`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 opacity-70">({option.count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
