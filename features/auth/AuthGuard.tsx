"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage } from "./LoginPage";
import { BookMarked } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, rootFolderId, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce">
            <BookMarked className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">Loading Story Archive...</p>
        </div>
      </div>
    );
  }

  // Must have both a folder and an active Google session token to use the Drive API
  if (!rootFolderId || !isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
