"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Sparkles, FolderSymlink, ArrowRight, HardDrive, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { extractFolderIdFromUrl } from "@/utils/helpers";
import { APP_CONFIG } from "@/config/app";
import toast from "react-hot-toast";

export function LoginPage() {
  const { setRootFolderId, login, isAuthenticated, rootFolderId } = useAuth();
  const [driveUrl, setDriveUrl] = useState<string>(APP_CONFIG.defaultDriveLink);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderId = extractFolderIdFromUrl(driveUrl);
    if (!folderId) {
      toast.error("Please enter a valid Google Drive folder link or ID");
      return;
    }

    setConnecting(true);
    // Save extracted folder ID as active Drive root
    setRootFolderId(folderId);
    toast.success("Drive folder connected! Signing in with Google...");

    // Trigger Google OAuth login so we get an access token
    try {
      await login();
    } catch (err) {
      toast.error("Google sign-in failed: " + (err as Error).message);
      setConnecting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setConnecting(true);
      await login();
    } catch (err) {
      toast.error("Google sign-in failed: " + (err as Error).message);
      setConnecting(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid relative overflow-hidden p-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[460px] p-8 rounded-2xl glass border border-border shadow-2xl relative z-10 text-center space-y-6"
      >
        {/* App Logo */}
        <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <BookMarked className="w-7 h-7 text-white" />
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1.5">
            Story Archive CMS
          </h1>
          <p className="text-sm text-muted-foreground">
            {rootFolderId && !isAuthenticated
              ? "Sign in with Google to access your stories."
              : "Connect your Google Drive folder and sign in to manage your stories."}
          </p>
        </div>

        {/* If folder is connected but no token, just show Google Sign-In */}
        {rootFolderId && !isAuthenticated ? (
          <Button
            onClick={handleGoogleLogin}
            disabled={connecting}
            size="lg"
            className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 group shadow-md"
            id="google-signin-btn"
          >
            {connecting ? (
              <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-1 flex-shrink-0" />
                Sign in with Google
                <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        ) : (
          /* Drive Link + Sign-In Form */
          <form onSubmit={handleConnect} className="space-y-4 text-left pt-2">
            <div className="space-y-2">
              <Label htmlFor="drive-link-input" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FolderSymlink className="w-4 h-4 text-primary" />
                Google Drive Folder Link
              </Label>
              <Input
                id="drive-link-input"
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                className="h-11 rounded-xl bg-background/80 border-input text-xs font-mono"
                required
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>Enter your Google Drive folder link then sign in</span>
              </p>
            </div>

            <Button
              type="submit"
              disabled={connecting}
              size="lg"
              className="w-full h-11 rounded-xl font-semibold flex items-center justify-center gap-2 group shadow-md"
              id="google-connect-btn"
            >
              {connecting ? (
                <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <HardDrive className="w-4 h-4 mr-1 flex-shrink-0" />
                  Connect & Sign in with Google
                  <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Connects directly to your Google Drive storage</span>
        </div>
      </motion.div>
    </div>
  );
}
