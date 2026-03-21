"use client";

import { useEffect, useRef, useCallback } from "react";

interface FocusTrapDialogProps {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy?: string;
  children: React.ReactNode;
  className?: string;
}

export default function FocusTrapDialog({ open, onClose, ariaLabelledBy, children, className }: FocusTrapDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Store previously focused element and focus dialog on open
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;
    // Small delay to ensure dialog is rendered
    const timer = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 50);
    return () => {
      clearTimeout(timer);
      // Return focus on close
      previousFocus.current?.focus();
    };
  }, [open]);

  // Trap focus + Escape to close
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className={className || "bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-3 sm:mx-4 space-y-4 outline-none"}
      >
        {children}
      </div>
    </div>
  );
}
