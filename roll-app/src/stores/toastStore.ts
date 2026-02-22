import { create } from 'zustand';
import { useCallback } from 'react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const toasts = useToastStore((state) => state.toasts);
  const addToast = useToastStore((state) => state.addToast);
  const removeToast = useToastStore((state) => state.removeToast);

  const toast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      options?: { duration?: number; action?: { label: string; onClick: () => void } }
    ) => {
      return addToast({
        message,
        type,
        duration: options?.duration ?? 3000,
        action: options?.action,
      });
    },
    [addToast]
  );

  return { toasts, toast, removeToast };
}
