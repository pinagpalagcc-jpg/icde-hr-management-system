"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);

    const res = await fetch("/api/employees");
    const employees = await res.json();

    const user = (employees || []).find(
      (e: any) =>
        e.login_username === username.trim() &&
        e.login_password === password.trim() &&
        e.status !== "Inactive"
    );

    if (!user) {
      alert("Invalid username or password.");
      setLoading(false);
      return;
    }

    localStorage.setItem("icde_user_id", user.id);
    localStorage.setItem("icde_user_role", user.user_role || "Staff");

    if (user.must_change_password) {
      window.location.href = `/change-password?employee_id=${user.id}`;
      return;
    }

    window.location.href = String(user.user_role || "").toLowerCase() === "admin" ? "/dashboard" : "/staff";
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center p-6">
      <section className="w-full max-w-5xl bg-white rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#3f4447] text-white p-10 flex flex-col justify-between">
          <div>
            <img src="/icde-logo.png" alt="ICDE Logo" className="w-32 mb-8" />
            <h1 className="text-3xl font-bold mb-4">HR Management System</h1>
            <p className="text-white/80">Admin and Staff secure access portal.</p>
          </div>
        </div>

        <div className="p-10">
          <h2 className="text-3xl font-bold text-[#3f4447] mb-2">Login</h2>
          <p className="text-gray-500 mb-8">Enter username and password.</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-600">Username / Email</label>
              <input autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <input autoComplete="off" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" />
            </div>

            <button onClick={login} disabled={loading} className="w-full bg-[#d2b241] text-white rounded-xl py-3 font-bold">
              {loading ? "Checking..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() => alert("Forgot username or password? Please contact HR Admin. Admin can reset your temporary password from your employee profile.")}
              className="w-full text-[#d2b241] font-semibold text-sm"
            >
              Forgot Username / Password?
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
