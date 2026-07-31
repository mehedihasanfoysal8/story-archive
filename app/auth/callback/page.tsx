"use client";

import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseOAuthHash } from "@/lib/auth/oauth";
import { BookMarked, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeCallback } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const callbackRun = useRef(false);

  useEffect(() => {
    if (callbackRun.current) return;
    callbackRun.current = true;

    async function handleExchange() {
      // Extract from hash (#access_token=...) or query search params
      const hashParams = typeof window !== "undefined" ? parseOAuthHash(window.location.hash) : {};
      const queryParams: Record<string, string> = {};

      searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      const mergedParams = { ...queryParams, ...hashParams };

      // Handle silent refresh (iframe)
      if (typeof window !== "undefined" && window.self !== window.top) {
        window.parent.postMessage({
          type: "OAUTH_SILENT_REFRESH",
          payload: mergedParams
        }, window.location.origin);
        return;
      }

      if (mergedParams.error) {
        setStatus("error");
        setErrorMessage(mergedParams.error_description || `OAuth error: ${mergedParams.error}`);
        return;
      }

      if (!mergedParams.access_token && !mergedParams.code) {
        setStatus("error");
        setErrorMessage("No access token or authorization response received.");
        return;
      }

      try {
        const success = await completeCallback(mergedParams);
        if (success) {
          setStatus("success");
          toast.success("Google account authenticated successfully!");
          router.replace("/");
        } else {
          setStatus("error");
          setErrorMessage("Token authentication validation failed.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage((err as Error).message);
      }
    }

    handleExchange();
  }, [searchParams, completeCallback, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-6 text-center space-y-6">
        {status === "pending" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <BookMarked className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-bold text-lg text-foreground">Authenticating with Google...</h2>
              <p className="text-sm text-muted-foreground">Connecting your Google Account credentials. Please wait.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 bg-destructive/5 border border-destructive/20 p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-bold text-lg text-foreground">Authentication Failed</h2>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button onClick={() => router.replace("/")} className="w-full rounded-xl mt-2">
              Back to App
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthCallbackFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
          <BookMarked className="w-6 h-6" />
        </div>
        <p className="text-sm text-muted-foreground">Processing Google login...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
