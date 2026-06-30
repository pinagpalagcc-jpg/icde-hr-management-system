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
      document.cookie = "icde_auth=" + user.id + "; path=/; max-age=86400; SameSite=Lax";

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
            <div className="mb-12">
            <div className="relative w-72 h-28 flex items-center">
              
              <div className="absolute bottom-5 left-[104px] w-24 h-10 border-b-[16px] border-[#d2b241] rounded-b-full"></div>
            </div>
          </div>
            <div className="mb-12">
            <div className="text-7xl font-serif tracking-widest font-bold leading-none">
              <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
            </div>
            <div className="w-56 h-[4px] bg-[#d2b241] mt-4 rounded-full"></div>
            <div className="text-sm tracking-[0.35em] text-white/80 mt-4">HR MANAGEMENT SYSTEM</div>
          </div>
          <div className="mb-10">
            <div className="text-5xl font-black tracking-widest">
              <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
            </div>
            <h1 className="text-3xl font-bold mt-8 mb-4">HR Management Portal</h1>
            <div className="w-32 h-[3px] bg-[#d2b241] mb-6 rounded-full"></div>
            <p className="text-white/80">Admin and Staff secure access portal.</p>
            <p className="text-white/60 mt-28">@2026 V.1.1</p>
          </div>
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
