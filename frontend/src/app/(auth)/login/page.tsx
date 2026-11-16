"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "DENTIST") {
        router.push("/doctor");
      } else {
        router.push("/patient");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  const handleZitadelLogin = () => {
    const url = api.getZitadelLoginUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa]">
      {/* Left Brand Panel */}
      <div className="md:w-5/12 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">DentalConnect</span>
              <span className="block text-[11px] text-slate-400">Oral Care Network</span>
            </div>
          </Link>

          <div className="pt-8 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Clinical and Patient Portal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Sign in with your email address. DentalConnect routes your account to your personalized health records, chairside operatory, or admin console.
            </p>
          </div>
        </div>

        {/* Feature Points */}
        <div className="pt-8 space-y-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Encrypted clinical records and ADA CDT procedure ledgers</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <Stethoscope className="w-4 h-4 text-slate-400" />
            <span>Interactive 32-tooth anatomical odontogram</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl border border-slate-200/80 shadow-2xs">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your clinical credentials to access your portal
            </p>
          </div>

          {error && (
            <div className={`p-3.5 rounded-lg text-xs space-y-1 ${
              error.includes("verification in progress")
                ? "bg-amber-50 border border-amber-200 text-amber-900"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}>
              <div className="font-medium flex items-center gap-1.5">
                {error.includes("verification in progress") ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>License Verification Underway</span>
                  </>
                ) : (
                  <span>Authentication Notice</span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-10 text-xs pl-9 pr-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-10 text-xs pl-9 pr-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* ZITADEL SSO Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleZitadelLogin}
              className="w-full h-10 rounded-lg font-medium text-xs text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Sign in with ZITADEL SSO</span>
            </button>
          </div>

          {/* Quick Demo Pre-fills */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 mb-2">Quick Sign-In (Demo Accounts):</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount("dr.vance@dentalconnect.com")}
                className="h-8 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 font-medium transition-colors text-center truncate"
              >
                Dr. Vance (Doctor)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("patient@dentalconnect.com")}
                className="h-8 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 font-medium transition-colors text-center truncate"
              >
                Jane Doe (Patient)
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount("admin@dentalconnect.com")}
                className="h-8 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 font-medium transition-colors text-center truncate"
              >
                Admin (Governance)
              </button>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-medium text-slate-900 hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
