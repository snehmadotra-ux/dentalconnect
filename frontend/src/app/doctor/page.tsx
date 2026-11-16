"use client";

import React, { useState, useEffect } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { api, PatientProfile } from "@/lib/api";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { DentalChart } from "@/components/odontogram/DentalChart";
import { PrescriptionCard } from "@/components/prescriptions/PrescriptionCard";
import { ToothRecord, Appointment, Prescription } from "@/types/dental";
import {
  Stethoscope,
  Users,
  Calendar,
  Pill,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";

export default function DoctorPage() {
  // Strict Route Guard: Only DENTIST allowed
  const { isAuthorized, user, isLoading } = useRoleGuard(["DENTIST"]);

  const [activeTab, setActiveTab] = useState<"CHART" | "SCHEDULE" | "PRESCRIPTIONS">("CHART");
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  // Prescribe modal
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxNotes, setRxNotes] = useState("");
  const [rxItems, setRxItems] = useState([
    { medication_name: "Amoxicillin 500mg", dosage: "500mg", frequency: "Three times daily (every 8 hrs)", duration: "7 days", instructions: "Take after food with full glass of water" }
  ]);
  const [submittingRx, setSubmittingRx] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;

    const loadDoctorWorkspace = async () => {
      try {
        const [patList, apptList, rxList] = await Promise.allSettled([
          api.getPatients(),
          api.getAppointments(),
          api.getPrescriptions(),
        ]);

        if (patList.status === "fulfilled" && patList.value.length > 0) {
          setPatients(patList.value);
          setSelectedPatient(patList.value[0]);
          const chart = await api.getPatientChart(patList.value[0].id).catch(() => null);
          if (chart?.teeth) setTeeth(chart.teeth);
        }

        if (apptList.status === "fulfilled") {
          setAppointments(apptList.value);
        }

        if (rxList.status === "fulfilled") {
          setPrescriptions(rxList.value);
        }
      } catch (err) {
        console.error("Failed to load doctor workspace", err);
      }
    };

    loadDoctorWorkspace();
  }, [isAuthorized]);

  const handleSelectPatient = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    try {
      const chart = await api.getPatientChart(patient.id);
      if (chart?.teeth) setTeeth(chart.teeth);
    } catch (err) {
      console.error("Failed to load patient chart", err);
    }
  };

  const handleToothUpdated = (updatedTooth: ToothRecord) => {
    setTeeth((prev) =>
      prev.map((t) => (t.tooth_number === updatedTooth.tooth_number ? updatedTooth : t))
    );
  };

  const handleAddRxItem = () => {
    setRxItems([
      ...rxItems,
      { medication_name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]);
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmittingRx(true);
    try {
      const created = await api.createPrescription({
        patient_id: selectedPatient.id,
        clinical_notes: rxNotes,
        items: rxItems,
      });
      setPrescriptions((prev) => [created, ...prev]);
      setIsRxModalOpen(false);
      setRxNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to issue prescription");
    } finally {
      setSubmittingRx(false);
    }
  };

  const handleUpdateApptStatus = async (id: string, status: string) => {
    try {
      const updated = await api.updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err: any) {
      alert(err.message || "Failed to update appointment");
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-3" />
        <p className="text-sm font-semibold">Verifying Clinical Doctor Permissions...</p>
      </div>
    );
  }

  const navTabs = [
    { id: "CHART", label: "Odontogram Charting", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "SCHEDULE", label: `Appointments (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: "PRESCRIPTIONS", label: `Digital Rx (${prescriptions.length})`, icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Doctor Header Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-3 border border-sky-400/20">
                <Stethoscope className="w-3.5 h-3.5" />
                Licensed Clinical Practitioner Workspace
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.full_name || "Doctor Workspace"}
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Examine patient dentition, mark active decay or restorations on the 32-tooth odontogram, manage appointments, and issue digital prescriptions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/25 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Prescribe Medication
              </button>
            </div>
          </div>
        </div>

        {/* Patient Selection Queue Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Patient Chart</p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {
                    const pat = patients.find((p) => p.id === e.target.value);
                    if (pat) handleSelectPatient(pat);
                  }}
                  className="text-sm font-bold text-slate-900 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.gender || "Patient"}, {p.date_of_birth || "DOB Not Set"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedPatient && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                Blood Group: <strong className="text-slate-900">{selectedPatient.blood_group || "O+"}</strong>
              </span>
              {selectedPatient.medical_allergies && (
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Allergies: {selectedPatient.medical_allergies}
                </span>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: Interactive Odontogram */}
        {activeTab === "CHART" && selectedPatient && (
          <div className="space-y-4">
            <DentalChart
              teeth={teeth}
              patientId={selectedPatient.id}
              isDentist={true}
              onToothUpdated={handleToothUpdated}
            />
          </div>
        )}

        {/* TAB 2: Appointment Schedule */}
        {activeTab === "SCHEDULE" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Patient Appointments & Daily Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                        {a.status}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{a.reason}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Patient: <span className="font-semibold text-slate-700">{a.patient_name || "Alex Miller"}</span>
                      </p>
                    </div>

                    <select
                      value={a.status}
                      onChange={(e) => handleUpdateApptStatus(a.id, e.target.value)}
                      className="text-xs font-semibold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    >
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span>{new Date(a.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-sky-600" />
                      <span>{new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {a.clinical_notes && (
                    <p className="text-xs text-slate-500 italic bg-sky-50/40 p-3 rounded-xl border border-sky-100/60">
                      Notes: {a.clinical_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Prescriptions */}
        {activeTab === "PRESCRIPTIONS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Issued Clinical Prescriptions</h3>
                <p className="text-xs text-slate-500">Itemized medications and administration instructions</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Write Prescription
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prescriptions.map((rx) => (
                <PrescriptionCard key={rx.id} prescription={rx} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Write Prescription Modal */}
      {isRxModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Issue Digital Prescription</h3>
                <p className="text-xs text-sky-100 mt-1">
                  Prescribing for Patient: {selectedPatient.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssuePrescription} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Clinical Advice / Diagnostic Notes
                </label>
                <textarea
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  placeholder="e.g. Post-operative pain management following root canal therapy on tooth #19..."
                  rows={2}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Medication Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRxItem}
                    className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                {rxItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medication Name</label>
                        <input
                          type="text"
                          value={item.medication_name}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].medication_name = e.target.value;
                            setRxItems(updated);
                          }}
                          placeholder="e.g. Ibuprofen 600mg"
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].dosage = e.target.value;
                            setRxItems(updated);
                          }}
                          placeholder="e.g. 600mg"
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].frequency = e.target.value;
                            setRxItems(updated);
                          }}
                          placeholder="e.g. Every 8 hours as needed"
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => {
                            const updated = [...rxItems];
                            updated[idx].duration = e.target.value;
                            setRxItems(updated);
                          }}
                          placeholder="e.g. 5 days"
                          required
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Special Instructions</label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].instructions = e.target.value;
                          setRxItems(updated);
                        }}
                        placeholder="e.g. Take with food. Do not exceed 2400mg daily."
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingRx ? "Signing Prescription..." : "Sign & Issue Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
