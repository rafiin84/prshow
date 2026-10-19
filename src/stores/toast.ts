import { create } from "zustand";

export interface Toast { id: number; title: string; description?: string; tone: "success" | "error" | "info"; action?: { label: string; onClick: () => void } }
interface ToastState { toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void }
let n = 0;
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = ++n;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    if (typeof window !== "undefined") window.setTimeout(() => get().dismiss(id), t.action ? 8000 : 4500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((x) => x.id !== id) }),
}));
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ title, description, tone: "success" }),
  error: (title: string, description?: string, action?: Toast["action"]) => useToastStore.getState().push({ title, description, tone: "error", action }),
  info: (title: string, description?: string) => useToastStore.getState().push({ title, description, tone: "info" }),
};
