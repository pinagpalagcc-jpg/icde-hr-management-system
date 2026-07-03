"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ChangePasswordPage() {
  const searchParams = useSearchParams();

  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = searchParams.get("employee_id") || "";
    setEmployeeId(id);

    if (id) {
      fetch(`/api/employees/${id}`)
        .then((r) => r.json())
        .then((data) => setEmployee(data))
        .catch(() => setEmployee(null));
    }
  }, [searchParams]);

  async function changePassword() {
    if (saving) return;

    if (!employeeId) {
      alert("Employee account not found.");
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setSaving(true);

    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login_password: newPassword,
        must_change_password: false,
        status: employee?.status || "Available",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Password change failed.");
      setSaving(false);
      return;
    }

    const role = result.user_role || employee?.user_role || "Staff";

    localStorage.setItem("icde_user_id", employeeId);
    localStorage.setItem("icde_user_role", role);
    document.cookie = "icde_auth=" + employeeId + "; path=/; max-age=86400; SameSite=Lax";

    alert("Password changed successfully.");
    window.location.href = String(role).toLowerCase() === "admin" ? "/dashboard" : "/staff";
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center p-6">
      <section className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-10">
        <h1 className="text-3xl font-bold text-[#3f4447] mb-2">Change Password</h1>
        <p className="text-gray-500 mb-8">Create your new password before continuing.</p>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-600">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full border rounded-xl px-4 py-3 outline-none"
            />
          </div>

          <button
            onClick={changePassword}
            disabled={saving}
            className="w-full bg-[#d2b241] text-white rounded-xl py-3 font-bold disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save New Password"}
          </button>
        </div>
      </section>
    </div>
  );
}
