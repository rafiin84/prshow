"use client";
import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { QueryProvider } from "@/lib/query";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { useSession } from "@/stores/session";

function Hydrate() {
  useEffect(() => { if (!useSession.getState().hydrated) useSession.getState().setHydrated(); }, []);
  return null;
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <QueryProvider>
          <Hydrate />
          {children}
          <Toaster />
        </QueryProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
