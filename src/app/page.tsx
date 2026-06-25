import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <section className="bg-[#3f4447] text-white p-10 flex flex-col justify-center">
          <div className="text-4xl font-bold tracking-widest mb-5">
            IC<span className="text-[#d2b241]">D</span>E
          </div>
          <h1 className="text-3xl font-bold mb-3">HR Management System</h1>
          <p className="text-gray-200">People. Performance. Excellence.</p>
          <div className="mt-8 h-1 w-28 bg-[#d2b241] rounded-full" />
        </section>

        <section className="p-10">
          <h2 className="text-3xl font-bold text-[#3f4447] mb-2">Login Portal</h2>
          <p className="text-gray-500 mb-8">Enter your credentials to continue</p>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-600">Email Address</label>
              <div className="mt-2 flex items-center border rounded-xl px-4 py-3">
                <Mail size={18} className="text-gray-400 mr-3" />
                <input className="w-full outline-none" placeholder="admin@icde.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <div className="mt-2 flex items-center border rounded-xl px-4 py-3">
                <Lock size={18} className="text-gray-400 mr-3" />
                <input type="password" className="w-full outline-none" placeholder="Enter password" />
              </div>
            </div>

            <a href="/dashboard" className="block text-center bg-[#d2b241] text-white font-bold py-3 rounded-xl hover:opacity-90">
              Login
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
