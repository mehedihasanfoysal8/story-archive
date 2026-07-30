"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                  },
                }}
              />
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
