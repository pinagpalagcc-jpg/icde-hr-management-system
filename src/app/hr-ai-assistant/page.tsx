export default function HRAIAssistantPage() {
  const menu = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Messenger", "/messenger"],
    ["Leave Requests", "/leave-requests"],
    ["Document Expiry", "/document-expiry"],
    ["Reports", "/reports"],
    ["HR AI Assistant", "/hr-ai-assistant"],
  ];

  const examples = [
    "How many employees are on leave in August?",
    "Which employees have visa expiry within 30 days?",
    "Show me all employees with pending documents.",
    "Which department has the highest sick leave this year?",
  ];

  return (
    <div className="flex min-h-screen bg-[#f7f4ec]">

      <aside className="hidden w-72 shrink-0 bg-[#3f4447] p-6 text-white md:flex md:flex-col md:justify-between">

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
            {menu.map(([name, href]) => (
              <a
                key={name}
                href={href}
                className={`block rounded-xl px-4 py-3 ${
                  name === "HR AI Assistant"
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
          className="block w-full rounded-2xl border border-white/25 py-4 text-center font-semibold hover:bg-white/10"
        >
          Sign Out
        </a>

      </aside>

      <main className="flex flex-1 flex-col">

        <div className="border-b bg-white px-6 py-4">
          <h1 className="text-xl font-semibold text-[#3f4447]">
            HR AI Assistant
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Ask questions about your HR Management System.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8">

          <div className="mx-auto max-w-4xl">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="flex items-center gap-3 border-b p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2b241] text-xl">
                  🤖
                </div>

                <div>
                  <div className="font-semibold text-[#3f4447]">
                    HR AI Assistant
                  </div>

                  <div className="text-xs text-green-600">
                    Ready
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-8">

                <div className="rounded-2xl bg-[#f7f4ec] p-5">
                  <div className="mb-2 text-sm font-semibold text-[#3f4447]">
                    Welcome
                  </div>

                  <p className="text-sm text-gray-600">
                    Ask me anything about your employees, leave,
                    documents, reports and other HR information.
                  </p>
                </div>

                <div className="space-y-3">
                  {examples.map((item) => (
                    <button
                      key={item}
                      className="block w-full rounded-xl border bg-gray-50 p-4 text-left text-sm hover:bg-gray-100"
                    >
                      {item}
                    </button>
                  ))}
                </div>

              </div>

              <div className="border-t bg-white p-5">

                <div className="flex gap-3">

                  <input
                    className="flex-1 rounded-xl border px-5 py-3 outline-none focus:border-[#d2b241]"
                    placeholder="Ask anything about your HR system..."
                  />

                  <button
                    className="rounded-xl bg-[#d2b241] px-6 font-semibold text-[#3f4447] hover:opacity-90"
                  >
                    Send
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}