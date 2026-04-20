import { toast as sonnerToast, type ExternalToast } from "sonner";

const TOAST_DURATION = 3000;
const ANIMATION_BUFFER = 400;
const TRANSITION_DELAY = 350;
const DEDUP_WINDOW = TOAST_DURATION + ANIMATION_BUFFER;

type ToastType = "success" | "error" | "warning" | "info" | "default";

interface QueuedToast {
  type: ToastType;
  message: string;
  options?: ExternalToast;
}

let isActive = false;
let activeToastId = 0;
const queue: QueuedToast[] = [];
const recentKeys = new Map<string, number>();

function toastKey(type: string, message: string, options?: ExternalToast): string {
  const desc = typeof options?.description === "string" ? options.description : "";
  return `${type}::${message}::${desc}`;
}

function processQueue() {
  if (isActive || queue.length === 0) return;
  const next = queue.shift()!;
  // Brief pause so the exit animation finishes before the next toast slides in
  setTimeout(() => showToast(next), TRANSITION_DELAY);
}

function showToast(item: QueuedToast) {
  isActive = true;
  const currentId = ++activeToastId;
  const duration = item.options?.duration || TOAST_DURATION;

  const markDone = () => {
    if (activeToastId !== currentId) return;
    isActive = false;
    processQueue();
  };

  const wrappedOptions: ExternalToast = {
    ...item.options,
    onDismiss: (t) => {
      markDone();
      item.options?.onDismiss?.(t);
    },
    onAutoClose: (t) => {
      markDone();
      item.options?.onAutoClose?.(t);
    },
  };

  // Safety fallback in case sonner callbacks don't fire
  setTimeout(markDone, duration + ANIMATION_BUFFER);

  if (item.type === "default") {
    sonnerToast(item.message, wrappedOptions);
  } else {
    sonnerToast[item.type](item.message, wrappedOptions);
  }
}

function enqueue(type: ToastType, message: string, options?: ExternalToast) {
  const key = toastKey(type, message, options);
  const now = Date.now();

  // Skip if this exact toast was shown recently
  const lastShown = recentKeys.get(key);
  if (lastShown && now - lastShown < DEDUP_WINDOW) return;

  // Skip if already queued
  if (queue.some((q) => toastKey(q.type, q.message, q.options) === key)) return;

  recentKeys.set(key, now);

  // Clean expired entries
  for (const [k, t] of recentKeys) {
    if (now - t > DEDUP_WINDOW * 2) recentKeys.delete(k);
  }

  if (!isActive) {
    showToast({ type, message, options });
  } else {
    queue.push({ type, message, options });
  }
}

export const toast = Object.assign(
  (message: string, options?: ExternalToast) => enqueue("default", message, options),
  {
    success: (message: string, options?: ExternalToast) => enqueue("success", message, options),
    error: (message: string, options?: ExternalToast) => enqueue("error", message, options),
    warning: (message: string, options?: ExternalToast) => enqueue("warning", message, options),
    info: (message: string, options?: ExternalToast) => enqueue("info", message, options),
    loading: sonnerToast.loading,
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
  }
);
