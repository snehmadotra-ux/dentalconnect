import { DentalChart, ToothRecord, Dentist, Appointment, Prescription, User } from "@/types/dental";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const ZITADEL_ISSUER = process.env.NEXT_PUBLIC_ZITADEL_ISSUER || "http://localhost:8080";
const ZITADEL_CLIENT_ID = process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || "dentalconnect-frontend";

export interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  medical_allergies?: string;
  past_dental_history?: string;
}

export interface AdminStats {
  total_patients: number;
  total_dentists: number;
  total_appointments: number;
  total_prescriptions: number;
  active_caries_detected: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "ADMIN" | "DENTIST" | "PATIENT" | "STAFF";
  is_active: number | boolean;
  zitadel_id?: string;
  created_at: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("dc_token", token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("dc_token");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("dc_token");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth & Identity
  async login(email: string, password: string) {
    const res = await this.request<{
      access_token: string;
      token_type: string;
      role: string;
      user_id: string;
      full_name: string;
      email: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async registerPatient(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    blood_group?: string;
    emergency_contact?: string;
    medical_allergies?: string;
    past_dental_history?: string;
  }) {
    const res = await this.request<{
      access_token: string;
      token_type: string;
      role: string;
      user_id: string;
      full_name: string;
      email: string;
    }>("/auth/register/patient", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async registerDentist(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    license_number: string;
    specialization: string;
    years_of_experience?: string;
    bio?: string;
    consultation_fee?: number;
  }) {
    const res = await this.request<{
      access_token: string;
      token_type: string;
      role: string;
      user_id: string;
      full_name: string;
      email: string;
    }>("/auth/register/dentist", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getCurrentUser() {
    return this.request<User & {
      patient_profile?: PatientProfile;
      dentist_profile?: Record<string, any>;
    }>("/auth/me");
  }

  async syncProfile(data: Record<string, any>) {
    return this.request<{ status: string; message: string }>("/auth/sync", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getZitadelLoginUrl(redirectUri?: string): string {
    const redirect = redirectUri || (typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "http://localhost:3000/auth/callback");
    return `${ZITADEL_ISSUER}/oauth/v2/authorize?client_id=${encodeURIComponent(
      ZITADEL_CLIENT_ID
    )}&response_type=code&scope=openid%20profile%20email%20urn:zitadel:iam:org:project:roles&redirect_uri=${encodeURIComponent(
      redirect
    )}`;
  }

  // Patients
  async getPatients(): Promise<PatientProfile[]> {
    return this.request<PatientProfile[]>("/patients/");
  }

  async getPatient(patientId: string): Promise<PatientProfile> {
    return this.request<PatientProfile>(`/patients/${patientId}`);
  }

  // Dentists
  async getDentists(): Promise<Dentist[]> {
    return this.request<Dentist[]>("/dentists/");
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>("/appointments/");
  }

  async bookAppointment(data: {
    dentist_id: string;
    patient_id?: string;
    start_time: string;
    end_time: string;
    reason: string;
    clinical_notes?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>("/appointments/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(id: string, status: string, clinical_notes?: string): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, clinical_notes }),
    });
  }

  // Dental Chart & Odontogram
  async getPatientChart(patientId: string): Promise<DentalChart> {
    return this.request<DentalChart>(`/charts/patients/${patientId}`);
  }

  async updateTooth(
    patientId: string,
    toothNumber: number,
    update: {
      condition?: string;
      surfaces?: string | null;
      notes?: string | null;
    }
  ): Promise<ToothRecord> {
    return this.request<ToothRecord>(`/charts/patients/${patientId}/teeth/${toothNumber}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
  }

  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    return this.request<Prescription[]>("/prescriptions/");
  }

  async createPrescription(data: {
    patient_id: string;
    appointment_id?: string;
    clinical_notes?: string;
    items: {
      medication_name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[];
  }): Promise<Prescription> {
    return this.request<Prescription>("/prescriptions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Admin
  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>("/admin/stats");
  }

  async getAdminUsers(): Promise<AdminUser[]> {
    return this.request<AdminUser[]>("/admin/users");
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.request<{ status: string; is_active: boolean }>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  // Practitioner Invitations
  async validateInvite(token: string) {
    return this.request<{
      email: string;
      full_name: string;
      role: string;
      specialization: string;
    }>(`/auth/invitations/${token}`);
  }

  async registerWithInvite(data: {
    token: string;
    password: string;
    full_name: string;
    phone?: string;
    license_number: string;
    specialization?: string;
    years_of_experience?: string;
    bio?: string;
    consultation_fee?: number;
  }) {
    const res = await this.request<{
      access_token: string;
      token_type: string;
      role: string;
      user_id: string;
      full_name: string;
      email: string;
    }>("/auth/register/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    return res;
  }

  async createInvitation(data: {
    email: string;
    full_name: string;
    role?: string;
    specialization?: string;
  }) {
    return this.request<{
      id: string;
      token: string;
      email: string;
      role: string;
      invite_url: string;
      expires_at: string;
    }>("/admin/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listInvitations() {
    return this.request<
      {
        id: string;
        email: string;
        full_name: string;
        role: string;
        specialization: string;
        token: string;
        expires_at: string;
        used_at: string | null;
        created_at: string;
      }[]
    >("/admin/invitations");
  }
}

export const api = new ApiClient();
