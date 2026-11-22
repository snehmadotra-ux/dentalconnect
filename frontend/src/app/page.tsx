"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleDashboardRedirect = () => {
    if (!user) return;
    const role = (user.role || "PATIENT").toUpperCase();
    if (role === "ADMIN") router.push("/admin");
    else if (role === "DENTIST") router.push("/doctor");
    else router.push("/patient");
  };

  return (
    <div className="relative min-h-screen bg-[#070a12] text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-white antialiased overflow-x-hidden">
      
      {/* Background Canvas: Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-center items-center z-0">
        <div className="w-[850px] h-[450px] bg-cyan-500/[0.04] rounded-full blur-[160px] absolute -top-40 left-1/2 -translate-x-1/2" />
        <div className="w-[650px] h-[400px] bg-slate-800/[0.12] rounded-full blur-[140px] absolute bottom-0 left-1/2 -translate-x-1/2" />
      </div>

      {/* Sleek Minimal Header */}
      <header className="relative z-10 h-16 sm:h-20 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white text-slate-950 flex items-center justify-center font-bold shadow-lg transition-transform duration-200 group-hover:scale-105">
            <HeartPulse className="w-5 h-5 text-cyan-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Dental Connect
          </span>
        </Link>

        {user && (
          <button
            type="button"
            onClick={handleDashboardRedirect}
            className="h-10 px-5 bg-white text-slate-950 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 sm:px-10 py-10 flex flex-col items-center justify-center text-center my-auto">
        
        {/* Command Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.03] max-w-4xl mx-auto animate-fade-in-up">
          <span className="text-white">Dental Care</span> <br />
          <span className="text-cyan-400">for everyone.</span>
        </h1>

        {/* Action Row: Direct Link Buttons */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <Link
            href="/register"
            className="w-full sm:w-auto h-12 sm:h-13 px-8 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-2xl text-sm transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg"
          >
            <span>Sign Up</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto h-12 sm:h-13 px-8 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 font-bold rounded-2xl text-sm border border-white/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </main>

      {/* Clean Bottom Bar */}
      <footer className="relative z-10 h-16 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-center text-xs text-slate-500 border-t border-white/5">
        <p>© Dental Connect</p>
      </footer>
    </div>
  );
}
