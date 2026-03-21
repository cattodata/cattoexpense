"use client";
import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: "bg-[var(--catto-green-50)] border-[var(--catto-green-100)] text-[var(--catto-green-600)]",
  error: "bg-[var(--catto-red-50)] border-[var(--catto-red-100)] text-[var(--catto-red-600)]",
  info: "bg-[var(--catto-blue-50)] border-[var(--catto-blue-100)] text-[var(--catto-blue-600)]",
};

const ICON_COLORS = {
  success: "text-[var(--catto-green-600)]",
  error: "text-[var(--catto-red-500)]",
  info: "text-[var(--catto-blue-500)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
        role="log"
        aria-live={toasts.some((t) => t.type === "error") ? "assertive" : "polite"}
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <ToastItem key={t.id} toast={t} Icon={Icon} onClose={() => removeToast(t.id)} />
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, Icon, onClose }: { toast: Toast; Icon: typeof CheckCircle; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        COLORS[toast.type]
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-black/5 transition-colors -mr-2"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
