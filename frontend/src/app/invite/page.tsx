"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Stethoscope,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileBadge,
  Sparkles,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { setManualSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    email: string;
    full_name: string;
    role: string;
    specialization: string;
  } | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("General Dentistry");
  const [yearsOfExperience, setYearsOfExperience] = useState("5+");
  const [consultationFee, setConsultationFee] = useState(150);
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided. Clinical practitioner registration requires a valid administrator invitation.");
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const data = await api.validateInvite(token);
        setInviteData(data);
        setFullName(data.full_name || "");
        if (data.specialization) {
          setSpecialization(data.specialization);
        }
      } catch (err: any) {
        setError(err.message || "Invalid or expired invitation token.");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.registerWithInvite({
        token,
        password,
        full_name: fullName,
        phone,
        license_number: licenseNumber,
        specialization,
        years_of_experience: yearsOfExperience,
        consultation_fee: Number(consultationFee),
        bio,
      });

      const currentUser = await api.getCurrentUser();
      setManualSession(res.access_token, currentUser as any);

      router.push("/doctor");
    } catch (err: any) {
      setError(err.message || "Failed to complete practitioner onboarding.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Verifying practitioner invitation credentials...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invalid Practitioner Invitation</h2>
            <p className="text-sm text-slate-600 mt-2">{error}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
            <p className="font-semibold text-slate-800">Security Policy:</p>
            <p>Doctor and clinical staff onboarding is strictly invite-based to prevent unauthorized clinical credentialing.</p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition text-center"
            >
              Return to Login
            </Link>
            <Link
              href="/register"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition text-center"
            >
              Register as Patient
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="lg:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-indigo-800/40">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white">DentalConnect</span>
              <span className="block text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                Clinical Onboarding
              </span>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Administrator Invitation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Welcome to the Practice, {inviteData?.full_name?.split(" ")[0] || "Doctor"}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Complete your practitioner credentialing to access patient odontogram records, schedule consultations, and write validated e-prescriptions.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-indigo-800/40 space-y-3 text-xs text-slate-300">
          <p className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Role: Licensed Clinical Practitioner ({inviteData?.role || "DENTIST"})</span>
          </p>
          <p className="flex items-center gap-2">
            <FileBadge className="w-4 h-4 text-indigo-400" />
            <span>Invited Email: {inviteData?.email}</span>
          </p>
        </div>
      </div>

      {/* Right Credentialing Form */}
      <div className="flex-1 p-6 sm:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Practitioner Profile Setup</h2>
            <p className="text-xs text-slate-500 mt-1">
              Finalize your clinical details and create your secure password
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Credentials */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Account Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Vance"
                    required
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Invited)
                  </label>
                  <input
                    type="email"
                    value={inviteData?.email || ""}
                    disabled
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Clinical & License Profile */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Clinical & License Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dental License Number *
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. DDS-CA-84920"
                    required
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option>General Dentistry</option>
                    <option>Orthodontics</option>
                    <option>Periodontics</option>
                    <option>Endodontics</option>
                    <option>Pediatric Dentistry</option>
                    <option>Prosthodontics</option>
                    <option>Oral & Maxillofacial Surgery</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Years of Clinical Experience
                  </label>
                  <input
                    type="text"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="e.g. 8 years"
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Consultation Fee ($)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    min={0}
                    step={5}
                    className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Bio / Credentials Summary
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Board-certified dentist specializing in restorative and cosmetic procedures..."
                  rows={3}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Onboarding Practitioner...</span>
                </>
              ) : (
                <>
                  <span>Complete Credentialing & Enter Practice</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
