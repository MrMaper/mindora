import { toast } from "sonner";

export function notifyError(message: string): void {
  toast.error(message);
}

export function notifySuccess(message: string): void {
  toast.success(message);
}
