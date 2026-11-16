"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Calendar,
  Pill,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const handlePortalRedirect = () => {
    if (role === "ADMIN") router.push("/admin");
    else if (role === "DENTIST") router.push("/doctor");
    else router.push("/patient");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Dental<span className="text-sky-600">Connect</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Clinical Practice & Telehealth Odontogram Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border bg-slate-50 border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-slate-600">
                {apiOnline ? "Clinical Gateway Online" : "Local Standby"}
              </span>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handlePortalRedirect}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Go to Your Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-sky-600 transition"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition flex items-center gap-1.5"
                >
                  <span>Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            Specialized Clinical Dental EMR & Telehealth
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Connect dentists & patients with an <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-cyan-500">interactive odontogram</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            DentalConnect pairs standard 32-tooth dental charts with automated scheduling, itemized digital prescriptions, and lightweight enterprise identity management via <strong>ZITADEL</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {user ? (
              <button
                type="button"
                onClick={handlePortalRedirect}
                className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition flex items-center gap-2"
              >
                <span>Access Your Clinical Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-slate-900/20 transition flex items-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-200 shadow-xs transition"
                >
                  Create Account (Patient or Doctor)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clinical Capabilities Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Interactive Odontogram</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard 32-tooth anatomical dentition with Universal (1–32) and FDI (11–48) notation. Detailed quadrant and surface mapping (Occlusal, Mesial, Distal, Buccal, Lingual).
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Color-coded pathology diagnostics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Individual tooth restoration tracking</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Clinical Scheduling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conflict-free patient appointment booking with direct practitioner assignment, real-time schedule management, and visit progression tracking.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Double-booking prevention</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Visit status workflow</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Digital Prescriptions</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secure digital medication issuing for pain management and antibiotic courses with itemized dosages, frequencies, durations, and instructions.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Instant patient portal delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Medical allergy warnings & safety</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
