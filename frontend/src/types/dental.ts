export type ToothCondition =
  | "HEALTHY"
  | "CARIES"
  | "FILLING"
  | "CROWN"
  | "ROOT_CANAL"
  | "IMPLANT"
  | "MISSING"
  | "EXTRACTION_NEEDED";

export interface ToothRecord {
  id: string;
  chart_id: string;
  tooth_number: number; // 1 - 32 Universal
  condition: ToothCondition;
  surfaces: string | null;
  notes: string | null;
  updated_at: string;
}

export interface DentalChart {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  teeth: ToothRecord[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "PATIENT" | "DENTIST" | "STAFF" | "ADMIN";
}

export interface Dentist {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  license_number: string;
  specialization: string;
  years_of_experience?: string;
  bio?: string;
  consultation_fee: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  dentist_id: string;
  start_time: string;
  end_time: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  reason: string;
  clinical_notes?: string;
  patient_name?: string;
  dentist_name?: string;
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  dentist_id: string;
  appointment_id?: string;
  clinical_notes?: string;
  issued_at: string;
  items: PrescriptionItem[];
  dentist_name?: string;
  patient_name?: string;
}
