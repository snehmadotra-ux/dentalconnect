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
  FileText,
  FileCheck,
  DollarSign,
  Phone,
  UserCheck,
  Check,
  ArrowRight,
} from "lucide-react";

interface TreatmentRecordItem {
  id: string;
  patient_id: string;
  dentist_id: string;
  dentist_name?: string;
  appointment_id?: string;
  tooth_number?: number;
  procedure_code: string;
  description: string;
  fee: number;
  status: string;
  notes?: string;
  performed_at: string;
}

interface ClinicalDocumentItem {
  id: string;
  patient_id: string;
  dentist_id?: string;
  dentist_name?: string;
  category: string;
  title: string;
  file_name: string;
  s3_key: string;
  mime_type?: string;
  file_size?: number;
  notes?: string;
  uploaded_at: string;
}

const COMMON_CDT_CODES = [
  { code: "D0120", desc: "Periodic Oral Evaluation", fee: 65 },
  { code: "D0150", desc: "Comprehensive Oral Evaluation", fee: 110 },
  { code: "D0210", desc: "Intraoral - Complete Series of Radiographs", fee: 140 },
  { code: "D0274", desc: "Bitewings - Four Radiographic Images", fee: 75 },
  { code: "D1110", desc: "Prophylaxis - Adult Dental Cleaning", fee: 95 },
  { code: "D2140", desc: "Amalgam - One Surface, Posterior", fee: 145 },
  { code: "D2391", desc: "Resin-Based Composite - One Surface, Posterior", fee: 185 },
  { code: "D2740", desc: "Crown - Porcelain/Ceramic Substrate", fee: 850 },
  { code: "D3330", desc: "Endodontic Therapy - Molar Tooth", fee: 950 },
  { code: "D4341", desc: "Periodontal Scaling and Root Planing", fee: 220 },
  { code: "D7140", desc: "Extraction, Erupted Tooth or Exposed Root", fee: 175 },
];

export default function DoctorPage() {
  // Strict Route Guard: Only DENTIST allowed
  const { isAuthorized, user, isLoading } = useRoleGuard(["DENTIST"]);

  const [activeTab, setActiveTab] = useState<"TIMELINE" | "CHART" | "TREATMENTS" | "DOCUMENTS" | "PRESCRIPTIONS">("TIMELINE");
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [teeth, setTeeth] = useState<ToothRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [treatments, setTreatments] = useState<TreatmentRecordItem[]>([]);
  const [documents, setDocuments] = useState<ClinicalDocumentItem[]>([]);

  // Prescribe modal
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxNotes, setRxNotes] = useState("");
  const [rxItems, setRxItems] = useState([
    { medication_name: "Amoxicillin 500mg", dosage: "500mg", frequency: "Three times daily (every 8 hrs)", duration: "7 days", instructions: "Take with food and full glass of water" }
  ]);
  const [submittingRx, setSubmittingRx] = useState(false);

  // Procedure Ledger Modal
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [procTooth, setProcTooth] = useState<number | "">("");
  const [procCode, setProcCode] = useState("D0120");
  const [procDesc, setProcDesc] = useState("Periodic Oral Evaluation");
  const [procFee, setProcFee] = useState<number>(65);
  const [procStatus, setProcStatus] = useState("COMPLETED");
  const [procNotes, setProcNotes] = useState("");
  const [submittingProc, setSubmittingProc] = useState(false);

  // Document Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docCategory, setDocCategory] = useState("RADIOGRAPH");
  const [docTitle, setDocTitle] = useState("Intraoral Bitewing Radiographs");
  const [docFileName, setDocFileName] = useState("bitewings-quad1-2.png");
  const [docNotes, setDocNotes] = useState("");
  const [submittingDoc, setSubmittingDoc] = useState(false);

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
          const firstPatient = patList.value[0];
          setSelectedPatient(firstPatient);
          loadPatientClinicalData(firstPatient.id);
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

  const loadPatientClinicalData = async (patientId: string) => {
    try {
      const [chartData, treatData, docData] = await Promise.allSettled([
        api.getPatientChart(patientId),
        api.getPatientTreatments(patientId),
        api.getPatientDocuments(patientId),
      ]);

      if (chartData.status === "fulfilled" && chartData.value?.teeth) {
        setTeeth(chartData.value.teeth);
      } else {
        setTeeth([]);
      }

      if (treatData.status === "fulfilled") {
        setTreatments(treatData.value as any);
      } else {
        setTreatments([]);
      }

      if (docData.status === "fulfilled") {
        setDocuments(docData.value as any);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Failed to load patient clinical data", err);
    }
  };

  const handleSelectPatient = (patient: PatientProfile) => {
    setSelectedPatient(patient);
    loadPatientClinicalData(patient.id);
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

  const handleLogProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmittingProc(true);
    try {
      const created = await api.createTreatmentRecord({
        patient_id: selectedPatient.id,
        tooth_number: procTooth ? Number(procTooth) : undefined,
        procedure_code: procCode,
        description: procDesc,
        fee: procFee,
        status: procStatus,
        notes: procNotes,
      });
      setTreatments((prev) => [created, ...prev]);
      setIsProcedureModalOpen(false);
      setProcNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to log procedure");
    } finally {
      setSubmittingProc(false);
    }
  };

  const handleLogDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmittingDoc(true);
    try {
      const created = await api.createDocumentRecord({
        patient_id: selectedPatient.id,
        category: docCategory,
        title: docTitle,
        file_name: docFileName,
        s3_key: `clinical/${selectedPatient.id}/${Date.now()}_${docFileName}`,
        notes: docNotes,
      });
      setDocuments((prev) => [created, ...prev]);
      setIsDocModalOpen(false);
      setDocNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to record clinical document");
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleUpdateApptStatus = async (
    id: string,
    status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      const updated = await api.updateAppointmentStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));

      // If seated in chair (IN_PROGRESS), automatically load patient into chairside dossier
      if (status === "IN_PROGRESS") {
        const matchingPatient = patients.find((p) => p.id === updated.patient_id);
        if (matchingPatient) {
          handleSelectPatient(matchingPatient);
          setActiveTab("CHART");
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to update appointment");
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 mb-3" />
        <p className="text-xs font-medium">Verifying practitioner license...</p>
      </div>
    );
  }

  // Daily Calculations
  const inChairAppointment = appointments.find((a) => a.status === "IN_PROGRESS");
  const completedTodayCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const upcomingTodayCount = appointments.filter(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED"
  ).length;
  const totalProductionToday = treatments
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + (t.fee || 0), 0);

  const navTabs = [
    { id: "TIMELINE", label: `Today's Schedule (${appointments.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: "CHART", label: "Odontogram Charting", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "TREATMENTS", label: `Treatment Ledger (${treatments.length})`, icon: <DollarSign className="w-4 h-4" /> },
    { id: "DOCUMENTS", label: `Clinical Records (${documents.length})`, icon: <FileText className="w-4 h-4" /> },
    { id: "PRESCRIPTIONS", label: `Digital Rx (${prescriptions.length})`, icon: <Pill className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Doctor Header Banner with Paired Receptionist Info */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Operatory Chair 1</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-slate-600">
                {user?.dentist_profile?.full_name || user?.full_name || "Practitioner"} (License #{user?.dentist_profile?.license_number || "Verified"})
              </span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Today&apos;s Clinical Practice
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Chairside patient queue, anatomical 32-tooth odontogram charting, procedure billing ledgers, and digital prescriptions.
            </p>
          </div>

          {/* Paired Receptionist Desk Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-800">Practice Front Desk</span>
                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  Reception
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">Elena Rostova, Desk Coordinator</p>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>+1 (555) 019-4412 (Ext. 102)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium block">
                Desk Active
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Handles Calls & Reschedules</span>
            </div>
          </div>
        </div>

        {/* Doctor's Day Overview Metrics (How their day looks like) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Today&apos;s Appointments</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {appointments.length}{" "}
              <span className="text-xs font-normal text-slate-400">scheduled</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {upcomingTodayCount} waiting / upcoming
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Chair Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  inChairAppointment ? "bg-sky-600 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <p className="text-sm font-semibold text-slate-900 truncate">
                {inChairAppointment
                  ? `${inChairAppointment.patient_name || "Patient in Chair"}`
                  : "Chair Vacant (Ready)"}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {inChairAppointment ? "Active Consultation" : "Awaiting next patient check-in"}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Completed Visits</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              {completedTodayCount}{" "}
              <span className="text-xs font-normal text-slate-400">patients</span>
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">Discharged & documented</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80">
            <p className="text-xs text-slate-500 font-medium">Today&apos;s Completed Production</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">
              ${totalProductionToday}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Billable ADA CDT procedures</p>
          </div>
        </div>

        {/* Chairside Active Patient Dossier */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Chairside Patient Dossier</h2>
              <span className="text-xs font-mono text-slate-400">({patients.length} patients on file)</span>
            </div>

            {/* Switch Active Patient dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Active Patient:</span>
              <select
                value={selectedPatient?.id || ""}
                onChange={(e) => {
                  const pat = patients.find((p) => p.id === e.target.value);
                  if (pat) handleSelectPatient(pat);
                }}
                className="h-8 text-xs font-medium rounded-lg border border-slate-300 px-2.5 bg-white text-slate-800 focus:outline-none focus:border-slate-900 transition-colors"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.gender || "Patient"}, {p.date_of_birth ? `${new Date().getFullYear() - new Date(p.date_of_birth).getFullYear()} yrs` : "Adult"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPatient ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Patient</p>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedPatient.full_name}</p>
                <p className="text-slate-500 mt-0.5 font-mono">{selectedPatient.email}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Demographics</p>
                <p className="text-slate-700 mt-0.5">
                  {selectedPatient.gender || "Unspecified"} • Blood {selectedPatient.blood_group || "O+"}
                </p>
                <p className="text-slate-500 mt-0.5">DOB: {selectedPatient.date_of_birth || "Recorded on file"}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Emergency Contact</p>
                <p className="text-slate-700 mt-0.5">{selectedPatient.emergency_contact || "Primary Contact On File"}</p>
                <p className="text-slate-500 mt-0.5 font-mono">{selectedPatient.phone || "—"}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 font-medium">Medical Allergies & Alerts</p>
                {selectedPatient.medical_allergies ? (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-medium text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{selectedPatient.medical_allergies}</span>
                  </div>
                ) : (
                  <p className="text-emerald-700 mt-0.5 font-medium">No clinical allergies reported</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No patient currently selected.</p>
          )}
        </div>

        {/* TAB 1: Today's Schedule Timeline Ribbon (Doctor's Day Schedule) */}
        {activeTab === "TIMELINE" && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Curated Operatory Feed</h2>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Curated by Front Desk
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your daily sequence is managed and ordered by the reception desk. Patients are checked in upon arrival and placed in chair order.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Next Up / Active Operatory Callout Box */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {inChairAppointment ? "Active Operatory Case" : "Next In Operatory"}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${inChairAppointment ? "bg-sky-600 animate-pulse" : "bg-emerald-500"}`} />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {inChairAppointment
                    ? `${inChairAppointment.patient_name || "Patient in Chair"} (Currently Seated)`
                    : appointments.find((a) => a.status !== "COMPLETED")
                    ? `${appointments.find((a) => a.status !== "COMPLETED")?.patient_name} (Ready in Waiting Room)`
                    : "No further patients queued for today"}
                </h3>
                <p className="text-slate-500 text-[11px]">
                  {inChairAppointment
                    ? `Reason: ${inChairAppointment.reason}. Charting and procedure ledger active.`
                    : "Receptionist has verified patient check-in and updated clinical history."}
                </p>
              </div>

              <div>
                {inChairAppointment ? (
                  <button
                    type="button"
                    onClick={() => {
                      const pat = patients.find((p) => p.id === inChairAppointment.patient_id);
                      if (pat) handleSelectPatient(pat);
                      setActiveTab("CHART");
                    }}
                    className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View In-Chair Chart</span>
                  </button>
                ) : appointments.find((a) => a.status !== "COMPLETED") ? (
                  <button
                    type="button"
                    onClick={() => {
                      const nextAppt = appointments.find((a) => a.status !== "COMPLETED");
                      if (nextAppt) handleUpdateApptStatus(nextAppt.id, "IN_PROGRESS");
                    }}
                    className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Seat Next Patient (In Chair)</span>
                  </button>
                ) : null}
              </div>
            </div>

            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">No appointments scheduled today</p>
                <p>New appointments booked by patients will appear in this chair sequence.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((a, idx) => {
                  const isInChair = a.status === "IN_PROGRESS";
                  const isCompleted = a.status === "COMPLETED";

                  return (
                    <div
                      key={a.id}
                      className={`p-4 rounded-lg border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                        isInChair
                          ? "bg-sky-50/40 border-sky-300 shadow-2xs"
                          : isCompleted
                          ? "bg-slate-50/60 border-slate-200/60 opacity-80"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      {/* Left: Time Slot & Patient Identity */}
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-12 rounded-md bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 font-mono">
                          <span className="text-[10px] text-slate-500">SLOT {idx + 1}</span>
                          <span className="text-xs font-semibold text-slate-900 tabular-nums">
                            {new Date(a.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              {a.patient_name || "Patient Record"}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                isInChair
                                  ? "bg-sky-100 text-sky-800 border-sky-200 font-medium"
                                  : isCompleted
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {isInChair ? "IN CHAIR" : a.status}
                            </span>
                          </div>

                          <p className="text-slate-600 font-medium">{a.reason}</p>

                          {a.clinical_notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              Patient / Desk Note: {a.clinical_notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {!isInChair && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleUpdateApptStatus(a.id, "IN_PROGRESS")}
                            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Seat Patient (In Chair)</span>
                          </button>
                        )}

                        {isInChair && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const pat = patients.find((p) => p.id === a.patient_id);
                                if (pat) handleSelectPatient(pat);
                                setActiveTab("CHART");
                              }}
                              className="h-8 px-3 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Open Odontogram</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateApptStatus(a.id, "COMPLETED")}
                              className="h-8 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete & Discharge</span>
                            </button>
                          </>
                        )}

                        {isCompleted && (
                          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Consultation Discharged</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: 32-Tooth Odontogram Charting */}
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

        {/* TAB 3: ADA Treatment Ledger */}
        {activeTab === "TREATMENTS" && selectedPatient && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Clinical Treatment Ledger</h2>
                <p className="text-xs text-slate-500">
                  Recorded procedures, ADA CDT diagnostic codes, and fee billing ledger for {selectedPatient.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProcedureModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Procedure</span>
              </button>
            </div>

            {treatments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">No procedures logged for this patient</p>
                <p>Click &quot;Log Procedure&quot; to add restorative, preventive, or surgical entries to this chart.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-medium">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Tooth</th>
                      <th className="py-2.5 px-3">CDT Code</th>
                      <th className="py-2.5 px-3">Procedure Description</th>
                      <th className="py-2.5 px-3">Fee</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {treatments.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500">
                          {new Date(t.performed_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                          {t.tooth_number ? `#${t.tooth_number}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {t.procedure_code}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 font-medium">{t.description}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-900 font-medium">
                          ${t.fee}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            t.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                          {t.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Clinical Documents Store */}
        {activeTab === "DOCUMENTS" && selectedPatient && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Diagnostic Radiographs & Documents</h2>
                <p className="text-xs text-slate-500">
                  Bitewings, periapical X-rays, panoramic scans, and informed consents for {selectedPatient.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">No radiographic scans on file</p>
                <p>Upload intraoral radiographs or consent forms to attach them to the patient&apos;s chart.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-lg border border-slate-200/80 bg-slate-50 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-xs mt-2">{doc.title}</h3>
                      <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{doc.file_name}</p>
                      {doc.notes && (
                        <p className="text-xs text-slate-600 italic mt-2 border-t border-slate-200/60 pt-2">
                          &ldquo;{doc.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Digital Prescriptions */}
        {activeTab === "PRESCRIPTIONS" && selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Digital Prescriptions</h2>
                <p className="text-xs text-slate-500">Issued medications and pharmacy orders for this patient</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write Digital Rx</span>
              </button>
            </div>

            {prescriptions.filter((p) => p.patient_id === selectedPatient.id).length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center text-xs text-slate-500 space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-700">No prescriptions issued for this patient</p>
                <p>Click &quot;Write Digital Rx&quot; to issue analgesics, antibiotics, or oral rinses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions
                  .filter((p) => p.patient_id === selectedPatient.id)
                  .map((rx) => (
                    <PrescriptionCard key={rx.id} prescription={rx} />
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Log Procedure Modal */}
      {isProcedureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Log Clinical Procedure (ADA CDT)</h3>
                <p className="text-xs text-slate-500">Append entry to {selectedPatient?.full_name}&apos;s treatment ledger</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProcedureModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogProcedure} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Tooth # (1–32)</label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    placeholder="e.g. 19"
                    value={procTooth}
                    onChange={(e) => setProcTooth(e.target.value ? Number(e.target.value) : "")}
                    className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">Status</label>
                  <select
                    value={procStatus}
                    onChange={(e) => setProcStatus(e.target.value)}
                    className="w-full h-9 text-xs rounded-lg border border-slate-300 px-2 bg-white"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">ADA CDT Procedure Code</label>
                <select
                  value={procCode}
                  onChange={(e) => {
                    const sel = COMMON_CDT_CODES.find((c) => c.code === e.target.value);
                    setProcCode(e.target.value);
                    if (sel) {
                      setProcDesc(sel.desc);
                      setProcFee(sel.fee);
                    }
                  }}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-2 bg-white"
                >
                  {COMMON_CDT_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.desc} (${c.fee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Procedure Description</label>
                <input
                  type="text"
                  value={procDesc}
                  onChange={(e) => setProcDesc(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Fee (USD)</label>
                <input
                  type="number"
                  value={procFee}
                  onChange={(e) => setProcFee(Number(e.target.value))}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={procNotes}
                  onChange={(e) => setProcNotes(e.target.value)}
                  placeholder="e.g. Local anesthesia 2% lidocaine 1:100k epi. Shade A2 composite..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProcedureModalOpen(false)}
                  className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProc}
                  className="h-8 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {submittingProc ? "Saving..." : "Save to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Attach Clinical Document</h3>
                <p className="text-xs text-slate-500">Record radiographic scan or consent for {selectedPatient?.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogDocument} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-2 bg-white"
                >
                  <option value="RADIOGRAPH">Intraoral Radiograph / Bitewing</option>
                  <option value="PANORAMIC">Panoramic Orthopantomogram (OPG)</option>
                  <option value="CBCT">Cone Beam 3D Scan (CBCT)</option>
                  <option value="CONSENT">Informed Consent Form</option>
                  <option value="LAB_SLIP">Dental Laboratory Slip</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">File Name</label>
                <input
                  type="text"
                  value={docFileName}
                  onChange={(e) => setDocFileName(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Diagnostic Findings / Notes</label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Incipient interproximal enamel radiolucency noted on mesial #14..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoc}
                  className="h-8 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {submittingDoc ? "Recording..." : "Record Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Rx Modal */}
      {isRxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Digital Dental Prescription Pad</h3>
                <p className="text-xs text-slate-500">Issue official prescription for {selectedPatient?.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssuePrescription} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700">Clinical Advice / Notes</label>
                <input
                  type="text"
                  value={rxNotes}
                  onChange={(e) => setRxNotes(e.target.value)}
                  placeholder="e.g. For post-operative infection prevention following extraction."
                  className="w-full h-9 text-xs rounded-lg border border-slate-300 px-3"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Medications</span>
                  <button
                    type="button"
                    onClick={handleAddRxItem}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                  >
                    + Add Drug
                  </button>
                </div>

                {rxItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Drug name (e.g. Amoxicillin)"
                        value={item.medication_name}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].medication_name = e.target.value;
                          setRxItems(updated);
                        }}
                        className="h-8 px-2 rounded-md border border-slate-300 bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 500mg)"
                        value={item.dosage}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].dosage = e.target.value;
                          setRxItems(updated);
                        }}
                        className="h-8 px-2 rounded-md border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Frequency (e.g. TID q8h)"
                        value={item.frequency}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].frequency = e.target.value;
                          setRxItems(updated);
                        }}
                        className="h-8 px-2 rounded-md border border-slate-300 bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Duration (e.g. 7 days)"
                        value={item.duration}
                        onChange={(e) => {
                          const updated = [...rxItems];
                          updated[idx].duration = e.target.value;
                          setRxItems(updated);
                        }}
                        className="h-8 px-2 rounded-md border border-slate-300 bg-white"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRxModalOpen(false)}
                  className="h-8 px-3 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRx}
                  className="h-8 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  {submittingRx ? "Signing..." : "Issue Digital Rx"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
