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
      // Automatically route user to their dedicated portal based on their account role
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

  const handleZitadelLogin = () => {
    const url = api.getZitadelLoginUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Clinical Branding Panel */}
      <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Dental<span className="text-sky-400">Connect</span>
              </h1>
              <p className="text-xs text-sky-200">Clinical EMR & Odontogram Suite</p>
            </div>
          </div>

          <div className="pt-10 space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Clinical & Patient Portal
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sign in with your email and password. Your account identity will automatically direct you to your personalized clinical workspace or patient health portal.
            </p>
          </div>
        </div>

        {/* Security & Access Badges */}
        <div className="relative z-10 pt-10 space-y-3 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted health record access</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <Stethoscope className="w-4 h-4 text-sky-400" />
            <span>Interactive 32-tooth clinical odontogram</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your clinical credentials to access your portal
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* ZITADEL SSO Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleZitadelLogin}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-sky-600" />
              Sign In via ZITADEL (OIDC SSO)
            </button>
          </div>

          <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
            Don't have an account yet?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Create Account (Patient or Doctor)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
