export type CaptureOpenDetail = { dueDate?: string };

export function openCapture(detail?: CaptureOpenDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CaptureOpenDetail>("mindora:open-capture", { detail }),
  );
}
