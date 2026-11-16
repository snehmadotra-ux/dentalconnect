"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  HeartPulse,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  FileBadge,
  User,
  Stethoscope,
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
          email,
          password,
          phone,
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
          email,
          password,
          full_name: fullName,
          phone,
          license_number: licenseNumber,
          specialization,
          years_of_experience: yearsOfExperience,
          consultation_fee: Number(consultationFee),
          bio,
        });

        setDoctorSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please review your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafafa] text-slate-900">
      {/* Left Brand Panel */}
      <div className="md:w-5/12 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight">DentalConnect</span>
              <span className="block text-[11px] text-slate-400">Two-Sided Platform</span>
            </div>
          </Link>

          <div className="pt-8 space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create Your Account
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Patients receive instant access to their 32-tooth odontogram and network booking. Dental practitioners submit verified board credentials for administrative review.
            </p>
          </div>

          <div className="pt-8 space-y-3 border-t border-slate-800">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <User className="w-4 h-4 text-slate-400" />
              <span>Patients: Instant self-booking and oral care tracking</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Stethoscope className="w-4 h-4 text-slate-400" />
              <span>Dentists: Chairside 32-tooth EMR and procedure ledger</span>
            </div>
          </div>
        </div>

        <div className="pt-6 text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-white hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="max-w-xl w-full bg-white p-8 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
          {doctorSubmitted ? (
            /* Doctor Credentialing Submitted Screen */
            <div className="py-8 space-y-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center mx-auto">
                <FileBadge className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Credentials Submitted for Review
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="font-medium text-slate-900">{fullName}</span>. Your state dental license (<span className="font-mono text-slate-900">{licenseNumber}</span>) has been queued for administrative credentialing review.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span>Administrative Verification Protocol</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  To maintain healthcare integrity, practice administrators review state dental board registry records before opening operatory access. Once approved, you can log in immediately.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors inline-flex items-center"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Role Toggle */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setRole("patient")}
                    className={`h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      role === "patient"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("doctor")}
                    className={`h-8 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      role === "doctor"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Dental Practitioner</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Basic Account Information */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={role === "doctor" ? "e.g. Dr. Alex Mercer, DDS" : "e.g. Jane Doe"}
                      className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Patient-specific Fields */}
                {role === "patient" && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Date of Birth</label>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-2 bg-white"
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-2 bg-white"
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
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Medical Allergies (if any)</label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        placeholder="e.g. Penicillin, Latex, Local Anesthetics (or None)"
                        className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Emergency Contact</label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="e.g. Michael Doe (Spouse) - (555) 987-6543"
                        className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Doctor-specific Fields */}
                {role === "doctor" && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">State Dental License #</label>
                        <input
                          type="text"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          placeholder="e.g. DDS-88219-CA"
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white font-mono"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Specialization</label>
                        <select
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-2 bg-white"
                        >
                          <option value="General Dentistry">General Dentistry</option>
                          <option value="Orthodontics">Orthodontics</option>
                          <option value="Periodontics">Periodontics</option>
                          <option value="Endodontics">Endodontics</option>
                          <option value="Prosthodontics">Prosthodontics</option>
                          <option value="Oral & Maxillofacial Surgery">Oral & Maxillofacial Surgery</option>
                          <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Years of Experience</label>
                        <input
                          type="text"
                          value={yearsOfExperience}
                          onChange={(e) => setYearsOfExperience(e.target.value)}
                          placeholder="e.g. 8+ years"
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-slate-700">Consultation Fee ($ USD)</label>
                        <input
                          type="number"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(Number(e.target.value))}
                          placeholder="90"
                          className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white tabular-nums"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-slate-700">Professional Bio</label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Describe your clinical training, university degree, hospital residency, or clinical philosophy..."
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-lg font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  <span>
                    {loading
                      ? "Registering..."
                      : role === "doctor"
                      ? "Submit Credentials for Verification"
                      : "Create Patient Account"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
          Loading...
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
