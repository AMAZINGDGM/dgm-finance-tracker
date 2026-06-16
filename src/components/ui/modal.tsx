"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={cn(
          "glass-panel relative z-[110] max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl p-4 shadow-panel sm:max-h-[calc(100dvh-2rem)] sm:p-5",
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
