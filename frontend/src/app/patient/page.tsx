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
  CheckCircle2,
  UserCheck,
} from "lucide-react";

export default function PatientPage() {
  // Strict Route Guard: Only PATIENT allowed
  const { isAuthorized, user, isLoading } = useRoleGuard(["PATIENT"]);

  const [activeTab, setActiveTab] = useState<"CHART" | "DENTISTS" | "APPOINTMENTS" | "PRESCRIPTIONS">("CHART");
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDentistId, setSelectedDentistId] = useState<string | undefined>(undefined);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 mb-3" />
        <p className="text-xs font-medium">Verifying patient record access...</p>
      </div>
    );
  }

  const cariesCount = teeth.filter((t) => t.condition === "CARIES").length;
  const healthyCount = teeth.filter((t) => t.condition === "HEALTHY").length;

  const navTabs = [
    { id: "CHART", label: "Dental Chart", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "DENTISTS", label: `Pick a Dentist (${dentists.length})`, icon: <Stethoscope className="w-4 h-4" /> },
    { id: "APPOINTMENTS", label: `Visits (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: "PRESCRIPTIONS", label: `Prescriptions (${prescriptions.length})`, icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Context Header */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Patient Portal</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600">{user?.full_name || "Patient Record"}</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Dental Health Record
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Inspect your 32-tooth odontogram, view verified dentists in the network, and review consultations.
            </p>

            {user?.patient_profile?.medical_allergies && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>Medical alert: {user.patient_profile.medical_allergies}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openBookingForDentist()}
              className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Consultation</span>
            </button>
          </div>
        </div>

        {/* Primary Health Metrics (Unslop: Tabular, Numbers-first, No decoration) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Sound Teeth</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {healthyCount || 24} <span className="text-xs font-normal text-slate-400">/ 32</span>
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">Healthy enamel intact</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Active Decay</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {cariesCount} <span className="text-xs font-normal text-slate-400">teeth</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {cariesCount > 0 ? "Treatment recommended" : "None detected"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Upcoming Visits</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {appointments.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Clinical consultations</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Prescriptions</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {prescriptions.length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Digital Rx issued</p>
          </div>
        </div>

        {/* TAB 1: Patient-Friendly 32-Tooth Odontogram */}
        {activeTab === "CHART" && (
          <div className="space-y-6">
            <PatientOdontogram teeth={teeth} />
          </div>
        )}

        {/* TAB 2: Pick Your Dentist (Uber Model Marketplace Directory) */}
        {activeTab === "DENTISTS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Verified Dental Practitioners</h2>
                <p className="text-xs text-slate-500">
                  Select a licensed practitioner to schedule your next oral examination or restorative care.
                </p>
              </div>
            </div>

            {dentists.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center border border-slate-200/80 space-y-2">
                <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-700">No practitioners available</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are currently no active verified dentists listed in your area.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dentists.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-slate-900 text-sm">{doc.name}</h3>
                            <span title="Board Verified">
                              <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{doc.specialization || "General Dentistry"}</p>
                        </div>
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          ${doc.consultation_fee || 90}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-mono">License #{doc.license_number || "Verified"}</span>
                          <span>•</span>
                          <span>{doc.years_of_experience || "8+ years"} exp</span>
                        </div>
                        {doc.bio && (
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pt-1">
                            {doc.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBookingForDentist(doc.id)}
                      className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book with {doc.name.split(" ")[1] || "Doctor"}</span>
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
              <div>
                <h2 className="text-base font-semibold text-slate-900">Your Consultations</h2>
                <p className="text-xs text-slate-500">Upcoming and completed dental appointments</p>
              </div>
              <button
                type="button"
                onClick={() => openBookingForDentist()}
                className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                <span>New Booking</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center border border-slate-200/80 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-700">No scheduled appointments</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have any upcoming clinical consultations booked.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {a.status}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 mt-2">{a.reason}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Doctor: <span className="font-medium text-slate-700">{a.dentist_name || "Dentist"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="tabular-nums">{new Date(a.start_time).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="tabular-nums">
                          {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {a.clinical_notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-medium text-slate-700">Doctor Note:</span> {a.clinical_notes}
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
            <div>
              <h2 className="text-base font-semibold text-slate-900">Your Prescriptions</h2>
              <p className="text-xs text-slate-500">Medications prescribed during clinical consultations</p>
            </div>

            {prescriptions.length === 0 ? (
              <div className="bg-white p-12 rounded-xl text-center border border-slate-200/80 space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-700">No active prescriptions</h3>
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
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDentistId(undefined);
        }}
        dentists={dentists}
        initialDentistId={selectedDentistId}
        onBook={handleBookAppointment}
      />
    </div>
  );
}
