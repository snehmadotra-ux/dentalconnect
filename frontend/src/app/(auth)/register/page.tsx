"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  HeartPulse,
  ArrowRight,
  User,
  Stethoscope,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "doctor" ? "doctor" : "patient";
  const { setManualSession } = useAuth();

  const [role, setRole] = useState<"patient" | "doctor">(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doctorSubmitted, setDoctorSubmitted] = useState<boolean>(false);

  // Common fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Patient fields
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Female");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [allergies, setAllergies] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Doctor credentialing fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("General Dentistry");
  const [yearsOfExperience, setYearsOfExperience] = useState("5+ years");
  const [consultationFee, setConsultationFee] = useState(90);
  const [bio, setBio] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "doctor") setRole("doctor");
    else if (roleParam === "patient") setRole("patient");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (role === "patient") {
        const res = await api.registerPatient({
          full_name: fullName,
          email: email.trim(),
          password,
          phone: phone.trim(),
          date_of_birth: dob,
          gender,
          blood_group: bloodGroup,
          medical_allergies: allergies,
          emergency_contact: emergencyContact,
        });

        const currentUser = await api.getCurrentUser();
        setManualSession(res.access_token, currentUser as any);
        router.push("/patient");
      } else {
        await api.registerDentist({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          license_number: licenseNumber.trim(),
          specialization,
          years_of_experience: yearsOfExperience,
          consultation_fee: Number(consultationFee),
          bio: bio.trim(),
        });

        setDoctorSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
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

      {/* Centered Registration Card */}
      <main className="relative z-10 flex-1 max-w-lg w-full mx-auto px-6 py-8 flex flex-col justify-center items-center my-auto">
        <div className="w-full bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          
          {doctorSubmitted ? (
            <div className="py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Credentials Submitted
                </h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your state dental license has been submitted for review. Operatory access will be activated once verified.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="h-11 px-6 bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs rounded-xl transition-all duration-200 inline-flex items-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white tracking-tight">Sign Up</h1>
                
                {/* Clean Role Toggle */}
                <div className="flex p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      role === "patient"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("doctor")}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      role === "doctor"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctor</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === "doctor" ? "Full Name (e.g. Dr. Alex Vance, DDS)" : "Full Name"}
                    className="w-full h-11 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-11 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200"
                    required
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-11 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200 font-mono"
                    required
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full h-11 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200"
                  />
                </div>

                {/* Patient specifics */}
                {role === "patient" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full h-10 text-[11px] px-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-white transition-all duration-200"
                      />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-10 text-[11px] px-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-white transition-all duration-200"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full h-10 text-[11px] px-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-white transition-all duration-200"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Medical allergies (optional)"
                      className="w-full h-10 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200"
                    />
                  </div>
                )}

                {/* Doctor specifics */}
                {role === "doctor" && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        placeholder="State Dental License #"
                        className="w-full h-10 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-white transition-all duration-200"
                        required
                      />
                      <select
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full h-10 text-xs px-2 rounded-xl bg-slate-950/70 border border-slate-800 text-white focus:outline-none focus:border-white transition-all duration-200"
                      >
                        <option value="General Dentistry">General Dentistry</option>
                        <option value="Orthodontics">Orthodontics</option>
                        <option value="Periodontics">Periodontics</option>
                        <option value="Endodontics">Endodontics</option>
                        <option value="Prosthodontics">Prosthodontics</option>
                        <option value="Oral Surgery">Oral Surgery</option>
                        <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                        placeholder="Experience (e.g. 5+ years)"
                        className="w-full h-10 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-white transition-all duration-200"
                      />
                      <input
                        type="number"
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(Number(e.target.value))}
                        placeholder="Fee ($)"
                        className="w-full h-10 text-xs px-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-white placeholder:text-slate-500 tabular-nums focus:outline-none focus:border-white transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white hover:bg-slate-200 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>{role === "doctor" ? "Submit Credentials" : "Create Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-white hover:text-cyan-400 font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 h-16 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-center text-xs text-slate-500 border-t border-white/5">
        <p>© Dental Connect</p>
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-xs text-slate-400">
          Loading...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
