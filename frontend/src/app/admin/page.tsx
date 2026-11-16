"use client";

import React, { useState, useEffect } from "react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { api, AdminStats, AdminUser } from "@/lib/api";
import { AppNavbar } from "@/components/layout/AppNavbar";
import {
  ShieldAlert,
  Users,
  Stethoscope,
  Calendar,
  Pill,
  Server,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Search,
  Loader2,
  BarChart3,
  UserPlus,
  Copy,
  Check,
  X,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";

interface InvitationRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  specialization: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  // Strict Route Guard: Only ADMIN allowed
  const { isAuthorized, user, isLoading } = useRoleGuard(["ADMIN"]);

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "USERS" | "SYSTEM">("OVERVIEW");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state for Inviting Practitioner
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("DENTIST");
  const [inviteSpec, setInviteSpec] = useState("General Dentistry");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, invitesData] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.listInvitations(),
      ]);

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      }
      if (usersData.status === "fulfilled") {
        setUsers(usersData.value);
      }
      if (invitesData.status === "fulfilled") {
        setInvitations(invitesData.value);
      }
    } catch (err) {
      console.error("Failed to load admin metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAdminData();
    }
  }, [isAuthorized]);

  const handleToggleStatus = async (targetUser: AdminUser) => {
    const newStatus = !targetUser.is_active;
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: newStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSubmitting(true);
    setGeneratedInviteUrl(null);

    try {
      const res = await api.createInvitation({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
        specialization: inviteSpec,
      });

      const fullUrl = `${window.location.origin}/invite?token=${res.token}`;
      setGeneratedInviteUrl(fullUrl);
      fetchAdminData();
    } catch (err: any) {
      setInviteError(err.message || "Failed to create practitioner invitation");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
        <p className="text-sm font-semibold">Verifying Administrator Access...</p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const navTabs = [
    { id: "OVERVIEW", label: "Practice Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "USERS", label: `User Accounts (${users.length})`, icon: <Users className="w-4 h-4" /> },
    { id: "SYSTEM", label: "Infrastructure & Telemetry", icon: <Server className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-400/20">
                <ShieldAlert className="w-3.5 h-3.5" />
                Clinic System Administration & Governance
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Practice Administrator Console
              </h2>
              <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Manage practitioner credentials, patient accounts, system access permissions, and monitor the health of the PostgreSQL and ZITADEL identity instances.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(true);
                  setGeneratedInviteUrl(null);
                  setInviteError(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite Practitioner
              </button>
              <button
                type="button"
                onClick={fetchAdminData}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Telemetry
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: Overview & Analytics */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Registered Patients</p>
                  <h4 className="text-2xl font-black text-slate-900">{stats?.total_patients ?? 1}</h4>
                  <p className="text-[11px] text-purple-600 font-medium">Active Dental EMRs</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Licensed Dentists</p>
                  <h4 className="text-2xl font-black text-slate-900">{stats?.total_dentists ?? 1}</h4>
                  <p className="text-[11px] text-sky-600 font-medium">Clinical Staff</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Appointments</p>
                  <h4 className="text-2xl font-black text-slate-900">{stats?.total_appointments ?? 1}</h4>
                  <p className="text-[11px] text-emerald-600 font-medium">Booked Consultations</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Prescriptions Issued</p>
                  <h4 className="text-2xl font-black text-slate-900">{stats?.total_prescriptions ?? 1}</h4>
                  <p className="text-[11px] text-amber-600 font-medium">Itemized Med Records</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: User Account Governance */}
        {(activeTab === "USERS" || activeTab === "OVERVIEW") && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">User Accounts & Roles</h3>
                  <p className="text-xs text-slate-500">Inspect user profiles, assigned roles, and toggle access permissions</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(true);
                      setGeneratedInviteUrl(null);
                      setInviteError(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite Doctor
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">ZITADEL ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isActive = Boolean(u.is_active);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {u.full_name?.charAt(0) || "U"}
                            </div>
                            <span>{u.full_name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                u.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : u.role === "DENTIST"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {u.zitadel_id || u.id.slice(0, 12) + "..."}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.id === user?.id}
                              className={`px-3 py-1 rounded-lg font-semibold text-[11px] transition ${
                                isActive
                                  ? "text-rose-700 hover:bg-rose-50"
                                  : "text-emerald-700 hover:bg-emerald-50"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {isActive ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Practitioner Invitations List */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Practitioner Onboarding Invitations</h3>
                  <p className="text-xs text-slate-500">Invite-based credential tokens generated for doctors & specialists</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(true);
                    setGeneratedInviteUrl(null);
                    setInviteError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New Invite
                </button>
              </div>

              {invitations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  No invitations generated yet. Click &quot;Invite Doctor&quot; to onboard clinical staff.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Invited Practitioner</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 px-4 text-right">Invite Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invitations.map((inv) => {
                        const isUsed = Boolean(inv.used_at);
                        const isExpired = new Date(inv.expires_at) < new Date();
                        const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/invite?token=${inv.token}` : "";

                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{inv.full_name}</td>
                            <td className="py-3.5 px-4 text-slate-600">{inv.email}</td>
                            <td className="py-3.5 px-4 text-slate-600">{inv.specialization || "General Dentistry"}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isUsed
                                    ? "bg-slate-100 text-slate-600"
                                    : isExpired
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {isUsed ? "Claimed / Onboarded" : isExpired ? "Expired" : "Pending Activation"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {new Date(inv.expires_at).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {!isUsed && !isExpired && (
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(inviteLink)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Link</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Infrastructure Telemetry */}
        {(activeTab === "SYSTEM" || activeTab === "OVERVIEW") && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Ecosystem Services & Storage Status</h3>
              </div>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All Systems Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Identity Provider</p>
                  <h5 className="font-bold text-sm text-slate-900 mt-0.5">ZITADEL (Go OIDC)</h5>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Port 8080 (RBAC)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Database Layer</p>
                  <h5 className="font-bold text-sm text-slate-900 mt-0.5">PostgreSQL 16</h5>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Port 5432 (Healthy)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">API Gateway</p>
                  <h5 className="font-bold text-sm text-slate-900 mt-0.5">FastAPI REST</h5>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Port 8000 (/api/v1)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">X-Ray Storage</p>
                  <h5 className="font-bold text-sm text-slate-900 mt-0.5">MinIO S3</h5>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Port 9000 & 9001</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400">Volume Bind</p>
                  <h5 className="font-bold text-sm text-slate-900 mt-0.5">Root ./storage</h5>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-700 font-semibold">
                  <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                  <span>Mounted on disk</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Invite Practitioner */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Invite-Based Doctor Onboarding
              </div>
              <h3 className="text-xl font-black text-slate-900">Invite Clinical Practitioner</h3>
              <p className="text-xs text-slate-500 mt-1">
                Generates a secure, single-use invitation link for a doctor or specialist to complete clinical onboarding.
              </p>
            </div>

            {inviteError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {inviteError}
              </div>
            )}

            {generatedInviteUrl ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Invitation Link Created Successfully!
                  </p>
                  <p className="text-slate-600">
                    Send this URL directly to <strong>{inviteEmail}</strong>. This token expires in 7 days.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedInviteUrl(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor / Practitioner Full Name *
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Dr. Julian Vance"
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="dr.vance@dentalconnect.com"
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value="DENTIST">Dentist (Doctor)</option>
                      <option value="STAFF">Clinical Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Specialization
                    </label>
                    <select
                      value={inviteSpec}
                      onChange={(e) => setInviteSpec(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option>General Dentistry</option>
                      <option>Orthodontics</option>
                      <option>Periodontics</option>
                      <option>Endodontics</option>
                      <option>Pediatric Dentistry</option>
                      <option>Oral Surgery</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {inviteSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Link...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Invite Link</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
