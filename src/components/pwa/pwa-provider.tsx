"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** Online status via useSyncExternalStore (no setState-in-effect). */
function useOnline() {
  return React.useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

export function PwaProvider() {
  const online = useOnline();

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* registration failures are non-fatal */
        });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  if (online) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-warning/90 py-1.5 text-center text-xs font-medium text-black backdrop-blur-sm">
      <WifiOff className="size-3.5" />
      You&apos;re offline — showing your last synced data. Changes will sync when
      you reconnect.
    </div>
  );
}
