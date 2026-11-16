"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HeartPulse,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  Check,
  Lock,
  Users,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/docs")
      .then((res) => setApiOnline(res.ok))
      .catch(() => setApiOnline(false));
  }, []);

  const handlePortalRedirect = () => {
    if (role === "ADMIN") router.push("/admin");
    else if (role === "DENTIST") router.push("/doctor");
    else router.push("/patient");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 tracking-tight">
                DentalConnect
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border bg-slate-50 border-slate-200 text-slate-600">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  apiOnline ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              <span>{apiOnline ? "Network Live" : "Connecting"}</span>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handlePortalRedirect}
                className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="h-8 px-3 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Pitch: Uber Model for Dental Care */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Hero Section Split with Real Product Moment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>Two-Sided Healthcare Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.15]">
              Where verified dentists practice, and patients choose their care.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              An open, transparent dental care network. Patients discover board-certified practitioners and track their 32-tooth odontogram records; licensed doctors onboard their practice, conduct chairside charting, and issue digital prescriptions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/register?role=patient"
                className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-2"
              >
                <span>Find a Dentist & Register</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register?role=doctor"
                className="h-10 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-2"
              >
                <span>Onboard as a Doctor</span>
                <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
              </Link>
            </div>
          </div>

          {/* Product Moment Preview: Live Anatomical Tooth Chart & Practitioner Card */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-slate-900">Adult Odontogram Preview</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Interactive EMR
              </span>
            </div>

            {/* Mini Arch Visualization */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Upper Maxilla (1–16)</span>
                <span>Sound Enamel: 24/32</span>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className={`h-11 rounded border text-center flex flex-col items-center justify-between p-1 text-[9px] font-mono ${
                      n === 3
                        ? "bg-rose-50 border-rose-400 text-rose-700"
                        : n === 6
                        ? "bg-blue-50 border-blue-400 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>#{n}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>{n === 3 ? "Caries" : n === 6 ? "Restored" : "Sound"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Practitioner Sample */}
            <div className="p-3.5 rounded-lg border border-slate-200/60 bg-white flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">Dr. Sarah Vance, DDS</span>
                  <span className="text-[10px] font-mono text-sky-800 bg-sky-50 border border-sky-200 px-1.5 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">Orthodontics & General Dentistry</p>
              </div>
              <span className="font-mono text-xs font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                $90 fee
              </span>
            </div>
          </div>
        </div>

        {/* Two-Sided Platform Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Side */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">For Patients</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip telephone queues and opaque billing. Discover verified practitioners, compare consultation fees, schedule appointments in real-time, and view your 32-tooth odontogram translated into plain language.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Verified doctor credentials, specialties, and transparent consultation fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Personal 32-tooth health record with home oral hygiene guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Itemized digital prescriptions issued directly by your practitioner</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/register?role=patient"
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>Join as a Patient</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Doctor Side */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">For Practitioners</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                A structured clinical workspace. Submit state dental credentials for administrative verification, conduct chairside FDI/Universal odontogram examinations, maintain ADA procedure ledgers, and dispense digital prescriptions.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>State dental board license review and governance approval</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Operatory chairside charting with M/D/O/B/L surface quadrants</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>ADA CDT procedure ledgers, queue management, and digital Rx pad</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                href="/register?role=doctor"
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>Apply for Practitioner Credentialing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Practice Governance Strip */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-4 h-4 text-slate-700 shrink-0" />
            <div>
              <p className="font-medium text-slate-900">Administered Healthcare Platform</p>
              <p className="text-slate-500 text-[11px]">All doctors pass state board license verification before clinical operatory access is granted.</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-600 shrink-0">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Role-Based Access
            </span>
            <span>•</span>
            <span>FastAPI & SQLite / Postgres</span>
          </div>
        </div>
      </main>
    </div>
  );
}
