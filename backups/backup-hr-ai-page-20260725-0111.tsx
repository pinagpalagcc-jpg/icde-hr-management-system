export default function HRAIAssistantPage() {
  return (
    <div className="flex min-h-screen bg-[#f7f4ec]">

      {/* LEFT SIDEBAR */}
      <aside className="hidden w-72 shrink-0 bg-[#3f4447] text-white md:flex flex-col justify-between p-6">
        <div>
          <div className="mb-10">
            <div className="text-4xl font-black tracking-widest">
              <span className="text-white">IC</span>
              <span className="text-[#d2b241]">D</span>
              <span className="text-white">E</span>
            </div>

            <div className="mt-3 text-sm text-white/90">
              HR Management Portal
            </div>

            <div className="mt-3 h-[3px] w-24 rounded-full bg-[#d2b241]" />
          </div>

          <nav className="space-y-3">
            {[
              ["Dashboard","/dashboard"],
              ["Employees","/employees"],
              ["Messenger","/messenger"],
              ["Leave Requests","/leave-requests"],
              ["Document Expiry","/document-expiry"],
              ["Reports","/reports"],
              ["HR AI Assistant","/hr-ai-assistant"],
            ].map(([name,href])=>(
              <a
                key={name}
                href={href}
                className={`block rounded-xl px-4 py-3 ${
                  name==="HR AI Assistant"
                    ? "bg-[#d2b241] font-semibold text-[#3f4447]"
                    : "hover:bg-white/10"
                }`}
              >
                {name}
              </a>
            ))}
          </nav>
        </div>

        <a
          href="/logout"
          className="block rounded-2xl border border-white/20 py-4 text-center font-semibold hover:bg-white/10"
        >
          Sign Out
        </a>
      </aside>

      {/* AI CHAT LIST */}
      <aside className="w-80 border-r bg-white">
        <div className="border-b p-5">
          <button className="w-full rounded-xl bg-[#d2b241] py-3 font-semibold">
            + New Chat
          </button>
        </div>

        <div className="p-4">
          <div className="rounded-xl border p-4">
            Today's Chat
          </div>
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className="flex flex-1 flex-col bg-[#efeae2]">

        <header className="border-b bg-white px-6 py-4">
          <h1 className="text-lg font-semibold">
            HR AI Assistant
          </h1>

          <p className="text-sm text-gray-500">
            Ask anything about your HR Management System
          </p>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#3f4447]">
              How can I help you today?
            </h2>

            <p className="mt-3 text-gray-500">
              Ask questions about employees, leave,
              documents, reports and HR records.
            </p>
          </div>
        </div>

        <div className="border-t bg-white p-5">
          <input
            className="w-full rounded-xl border px-5 py-4 outline-none"
            placeholder="Ask anything about your HR system..."
          />
        </div>

      </main>

    </div>
  );
}