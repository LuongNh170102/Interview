import { ToastPosition, ToastType } from "../types/toast-type";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  position: ToastPosition;
  duration?: number;
}