'use client';

import { TabPill } from '@/components/ui/TabPill';

interface ContentModePillsProps {
  activeMode: string;
  onChange: (mode: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
  variant?: 'primary' | 'secondary';
}

export function ContentModePills({ activeMode, onChange, options, variant = 'secondary' }: ContentModePillsProps) {
  return (
    <TabPill
      activeValue={activeMode}
      onChange={onChange}
      options={options}
      variant={variant}
    />
  );
}
