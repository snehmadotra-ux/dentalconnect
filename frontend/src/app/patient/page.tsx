"use client";

import React, { useState, useEffect } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { api } from "@/lib/api";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { DentalChart } from "@/components/odontogram/DentalChart";
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
  HeartPulse,
  Loader2,
} from "lucide-react";

export default function PatientPage() {
  // Strict Route Guard: Only PATIENT allowed
  const { isAuthorized, user, isLoading } = useRoleGuard(["PATIENT"]);

  const [activeTab, setActiveTab] = useState<"CHART" | "APPOINTMENTS" | "PRESCRIPTIONS">("CHART");
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
      } finally {
        setLoadingData(false);
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
    } catch (err: any) {
      alert(err.message || "Failed to book appointment");
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="text-sm font-semibold">Verifying Patient Portal Access...</p>
      </div>
    );
  }

  const cariesCount = teeth.filter((t) => t.condition === "CARIES").length;
  const healthyCount = teeth.filter((t) => t.condition === "HEALTHY").length;

  const navTabs = [
    { id: "CHART", label: "My Dental Odontogram", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "APPOINTMENTS", label: `My Visits (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: "PRESCRIPTIONS", label: `Prescriptions (${prescriptions.length})`, icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Patient Greeting & Health Alert Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-400/20">
                <HeartPulse className="w-3.5 h-3.5" />
                Patient Health Portal • Verified Patient
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.full_name || "Patient"}
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Review your 32-tooth odontogram dental chart, scheduled visits, and official medication prescriptions from your clinical team.
              </p>

              {user?.patient_profile?.medical_allergies && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Clinical Allergy Alert: {user.patient_profile.medical_allergies}</span>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Book Consultation
              </button>
            </div>
          </div>
        </div>

        {/* Clinical KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Sound Teeth</p>
              <h4 className="text-xl font-bold text-slate-900">{healthyCount || 24} / 32</h4>
              <p className="text-[11px] text-emerald-600 font-medium">Optimal Hygiene</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Decay</p>
              <h4 className="text-xl font-bold text-slate-900">{cariesCount} Teeth</h4>
              <p className="text-[11px] text-rose-600 font-medium">{cariesCount > 0 ? "Requires Treatment" : "None Detected"}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Appointments</p>
              <h4 className="text-xl font-bold text-slate-900">{appointments.length} Scheduled</h4>
              <p className="text-[11px] text-sky-600 font-medium">Next visit confirmed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Prescriptions</p>
              <h4 className="text-xl font-bold text-slate-900">{prescriptions.length} Records</h4>
              <p className="text-[11px] text-purple-600 font-medium">Digital Rx Available</p>
            </div>
          </div>
        </div>

        {/* TAB 1: Odontogram */}
        {activeTab === "CHART" && (
          <div className="space-y-4">
            <DentalChart
              teeth={teeth}
              patientId={user?.patient_profile?.id || user?.id || "patient-1"}
              isDentist={false} // Patient view is view-only
            />
          </div>
        )}

        {/* TAB 2: Appointments */}
        {activeTab === "APPOINTMENTS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Your Scheduled Visits</h3>
                <p className="text-xs text-slate-500">Upcoming visits with dental practitioners</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Book Appointment
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-slate-200/80 space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">No scheduled appointments</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have any upcoming clinical consultations booked.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          {a.status}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-2">{a.reason}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Dentist: <span className="font-semibold text-slate-700">{a.dentist_name || "Doctor"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>{new Date(a.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span>{new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>

                    {a.clinical_notes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                        Doctor Notes: {a.clinical_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Prescriptions */}
        {activeTab === "PRESCRIPTIONS" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Prescribed Medications</h3>
              <p className="text-xs text-slate-500">Official digital prescriptions issued by your dentist</p>
            </div>

            {prescriptions.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl text-center border border-slate-200/80 space-y-3">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-700">No active prescriptions</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When your dentist prescribes dental pain management or antibiotics, they will appear here.
                </p>
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
        onClose={() => setIsBookingOpen(false)}
        dentists={dentists}
        onBook={handleBookAppointment}
      />
    </div>
  );
}
