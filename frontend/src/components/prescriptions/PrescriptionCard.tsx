"use client";

import React from "react";
import { Prescription } from "@/types/dental";
import { Pill, FileText, Calendar, CheckCircle2 } from "lucide-react";

interface PrescriptionCardProps {
  prescription: Prescription;
}

export const PrescriptionCard: React.FC<PrescriptionCardProps> = ({ prescription }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition">
      <div className="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Pill className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Prescription from {prescription.dentist_name || "Dental Specialist"}
              </h4>
              <p className="text-xs text-slate-500">
                Issued for {prescription.patient_name || "Patient"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(prescription.issued_at).toLocaleDateString()}</span>
        </div>
      </div>

      {prescription.clinical_notes && (
        <div className="my-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Clinical Advice: </span>
          {prescription.clinical_notes}
        </div>
      )}

      {/* Medications Table */}
      <div className="mt-4 space-y-3">
        {prescription.items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-start justify-between p-3.5 bg-sky-50/30 rounded-2xl border border-sky-100/60"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{item.medication_name}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                  {item.dosage}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-medium">Frequency:</span> {item.frequency} •{" "}
                <span className="font-medium">Duration:</span> {item.duration}
              </p>
              {item.instructions && (
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  Note: {item.instructions}
                </p>
              )}
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};
