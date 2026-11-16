"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { HeartPulse, Loader2 } from "lucide-react";

export default function ZitadelCallbackPage() {
  const router = useRouter();
  const { setManualSession } = useAuth();
  const [status, setStatus] = useState("Processing ZITADEL Authentication...");

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Check for token in hash (implicit/hybrid) or code in query
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      let token = null;

      if (hash && hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(hash.substring(1));
        token = hashParams.get("access_token");
      } else if (params.get("code")) {
        // Exchange code or simulate direct development session
        token = params.get("code");
      }

      if (token) {
        api.setToken(token);
        try {
          const user = await api.getCurrentUser();
          setManualSession(token, user as any);
          if (user.role === "ADMIN") {
            router.push("/admin");
          } else if (user.role === "DENTIST") {
            router.push("/doctor");
          } else {
            router.push("/patient");
          }
          return;
        } catch (err) {
          console.error("Zitadel user sync failed", err);
        }
      }

      // Default redirect to login on error or missing token
      setStatus("Authentication complete. Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    };

    handleAuth();
  }, [router, setManualSession]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="w-14 h-14 rounded-3xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
        <HeartPulse className="w-8 h-8 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 text-slate-300 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
        <span>{status}</span>
      </div>
    </div>
  );
}
