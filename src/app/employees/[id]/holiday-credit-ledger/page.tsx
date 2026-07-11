"use client";

import { useEffect, useMemo, useState } from "react";

type HolidayCreditTransaction = {
  id: string;
  employee_id: string;
  transaction_date: string;
  remarks: string;
  from_date?: string | null;
  to_date?: string | null;
  earned_days: number | string;
  used_days: number | string;
  balance_after: number | string;
  entry_type: "Earned" | "Used" | "Adjustment";
  created_at?: string;
};

type EarnedForm = {
  transaction_date: string;
  from_date: string;
  to_date: string;
  earned_days: string;
  remarks: string;
};

const EMPTY_FORM: EarnedForm = {
  transaction_date: "",
  from_date: "",
  to_date: "",
  earned_days: "",
  remarks: "",
};

export default function HolidayCreditLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [transactions, setTransactions] = useState<
    HolidayCreditTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<EarnedForm>(EMPTY_FORM);

  useEffect(() => {
    params.then(({ id }) => {
      setEmployeeId(id);
      loadTransactions(id);
    });
  }, [params]);

  async function loadTransactions(id: string) {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/holiday-credit-transactions?employee_id=${encodeURIComponent(
          id
        )}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to load Holiday Credit Ledger."
        );
      }

      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTransactions([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load Holiday Credit Ledger."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalEarned = useMemo(
    () =>
      transactions.reduce(
        (total, transaction) =>
          total + Number(transaction.earned_days || 0),
        0
      ),
    [transactions]
  );

  const totalUsed = useMemo(
    () =>
      transactions.reduce(
        (total, transaction) =>
          total + Number(transaction.used_days || 0),
        0
      ),
    [transactions]
  );

  const currentBalance = totalEarned - totalUsed;

  const transactionsWithRunningBalance = useMemo(() => {
    let runningBalance = 0;

    return [...transactions]
      .sort((a, b) => {
        const dateA = new Date(
          a.from_date ||
            a.transaction_date ||
            a.created_at ||
            0
        ).getTime();

        const dateB = new Date(
          b.from_date ||
            b.transaction_date ||
            b.created_at ||
            0
        ).getTime();

        if (dateA !== dateB) {
          return dateA - dateB;
        }

        return new Date(a.created_at || 0).getTime() -
          new Date(b.created_at || 0).getTime();
      })
      .map((transaction) => {
        const earned = Number(transaction.earned_days || 0);
        const used = Number(transaction.used_days || 0);

        runningBalance += earned - used;

        return {
          ...transaction,
          calculated_balance: runningBalance,
        };
      });
  }, [transactions]);

  async function addEarnedCredit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/holiday-credit-transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: employeeId,
            transaction_date: form.transaction_date,
            from_date: form.from_date || null,
            to_date: form.to_date || null,
            earned_days: Number(form.earned_days),
            remarks: form.remarks,
            created_by: "Admin",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to add earned credit."
        );
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      setSuccessMessage(
        "Holiday Credit earned entry added successfully."
      );

      await loadTransactions(employeeId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to add earned credit."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatDate(value?: string | null) {
    if (!value) return "-";

    const date = new Date(`${value.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}`}
          className="inline-flex items-center text-[#b59628] font-bold hover:underline"
        >
          ← Back to Employee Profile
        </a>

        <div className="mt-6 mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">
              Holiday Credit Leave Ledger
            </h1>

            <p className="text-gray-500 mt-2">
              Combined history of Holiday Credits earned and used
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="bg-[#d2b241] hover:bg-[#b99a2f] text-white px-5 py-3 rounded-xl font-bold"
          >
            {showForm ? "Close Form" : "+ Add Earned Credit"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
            {successMessage}
          </div>
        ) : null}

        {showForm ? (
          <form
            onSubmit={addEarnedCredit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              Add Earned Holiday Credit
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
              <FormInput
                label="Entry Date"
                type="date"
                value={form.transaction_date}
                required
                onChange={(value) =>
                  setForm({
                    ...form,
                    transaction_date: value,
                  })
                }
              />

              <FormInput
                label="From"
                type="date"
                value={form.from_date}
                onChange={(value) =>
                  setForm({
                    ...form,
                    from_date: value,
                  })
                }
              />

              <FormInput
                label="To"
                type="date"
                value={form.to_date}
                onChange={(value) =>
                  setForm({
                    ...form,
                    to_date: value,
                  })
                }
              />

              <FormInput
                label="Days Earned"
                type="number"
                value={form.earned_days}
                required
                min="0.5"
                step="0.5"
                onChange={(value) =>
                  setForm({
                    ...form,
                    earned_days: value,
                  })
                }
              />

              <FormInput
                label="Remarks"
                type="text"
                value={form.remarks}
                required
                placeholder="Worked on public holiday"
                onChange={(value) =>
                  setForm({
                    ...form,
                    remarks: value,
                  })
                }
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setShowForm(false);
                }}
                className="bg-gray-200 text-[#3f4447] px-5 py-3 rounded-xl font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#3f4447] hover:bg-[#2f3437] disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold"
              >
                {saving ? "Saving..." : "Save Earned Credit"}
              </button>
            </div>
          </form>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LedgerKpi
            title="Total Earned"
            value={`${totalEarned} Days`}
          />

          <LedgerKpi
            title="Total Used"
            value={`${totalUsed} Days`}
          />

          <LedgerKpi
            title="Current Balance"
            value={`${currentBalance} Days`}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#3f4447]">
              Holiday Credit Transactions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Balance equals previous balance plus earned minus used.
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      Loading Holiday Credit transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      No Holiday Credit transactions found.
                    </td>
                  </tr>
                ) : (
                  transactionsWithRunningBalance.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-[#faf8f1]"
                    >
                      <td className="p-3">
                        {formatDate(transaction.transaction_date)}
                      </td>

                      <td className="p-3">
                        {transaction.remarks || "-"}
                      </td>

                      <td className="p-3">
                        {formatDate(transaction.from_date)}
                      </td>

                      <td className="p-3">
                        {formatDate(transaction.to_date)}
                      </td>

                      <td className="p-3 text-center font-bold text-green-700">
                        {Number(transaction.earned_days || 0)}
                      </td>

                      <td className="p-3 text-center font-bold text-red-700">
                        {Number(transaction.used_days || 0)}
                      </td>

                      <td className="p-3 text-center font-bold text-[#3f4447]">
                        {Number(transaction.calculated_balance || 0)}
                      </td>
                    </tr>
                  ))
                )}
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

function FormInput({
  label,
  type,
  value,
  onChange,
  required = false,
  placeholder,
  min,
  step,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#d2b241]"
      />
    </div>
  );
}
