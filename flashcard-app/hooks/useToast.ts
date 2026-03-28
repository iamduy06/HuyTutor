"use client";
import * as React from "react";

interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  open: boolean;
}

type ToastInput = Omit<ToastData, "id" | "open">;

const listeners: Array<(toasts: ToastData[]) => void> = [];
let toasts: ToastData[] = [];

function dispatch(next: ToastData[]) {
  toasts = next;
  listeners.forEach((l) => l(toasts));
}

let counter = 0;
export function toast(input: ToastInput) {
  const id = String(++counter);
  dispatch([...toasts, { ...input, id, open: true }]);
  setTimeout(() => {
    dispatch(toasts.map((t) => (t.id === id ? { ...t, open: false } : t)));
    setTimeout(() => dispatch(toasts.filter((t) => t.id !== id)), 300);
  }, 4000);
}

export function useToast() {
  const [state, setState] = React.useState<ToastData[]>(toasts);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return { toasts: state };
}
