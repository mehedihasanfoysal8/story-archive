"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Sparkles, FolderSymlink, ArrowRight, HardDrive, CheckCircle2, LogIn, KeyRound, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { extractFolderIdFromUrl } from "@/utils/helpers";
import { APP_CONFIG } from "@/config/app";
import { clientIdStorage } from "@/lib/auth/storage";
import toast from "react-hot-toast";

export function LoginPage() {
  const { setRootFolderId, login } = useAuth();
  const [driveUrl, setDriveUrl] = useState<string>(APP_CONFIG.defaultDriveLink);
  const [connecting, setConnecting] = useState(false);
  const [clientId, setClientId] = useState<string>(clientIdStorage.getClientId() || "");
  const [showAdvanced, setShowAdvanced] = useState(!clientIdStorage.getClientId());

  const saveClientIdIfNeeded = () => {
    if (clientId.trim()) {
      clientIdStorage.setClientId(clientId.trim());
    }
  };

  const handleConnectWithLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    saveClientIdIfNeeded();

    const folderId = extractFolderIdFromUrl(driveUrl);
    if (!folderId) {
      toast.error("Please enter a valid Google Drive folder link or ID");
      return;
    }

    setConnecting(true);
    setRootFolderId(folderId);

    // If we have a Client ID, trigger Google login
    if (clientIdStorage.getClientId()) {
      try {
        await login();
      } catch (err) {
        toast.error("Google sign-in failed: " + (err as Error).message);
        setConnecting(false);
      }
    } else {
      // No Client ID — just connect folder and go to dashboard
      toast.success("Google Drive folder connected!");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid relative overflow-hidden p-4">
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] p-8 rounded-2xl glass border border-border shadow-2xl relative z-10 text-center space-y-5"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <BookMarked className="w-7 h-7 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1.5">Story Archive CMS</h1>
          <p className="text-sm text-muted-foreground">
            Connect your Google Drive folder to manage your stories.
          </p>
        </div>

        <form onSubmit={handleConnectWithLogin} className="space-y-3 text-left">
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
          </div>

          {/* Collapsible Client ID section */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-foreground bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                Google OAuth Client ID
                {clientIdStorage.getClientId() ? (
                  <span className="ml-1 text-emerald-500 font-normal">✓ set</span>
                ) : (
                  <span className="ml-1 text-amber-500 font-normal">optional</span>
                )}
              </span>
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showAdvanced && (
              <div className="p-3 space-y-2 border-t border-border bg-background/60">
                <Input
                  type="text"
                  placeholder="Client ID (ends with .apps.googleusercontent.com)"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  onBlur={saveClientIdIfNeeded}
                  className="h-9 text-xs font-mono rounded-lg"
                />
                <p className="text-[10px] text-muted-foreground">
                  Required for Google Sign-In. Get from{" "}
                  <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a>.
                </p>
              </div>
            )}
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
                {clientIdStorage.getClientId() ? "Connect & Sign in with Google" : "Connect Drive Folder"}
                <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Connects directly to your Google Drive storage</span>
        </div>
      </motion.div>
    </div>
  );
}
