"use client";

import React, { useState, useEffect } from "react";
import { Dentist } from "@/types/dental";
import { X, Calendar } from "lucide-react";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dentists: Dentist[];
  initialDentistId?: string;
  onBook: (data: {
    dentist_id: string;
    start_time: string;
    end_time: string;
    reason: string;
    clinical_notes?: string;
  }) => Promise<void>;
}

const REASONS = [
  "Comprehensive Dental Exam & Cleaning",
  "Toothache / Emergency Evaluation",
  "Cavity Filling (Composite / Restorative)",
  "Root Canal Therapy Consultation",
  "Crown / Bridge / Veneer Evaluation",
  "Orthodontics & Clear Aligners",
  "Wisdom Tooth Extraction Consultation",
  "Teeth Whitening & Aesthetics",
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  dentists,
  initialDentistId,
  onBook,
}) => {
  if (!isOpen) return null;

  const [dentistId, setDentistId] = useState(
    initialDentistId || dentists[0]?.id || ""
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDentistId) {
      setDentistId(initialDentistId);
    } else if (dentists[0]?.id && !dentistId) {
      setDentistId(dentists[0].id);
    }
  }, [initialDentistId, dentists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startDateTime = new Date(`${date}T${time}:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + 45 * 60 * 1000); // 45 min slot

      await onBook({
        dentist_id: dentistId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        reason,
        clinical_notes: notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Book Dental Consultation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Choose your practitioner and schedule your appointment</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Dentist Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Select Dentist
            </label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              required
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialization} (${d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Reason for Consultation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">
                Preferred Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-10 text-xs rounded-lg border border-slate-300 px-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                required
              />
            </div>
          </div>

          {/* Symptoms / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">
              Symptoms or Clinical Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe symptoms, sensitivity, or prior treatment..."
              rows={3}
              className="w-full text-xs rounded-lg border border-slate-300 p-3 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
