"use client";

import { useEffect, useState } from "react";

export default function HolidayCreditLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setEmployeeId(id);
    });
  }, [params]);

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}`}
          className="inline-flex items-center text-[#b59628] font-bold hover:underline"
        >
          ← Back to Employee Profile
        </a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">
            Holiday Credit Leave Ledger
          </h1>

          <p className="text-gray-500 mt-2">
            Combined history of Holiday Credits earned and used
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LedgerKpi title="Total Earned" value="0 Days" />

          <LedgerKpi title="Total Used" value="0 Days" />

          <LedgerKpi title="Current Balance" value="0 Days" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#3f4447]">
              Holiday Credit Transactions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Balance is calculated as previous balance plus earned minus used.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-[950px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Remarks</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">To</th>
                  <th className="p-3 text-center">Earned</th>
                  <th className="p-3 text-center">Used</th>
                  <th className="p-3 text-center">Balance</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-500"
                  >
                    No Holiday Credit transactions found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function LedgerKpi({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-6 text-center">
      <p className="text-gray-500 font-medium">{title}</p>

      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">
        {value}
      </h3>
    </div>
  );
}
