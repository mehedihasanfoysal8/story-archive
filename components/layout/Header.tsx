"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Search, LogOut, User, LogIn, HardDrive, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/app";
import { clientIdStorage } from "@/lib/auth/storage";
import { GoogleClientIdModal } from "@/components/auth/GoogleClientIdModal";

interface HeaderProps {
  title?: string;
  onSearchOpen?: () => void;
}

export function Header({ title, onSearchOpen }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, login, logout, isAuthenticated, rootFolderId } = useAuth();
  const router = useRouter();

  const [clientIdModalOpen, setClientIdModalOpen] = useState(false);

  const handleSignInClick = async () => {
    const savedId = clientIdStorage.getClientId();
    if (savedId) {
      try {
        await login();
      } catch (err: any) {
        if (err?.message === "CLIENT_ID_REQUIRED") {
          setClientIdModalOpen(true);
        }
      }
    } else {
      setClientIdModalOpen(true);
    }
  };

  const handleConfirmClientId = async (clientId: string) => {
    await login(clientId);
    setClientIdModalOpen(false);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "DC";

  return (
    <>
      <header className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
        {title && (
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Drive link status */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border text-[11px] text-muted-foreground mr-2 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-primary" />
            <span>Drive: {rootFolderId?.slice(0, 10)}...</span>
          </div>

          {/* Search trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={onSearchOpen || (() => router.push(ROUTES.search))}
            className="hidden sm:flex items-center gap-2 text-muted-foreground w-48 justify-start"
            id="header-search-btn"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search...</span>
            <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9" id="theme-toggle-btn">
                {theme === "light" ? (
                  <Sun className="w-4 h-4" />
                ) : theme === "dark" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="w-4 h-4 mr-2" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="w-4 h-4 mr-2" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="w-4 h-4 mr-2" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu or Authorize button */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 px-2 gap-2" id="user-menu-btn">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                    {user?.name || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setClientIdModalOpen(true)}>
                  <KeyRound className="w-4 h-4 mr-2 text-muted-foreground" /> Change Client ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(ROUTES.settings)}>
                  <User className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={handleSignInClick}
              variant="outline"
              className="rounded-xl text-xs font-semibold gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-primary" />
              Sign in for Write Access
            </Button>
          )}
        </div>
      </header>

      {/* Google Client ID Modal */}
      <GoogleClientIdModal
        open={clientIdModalOpen}
        onOpenChange={setClientIdModalOpen}
        onConfirm={handleConfirmClientId}
      />
    </>
  );
}
