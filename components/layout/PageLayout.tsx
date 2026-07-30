import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  onSearchOpen?: () => void;
}

export function PageLayout({ children, title, onSearchOpen }: PageLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} onSearchOpen={onSearchOpen} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
