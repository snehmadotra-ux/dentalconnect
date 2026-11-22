"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserSession } from "@/context/AuthContext";
import {
  HeartPulse,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const routeUserToPortal = (authenticatedUser: UserSession) => {
    const role = (authenticatedUser.role || "PATIENT").toUpperCase();
    if (role === "ADMIN") router.push("/admin");
    else if (role === "DENTIST") router.push("/doctor");
    else router.push("/patient");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      routeUserToPortal(loggedInUser);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070a12] text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-white antialiased">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-center items-center z-0">
        <div className="w-[600px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[160px] absolute -top-20 left-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 sm:h-20 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform duration-200 group-hover:scale-105">
            <HeartPulse className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Dental Connect
          </span>
        </Link>
      </header>

      {/* Centered Sign In Card */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-6 py-8 flex flex-col justify-center items-center my-auto">
        <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In</h1>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full h-12 text-sm pl-10 pr-4 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-200"
                required
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-12 text-sm pl-10 pr-10 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all duration-200 font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-4 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white hover:text-cyan-400 font-semibold transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-16 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-center text-xs text-slate-500 border-t border-white/5">
        <p>© Dental Connect</p>
      </footer>
    </div>
  );
}
