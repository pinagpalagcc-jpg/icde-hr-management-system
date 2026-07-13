"use client";

import { useEffect, useState } from "react";

type Increment = {
  id: string;
  year: number;
  month: string;
  previous_salary: number | string;
  increment_amount: number | string;
  new_salary: number | string;
  increment_type: string;
  notes?: string | null;
};

const EMPTY_FORM = {
  year: String(new Date().getFullYear()),
  month: "",
  previous_salary: "",
  increment_amount: "",
  increment_type: "Annual",
  notes: "",
};

export default function SalaryIncrementTable({
  employeeId,
  currentSalary,
  readOnly = false,
  onSalaryChanged,
}: {
  employeeId: string;
  currentSalary: number;
  readOnly?: boolean;
  onSalaryChanged?: () => void;
}) {
  const [records, setRecords] = useState<Increment[]>([]);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    previous_salary: String(currentSalary || 0),
  });

  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  async function loadRecords() {
    if (!employeeId) return;

    const response = await fetch(
      `/api/salary-increments?employee_id=${encodeURIComponent(
        employeeId
      )}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data?.error || "Unable to load salary increments.");
      return;
    }

    setRecords(Array.isArray(data) ? data : []);
    onSalaryChanged?.();
  }

  useEffect(() => {
    loadRecords();
  }, [employeeId]);

  function openAddForm() {
    setEditingId("");
    setForm({
      ...EMPTY_FORM,
      previous_salary: String(currentSalary || 0),
    });
    setShowForm(true);
  }

  function openEditForm(record: Increment) {
    setEditingId(record.id);
    setForm({
      year: String(record.year),
      month: record.month,
      previous_salary: String(record.previous_salary || 0),
      increment_amount: String(record.increment_amount || 0),
      increment_type: record.increment_type || "Annual",
      notes: record.notes || "",
    });
    setShowForm(true);
  }

  async function saveRecord() {
    try {
      setSaving(true);

      const response = await fetch(
        "/api/salary-increments",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId || undefined,
            employee_id: employeeId,
            year: Number(form.year),
            month: form.month,
            previous_salary: Number(
              form.previous_salary || 0
            ),
            increment_amount: Number(
              form.increment_amount || 0
            ),
            increment_type: form.increment_type,
            notes: form.notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to save salary increment."
        );
      }

      setShowForm(false);
      setEditingId("");
      await loadRecords();
      onSalaryChanged?.();

      alert(
        editingId
          ? "Salary increment updated successfully."
          : "Salary increment added successfully."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save salary increment."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(record: Increment) {
    const confirmed = window.confirm(
      `Delete salary increment for ${record.month} ${record.year}?`
    );

    if (!confirmed) return;

    const response = await fetch(
      `/api/salary-increments?id=${encodeURIComponent(
        record.id
      )}&employee_id=${encodeURIComponent(employeeId)}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data?.error ||
          "Unable to delete salary increment."
      );
      return;
    }

    await loadRecords();
    onSalaryChanged?.();
    alert("Salary increment deleted successfully.");
  }

  const calculatedNewSalary =
    Number(form.previous_salary || 0) +
    Number(form.increment_amount || 0);

  const monthNumbers: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const filteredRecords = records.filter((record) => {
    const recordMonth = `${record.year}-${
      monthNumbers[record.month] || "01"
    }`;

    const matchesFrom =
      fromMonth ? recordMonth >= fromMonth : true;

    const matchesTo =
      toMonth ? recordMonth <= toMonth : true;

    return matchesFrom && matchesTo;
  });

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-[#3f4447]">
          Salary Increment History
        </h2>

        {!readOnly ? (
          <button
            type="button"
            onClick={openAddForm}
            className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold"
          >
            + Add Increment
          </button>
        ) : null}
      </div>

      {!readOnly && showForm ? (
        <div className="border rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Year"
              type="number"
              value={form.year}
              onChange={(value) =>
                setForm({ ...form, year: value })
              }
            />

            <Select
              label="Month"
              value={form.month}
              options={[
                "Jan", "Feb", "Mar", "Apr",
                "May", "Jun", "Jul", "Aug",
                "Sep", "Oct", "Nov", "Dec",
              ]}
              onChange={(value) =>
                setForm({ ...form, month: value })
              }
            />

            <Input
              label="Previous Salary"
              type="number"
              value={form.previous_salary}
              onChange={(value) =>
                setForm({
                  ...form,
                  previous_salary: value,
                })
              }
            />

            <Input
              label="Increment"
              type="number"
              value={form.increment_amount}
              onChange={(value) =>
                setForm({
                  ...form,
                  increment_amount: value,
                })
              }
            />

            <Input
              label="New Salary"
              type="number"
              value={String(calculatedNewSalary)}
              disabled
              onChange={() => {}}
            />

            <Select
              label="Type"
              value={form.increment_type}
              options={[
                "Joining",
                "Annual",
                "Promotion",
                "Adjustment",
              ]}
              onChange={(value) =>
                setForm({
                  ...form,
                  increment_type: value,
                })
              }
            />

            <Input
              label="Notes"
              value={form.notes}
              onChange={(value) =>
                setForm({ ...form, notes: value })
              }
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-200 px-5 py-3 rounded-xl font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={saveRecord}
              disabled={saving}
              className="bg-[#3f4447] text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update"
                : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Input
          label="From Month"
          type="month"
          value={fromMonth}
          onChange={setFromMonth}
        />

        <Input
          label="To Month"
          type="month"
          value={toMonth}
          onChange={setToMonth}
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setFromMonth("");
              setToMonth("");
            }}
            className="w-full bg-gray-200 text-[#3f4447] px-5 py-3 rounded-xl font-bold"
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto border rounded-xl">
        <table className="min-w-[1100px] w-full text-sm">
          <thead>
            <tr className="bg-[#d2b241] text-white">
              <th className="p-4 text-left">Year</th>
              <th className="p-4 text-left">Month</th>
              <th className="p-4 text-left">Previous Salary</th>
              <th className="p-4 text-left">Increment</th>
              <th className="p-4 text-left">New Salary</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Notes</th>
              {!readOnly ? (
                <th className="p-4 text-left">Action</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 7 : 8}
                  className="p-8 text-center text-gray-500"
                >
                  No salary increment history found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="border-b">
                  <td className="p-4">{record.year}</td>
                  <td className="p-4">{record.month}</td>
                  <td className="p-4">
                    AED {Number(record.previous_salary || 0).toLocaleString()}
                  </td>
                  <td className="p-4 text-green-700 font-bold">
                    + AED {Number(record.increment_amount || 0).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold">
                    AED {Number(record.new_salary || 0).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {record.increment_type}
                  </td>
                  <td className="p-4">
                    {record.notes || "-"}
                  </td>

                  {!readOnly ? (
                    <td className="p-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditForm(record)}
                        className="text-blue-700 font-bold mr-4 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteRecord(record)}
                        className="text-red-700 font-bold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        min={type === "number" ? "0" : undefined}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full border rounded-xl px-4 py-3 disabled:bg-gray-100"
      />
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full border rounded-xl px-4 py-3"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
