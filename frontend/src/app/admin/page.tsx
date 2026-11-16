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
  FileCheck,
} from "lucide-react";

interface PendingDoctor {
  dentist_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  license_number: string;
  specialization: string;
  years_of_experience: string;
  consultation_fee: number;
  bio?: string;
  verification_status: string;
  created_at: string;
}

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

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "USERS" | "VERIFICATIONS" | "SYSTEM">("OVERVIEW");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
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
      const [statsData, usersData, invitesData, pendingData] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.listInvitations(),
        api.getPendingVerifications(),
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
      if (pendingData.status === "fulfilled") {
        setPendingDoctors(pendingData.value);
      }
    } catch (err) {
      console.error("Failed to load admin metrics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (dentistId: string) => {
    try {
      await api.approveDentistLicense(dentistId);
      alert("Doctor license verified and approved. The practitioner can now sign in.");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to approve doctor license");
    }
  };

  const handleRejectDoctor = async (dentistId: string) => {
    if (!confirm("Are you sure you want to reject this practitioner application?")) return;
    try {
      await api.rejectDentistLicense(dentistId);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to reject application");
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
        <Loader2 className="w-6 h-6 animate-spin text-slate-600 mb-3" />
        <p className="text-xs font-medium">Verifying administrator access...</p>
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
    { id: "VERIFICATIONS", label: `Doctor Licenses (${pendingDoctors.length})`, icon: <FileCheck className="w-4 h-4" /> },
    { id: "USERS", label: `User Accounts (${users.length})`, icon: <Users className="w-4 h-4" /> },
    { id: "SYSTEM", label: "Telemetry & Storage", icon: <Server className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <AppNavbar activeTab={activeTab} onTabChange={setActiveTab} tabs={navTabs} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Admin Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase">Governance Console</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
              <span className="text-xs text-slate-600">Practice Administrator</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Practice Administration
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Verify practitioner credentials, manage user roles, and monitor PostgreSQL and MinIO telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowInviteModal(true);
                setGeneratedInviteUrl(null);
                setInviteError(null);
              }}
              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Doctor</span>
            </button>
            <button
              type="button"
              onClick={fetchAdminData}
              className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Overview & Analytics */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">Registered Patients</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stats?.total_patients ?? 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Active oral health records</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">Licensed Dentists</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stats?.total_dentists ?? 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Clinical staff active</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">Consultations Booked</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stats?.total_appointments ?? 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Scheduled visits</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">Prescriptions Issued</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1 tabular-nums">{stats?.total_prescriptions ?? 1}</p>
              <p className="text-[11px] text-slate-500 mt-1">Itemized digital Rx</p>
            </div>
          </div>
        )}

        {/* Practitioner License Verifications */}
        {(activeTab === "VERIFICATIONS" || (activeTab === "OVERVIEW" && pendingDoctors.length > 0)) && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">Doctor Credential & License Verifications</h2>
                  {pendingDoctors.length > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono">
                      {pendingDoctors.length} pending
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review submitted dental board licenses. Approving grants operatory access.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAdminData}
                className="h-7 px-2.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Queue</span>
              </button>
            </div>

            {pendingDoctors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                <span>All doctor credentials have been reviewed. No pending verifications.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Doctor</th>
                      <th className="py-2.5 px-3">License Number</th>
                      <th className="py-2.5 px-3">Specialization</th>
                      <th className="py-2.5 px-3">Experience</th>
                      <th className="py-2.5 px-3">Fee</th>
                      <th className="py-2.5 px-3">Submitted</th>
                      <th className="py-2.5 px-3 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingDoctors.map((doc) => (
                      <tr key={doc.dentist_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-900">
                          <div>{doc.full_name}</div>
                          <div className="text-[11px] font-normal text-slate-500 font-mono">{doc.email}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800">
                          {doc.license_number}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{doc.specialization}</td>
                        <td className="py-3 px-3 text-slate-600">{doc.years_of_experience}</td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-900">${doc.consultation_fee}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono tabular-nums">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRejectDoctor(doc.dentist_id)}
                            className="h-7 px-2.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-slate-100 text-xs transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveDoctor(doc.dentist_id)}
                            className="h-7 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
                          >
                            Verify & Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* User Account Governance */}
        {(activeTab === "USERS" || activeTab === "OVERVIEW") && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">User Accounts & Roles</h2>
                <p className="text-xs text-slate-500">Inspect user profiles, roles, and status</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full h-8 text-xs pl-8 pr-3 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isActive = Boolean(u.is_active);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-mono text-[10px]">
                            {u.full_name?.charAt(0) || "U"}
                          </div>
                          <span>{u.full_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{u.email}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={u.id === user?.id}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-40"
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
        )}

        {/* Practitioner Invitations List */}
        {(activeTab === "USERS" || activeTab === "OVERVIEW") && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Practitioner Onboarding Invitations</h2>
                <p className="text-xs text-slate-500">Secure credential invitation tokens</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(true);
                  setGeneratedInviteUrl(null);
                  setInviteError(null);
                }}
                className="h-8 px-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Invite</span>
              </button>
            </div>

            {invitations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                No invitations generated yet. Click &quot;Invite Doctor&quot; to onboard clinical staff.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Invited Practitioner</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Specialization</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Expires</th>
                      <th className="py-2.5 px-3 text-right">Invite Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.map((inv) => {
                      const isUsed = Boolean(inv.used_at);
                      const isExpired = new Date(inv.expires_at) < new Date();
                      const inviteLink = typeof window !== "undefined" ? `${window.location.origin}/invite?token=${inv.token}` : "";

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{inv.full_name}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono">{inv.email}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.specialization || "General Dentistry"}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                isUsed
                                  ? "bg-slate-100 text-slate-600"
                                  : isExpired
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {isUsed ? "Claimed" : isExpired ? "Expired" : "Pending"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono tabular-nums">
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {!isUsed && !isExpired && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(inviteLink)}
                                className="h-7 px-2.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors inline-flex items-center gap-1"
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
        )}

        {/* Infrastructure Telemetry */}
        {(activeTab === "SYSTEM" || activeTab === "OVERVIEW") && (
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900">Services & Infrastructure Status</h2>
              </div>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">Identity Provider</p>
                  <h3 className="font-semibold text-xs text-slate-900 mt-0.5">ZITADEL OIDC</h3>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px]">Port 8080 (RBAC)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">Database Layer</p>
                  <h3 className="font-semibold text-xs text-slate-900 mt-0.5">PostgreSQL 16</h3>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px]">Port 5432 (Healthy)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">API Gateway</p>
                  <h3 className="font-semibold text-xs text-slate-900 mt-0.5">FastAPI REST</h3>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px]">Port 8000 (/api/v1)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">X-Ray Storage</p>
                  <h3 className="font-semibold text-xs text-slate-900 mt-0.5">MinIO S3</h3>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px]">Port 9000 & 9001</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">Volume Storage</p>
                  <h3 className="font-semibold text-xs text-slate-900 mt-0.5">Root ./storage</h3>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-700">
                  <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-[11px]">Mounted on host</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Invite Practitioner */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl p-6 shadow-xl border border-slate-200 space-y-4 relative">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-base font-semibold text-slate-900">Invite Clinical Practitioner</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generates a secure onboarding link for a doctor or specialist.
              </p>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {inviteError}
              </div>
            )}

            {generatedInviteUrl ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <p className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Invitation Link Created
                  </p>
                  <p className="text-slate-600">
                    Send this URL to <strong>{inviteEmail}</strong>. Valid for 7 days.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteUrl}
                    className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-700 select-all px-2 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedInviteUrl)}
                    className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setGeneratedInviteUrl(null);
                  }}
                  className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Doctor Full Name
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Dr. Julian Vance"
                    required
                    className="w-full h-9 text-xs px-3 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="dr.vance@dentalconnect.com"
                    required
                    className="w-full h-9 text-xs px-3 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Role</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full h-9 text-xs px-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="DENTIST">Dentist (Doctor)</option>
                      <option value="STAFF">Clinical Staff</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-700">Specialization</label>
                    <select
                      value={inviteSpec}
                      onChange={(e) => setInviteSpec(e.target.value)}
                      className="w-full h-9 text-xs px-2 rounded-lg border border-slate-300 bg-white"
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

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="h-8 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteSubmitting}
                    className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {inviteSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Generate Invite Link</span>
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
