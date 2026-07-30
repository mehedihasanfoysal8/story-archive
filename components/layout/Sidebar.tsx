"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  Images,
  Search,
  Settings,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { ROUTES } from "@/config/app";

const navItems = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.stories, label: "Stories", icon: BookOpen },
  { href: ROUTES.folders, label: "Folders", icon: FolderOpen },
  { href: ROUTES.images, label: "Images", icon: Images },
  { href: ROUTES.search, label: "Search", icon: Search },
];

const bottomItems = [
  { href: ROUTES.settings, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-sidebar border-r border-sidebar-border overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[64px]">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <BookMarked className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-sidebar-foreground font-bold text-sm truncate"
            >
              Story Archive
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || ((href as string) !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-item", isActive && "sidebar-item-active")}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="py-4 px-2 border-t border-sidebar-border space-y-1">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn("sidebar-item", isActive && "sidebar-item-active")}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="truncate"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}
