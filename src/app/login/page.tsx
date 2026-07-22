"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  useEffect(() => {
    localStorage.removeItem("icde_user_id");
    localStorage.removeItem("icde_user_role");
    document.cookie = "icde_auth=; path=/; max-age=0";
  }, []);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(
          result.error ||
            "Invalid username or password."
        );
        return;
      }

      const user = result.user;

      localStorage.setItem(
        "icde_user_id",
        user.id
      );

      localStorage.setItem(
        "icde_user_role",
        user.role
      );

      if (user.mustChangePassword) {
        window.location.href =
          `/change-password?employee_id=${user.id}`;
        return;
      }

      window.location.href =
        user.role === "Admin"
          ? "/dashboard"
          : "/staff";
    } catch {
      alert("Unable to complete login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex items-center justify-center p-6">
      <section className="w-full max-w-5xl bg-white rounded-3xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#3f4447] text-white p-12 flex flex-col justify-center">
          <div className="text-7xl font-serif tracking-widest font-bold leading-none">
            <span className="text-white">IC</span>
            <span className="text-[#d2b241]">D</span>
            <span className="text-white">E</span>
          </div>

          <div className="w-32 h-[4px] bg-[#d2b241] mt-6 rounded-full"></div>

          <h1 className="text-3xl font-bold mt-10 mb-3">HR Management Portal</h1>
          <p className="text-white/80">Admin and Staff secure access portal.</p>
          <p className="text-white/60 mt-10">©2026 V.1.1</p>
        </div>

        <div className="p-10">
          <h2 className="text-3xl font-bold text-[#3f4447] mb-2">Login</h2>
          <p className="text-gray-500 mb-8">Enter username and password.</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-600">Username / Email</label>
              <input
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <input
                autoComplete="off"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3 outline-none"
              />
            </div>

            <button
              onClick={login}
              disabled={loading}
              className="w-full bg-[#d2b241] text-white rounded-xl py-3 font-bold"
            >
              {loading ? "Checking..." : "Login"}
            </button>

            <button
              type="button"
              onClick={() =>
                alert("Forgot username or password? Please contact HR Admin. Admin can reset your temporary password from your employee profile.")
              }
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
