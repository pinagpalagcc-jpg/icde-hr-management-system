"use client";

import { useEffect, useState } from "react";

export default function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    searchParams.then((p) => {
      const id = p.employee_id || "";
      setEmployeeId(id);
      if (id) fetch(`/api/employees/${id}`).then((r) => r.json()).then(setEmployee);
    });
  }, [searchParams]);

  async function changePassword() {
    if (!newPassword || newPassword.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login_password: newPassword,
        must_change_password: false,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to change password.");
      return;
    }

    localStorage.setItem("icde_user_id", employeeId);
    localStorage.setItem("icde_user_role", employee?.user_role || "Staff");
  document.cookie = "icde_auth=" + employeeId + "; path=/; max-age=86400; SameSite=Lax";

    alert("Password changed successfully.");

    window.location.href = employee?.user_role === "Admin" ? "/dashboard" : "/staff";
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center p-6">
      <section className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-10">
        <h1 className="text-3xl font-bold text-[#3f4447] mb-2">Change Password</h1>
        <p className="text-gray-500 mb-8">Create your new password before continuing.</p>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-600">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" />
          </div>

          <button onClick={changePassword} className="w-full bg-[#d2b241] text-white rounded-xl py-3 font-bold">
            Save New Password
          </button>
        </div>
      </section>
    </div>
  );
}
