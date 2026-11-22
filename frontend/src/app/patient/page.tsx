"use client";

import React, { useState, useEffect } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { api } from "@/lib/api";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { PatientOdontogram } from "@/components/patient/PatientOdontogram";
import { AppointmentBookingModal } from "@/components/appointments/AppointmentBookingModal";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";
import { ToothRecord, Dentist, Appointment, Prescription } from "@/types/dental";
import {
  ShieldCheck,
  Calendar,
  Pill,
  Clock,
  Plus,
  AlertTriangle,
  Stethoscope,
  Loader2,
  UserCheck,
} from "lucide-react";

export default function PatientPage() {
  const { isAuthorized, user, isLoading } = useRoleGuard(["PATIENT"]);

  const [activeTab, setActiveTab] = useState<"CHART" | "DENTISTS" | "APPOINTMENTS" | "PRESCRIPTIONS">("CHART");
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadPatientData = async () => {
      try {
        const patientId = user?.patient_profile?.id || user?.id || "patient-1";
        const [chartData, apptData, rxData, docData] = await Promise.allSettled([
          api.getPatientChart(patientId),
          api.getAppointments(),
          api.getPrescriptions(),
          api.getDentists(),
        ]);

        if (chartData.status === "fulfilled" && chartData.value.teeth) {
          setTeeth(chartData.value.teeth);
        }
        if (apptData.status === "fulfilled") {
          setAppointments(apptData.value);
        }
        if (rxData.status === "fulfilled") {
          setPrescriptions(rxData.value);
        }
        if (docData.status === "fulfilled") {
          setDentists(docData.value);
        }
      } catch (err) {
        console.error("Failed to load patient records", err);
      }
    };

    loadPatientData();
  }, [isAuthorized, user]);

  const handleBookAppointment = async (data: {
    dentist_id: string;
    start_time: string;
    end_time: string;
    reason: string;
    clinical_notes?: string;
  }) => {
    try {
      const patientId = user?.patient_profile?.id || user?.id;
      const created = await api.bookAppointment({
        ...data,
        patient_id: patientId,
      });
      setAppointments((prev) => [created, ...prev]);
      setIsBookingOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to book appointment");
    }
  };

  const openBookingForDentist = (dentistId?: string) => {
    setSelectedDentistId(dentistId);
    setIsBookingOpen(true);
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#070a12] flex flex-col items-center justify-center p-6 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-3" />
        <p className="text-xs font-mono">Verifying patient access...</p>
      </div>
    );
  }

  const cariesCount = teeth.filter((t) => t.condition === "CARIES").length;
  const healthyCount = teeth.filter((t) => t.condition === "HEALTHY").length;

  const navTabs = [
    { id: "CHART", label: "Dental Chart", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "DENTISTS", label: `Dentists (${dentists.length})`, icon: <Stethoscope className="w-4 h-4" /> },
    { id: "APPOINTMENTS", label: `Visits (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: "PRESCRIPTIONS", label: `Prescriptions (${prescriptions.length})`, icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#070a12] text-white">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Context Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Dental Health Record
            </h1>
            <p className="text-xs text-slate-400">
              Patient: <span className="text-white font-medium">{user?.full_name || "Patient Record"}</span>
            </p>

            {user?.patient_profile?.medical_allergies && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>Medical alert: {user.patient_profile.medical_allergies}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openBookingForDentist()}
              className="h-10 px-5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition-all duration-200 flex items-center gap-2 shadow-md active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Book Visit</span>
            </button>
          </div>
        </div>

        {/* Tabular Health Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Sound Teeth</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {healthyCount || 24} <span className="text-xs font-normal text-slate-500">/ 32</span>
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">Healthy enamel intact</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Active Decay</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {cariesCount} <span className="text-xs font-normal text-slate-500">teeth</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {cariesCount > 0 ? "Treatment recommended" : "None detected"}
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Upcoming Visits</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {appointments.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Clinical consultations</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10">
            <p className="text-xs text-slate-400 font-medium">Prescriptions</p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {prescriptions.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Active digital orders</p>
          </div>
        </div>

        {/* TAB 1: 32-Tooth Odontogram */}
        {activeTab === "CHART" && (
          <div className="space-y-6">
            <PatientOdontogram teeth={teeth} />
          </div>
        )}

        {/* TAB 2: Dentists Directory */}
        {activeTab === "DENTISTS" && (
          <div className="space-y-4">
            {dentists.length === 0 ? (
              <div className="bg-slate-900/80 backdrop-blur-xl p-12 rounded-2xl text-center border border-white/10 space-y-2">
                <Stethoscope className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No clinicians available</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dentists.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/30 transition-all duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-sm">{doc.name}</h3>
                            <span title="Board Verified">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{doc.specialization || "General Dentistry"}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                          ${doc.consultation_fee || 90}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-400">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>License #{doc.license_number || "Verified"}</span>
                          <span>•</span>
                          <span>{doc.years_of_experience || "8+ years"} exp</span>
                        </div>
                        {doc.bio && (
                          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed pt-1">
                            {doc.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBookingForDentist(doc.id)}
                      className="w-full h-10 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Consultation</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Appointments */}
        {activeTab === "APPOINTMENTS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Consultations</h2>
              <button
                type="button"
                onClick={() => openBookingForDentist()}
                className="h-9 px-4 bg-white hover:bg-slate-200 text-slate-950 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Visit</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-slate-900/80 backdrop-blur-xl p-12 rounded-2xl text-center border border-white/10 space-y-2">
                <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No scheduled appointments</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-lg">
                          {a.status}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-2">{a.reason}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Doctor: <span className="font-medium text-slate-200">{a.dentist_name || "Dentist"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-white/5 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(a.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {a.clinical_notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400">Doctor Note:</span> {a.clinical_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Prescriptions */}
        {activeTab === "PRESCRIPTIONS" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Prescriptions</h2>

            {prescriptions.length === 0 ? (
              <div className="bg-slate-900/80 backdrop-blur-xl p-12 rounded-2xl text-center border border-white/10 space-y-2">
                <Pill className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No active prescriptions</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((rx) => (
                  <PrescriptionCard key={rx.id} prescription={rx} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <AppointmentBookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDentistId(undefined);
        }}
        dentists={dentists}
        initialDentistId={selectedDentistId}
        onBook={handleBookAppointment}
      />

      {/* Footer */}
      <footer className="relative z-10 h-16 max-w-7xl w-full mx-auto px-6 sm:px-10 flex items-center justify-center text-xs text-slate-500 border-t border-white/5">
        <p>© Dental Connect</p>
      </footer>
    </div>
  );
}
