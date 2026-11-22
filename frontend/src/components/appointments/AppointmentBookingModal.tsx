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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-white">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Book Dental Consultation</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Dentist Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Select Dentist
            </label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              className="w-full h-11 text-xs rounded-xl border border-slate-800 px-3 bg-slate-950/80 text-white focus:outline-none focus:border-white transition-colors"
              required
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.name} ({d.specialization}, ${d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Reason for Consultation
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-11 text-xs rounded-xl border border-slate-800 px-3 bg-slate-950/80 text-white focus:outline-none focus:border-white transition-colors"
            >
              {REASONS.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full h-11 text-xs rounded-xl border border-slate-800 px-3 bg-slate-950/80 text-white focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-800 px-3 bg-slate-950/80 text-white focus:outline-none focus:border-white transition-colors"
                required
              />
            </div>
          </div>

          {/* Symptoms / Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Symptoms or Clinical Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe symptoms or sensitivity..."
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-800 p-3 bg-slate-950/80 text-white focus:outline-none focus:border-white transition-colors resize-none placeholder:text-slate-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-xs font-bold text-slate-950 bg-white hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
