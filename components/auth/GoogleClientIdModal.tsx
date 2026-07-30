"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, ExternalLink, ShieldCheck } from "lucide-react";
import { clientIdStorage } from "@/lib/auth/storage";

interface GoogleClientIdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (clientId: string) => Promise<void>;
}

export function GoogleClientIdModal({ open, onOpenChange, onConfirm }: GoogleClientIdModalProps) {
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const saved = clientIdStorage.getClientId() || "";
      setClientId(saved);
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = clientId.trim();

    if (!cleanId) {
      setError("Google Client ID is required to sign in.");
      return;
    }

    if (!cleanId.endsWith(".apps.googleusercontent.com")) {
      setError("Invalid Client ID format. Should end with .apps.googleusercontent.com");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onConfirm(cleanId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="w-5 h-5 text-primary" />
            Enter Google Client ID
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Provide your Google Cloud OAuth 2.0 Web Client ID to authorize Write Access for Google Drive.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="client-id-input" className="text-xs font-semibold">
              NEXT_PUBLIC_GOOGLE_CLIENT_ID
            </Label>
            <Input
              id="client-id-input"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setError("");
              }}
              placeholder="e.g. 127447133673-xxx.apps.googleusercontent.com"
              className="text-xs font-mono rounded-xl h-11"
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
          </div>

          <div className="p-3 bg-muted/40 rounded-xl border text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Where do I find this?
            </div>
            <p>
              Get it from Google Cloud Console &gt; APIs &amp; Services &gt; Credentials &gt; OAuth 2.0 Client IDs.
            </p>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline flex items-center gap-1 font-medium pt-0.5"
            >
              Google Cloud Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-xl">
              {loading ? "Connecting..." : "Save & Sign In with Google"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
