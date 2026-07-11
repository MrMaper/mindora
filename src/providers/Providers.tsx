"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { peyda } from "@/lib/font";

interface ProvidersProps {
  children: React.ReactNode;
}

function useToastPosition() {
  const [position, setPosition] = React.useState<
    "bottom-left" | "bottom-right"
  >("bottom-left");

  React.useEffect(() => {
    const checkDir = () => {
      const dir = document.documentElement.getAttribute("dir");
      setPosition(dir === "rtl" ? "bottom-left" : "bottom-right");
    };
    checkDir();
    const observer = new MutationObserver(checkDir);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => observer.disconnect();
  }, []);

  return position;
}

export function Providers({ children }: ProvidersProps) {
  const toastPosition = useToastPosition();

  return (
    <SessionProvider>
      <TooltipProvider>
        <QueryProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </QueryProvider>
        <Toaster position={toastPosition} richColors style={peyda.style} />
      </TooltipProvider>
    </SessionProvider>
  );
}
