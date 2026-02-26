import { create } from 'zustand';
import type { PrintOrder } from '@/types/print';

interface PrintState {
  orders: PrintOrder[];
  currentOrder: PrintOrder | null;
  loading: boolean;

  setOrders: (orders: PrintOrder[]) => void;
  setCurrentOrder: (order: PrintOrder | null) => void;
  updateOrderStatus: (orderId: string, status: string, trackingUrl?: string) => void;
  reset: () => void;
}

export const usePrintStore = create<PrintState>((set, _get) => ({
  orders: [],
  currentOrder: null,
  loading: false,

  setOrders: (orders) => set({ orders }),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  updateOrderStatus: (orderId, status, trackingUrl) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: status as PrintOrder['status'],
              tracking_url: trackingUrl ?? order.tracking_url,
            }
          : order
      ),
      currentOrder:
        state.currentOrder?.id === orderId
          ? {
              ...state.currentOrder,
              status: status as PrintOrder['status'],
              tracking_url: trackingUrl ?? state.currentOrder.tracking_url,
            }
          : state.currentOrder,
    })),

  reset: () => set({ orders: [], currentOrder: null, loading: false }),
}));
