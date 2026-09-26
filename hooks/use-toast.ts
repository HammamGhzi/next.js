"use client";

import * as React from "react";
import type { ToastProps } from "@/components/ui/toast";

type ToastInput = ToastProps & {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type ToastState = {
  toasts: (ToastInput & { id: string; open: boolean })[];
};

type Action =
  | { type: "ADD_TOAST"; toast: ToastInput }
  | { type: "DISMISS_TOAST"; id: string }
  | { type: "REMOVE_TOAST"; id: string };

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [{ ...action.toast, id: action.toast.id ?? genId(), open: true }, ...state.toasts].slice(0, 3) };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.map((t) => t.id === action.id ? { ...t, open: false } : t) };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

export function toast(props: ToastInput) {
  const id = props.id ?? genId();
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
  setTimeout(() => dispatch({ type: "DISMISS_TOAST", id }), 4000);
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), 4500);
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return { ...state, toast };
}
