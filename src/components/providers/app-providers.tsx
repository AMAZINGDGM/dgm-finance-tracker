"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        closeButton
        expand
        richColors
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#0B1120",
            border: "1px solid #1E293B",
            color: "#F8FAFC",
            boxShadow: "0 18px 55px rgba(0, 0, 0, 0.32)"
          }
        }}
      />
    </>
  );
}
