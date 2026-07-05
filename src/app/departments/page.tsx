"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Department = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentName, setDepartmentName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadDepartments() {
    const { data } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    setDepartments(data || []);
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function saveDepartment() {
    if (!departmentName.trim()) return;

    if (editingId) {
      await supabase
        .from("departments")
        .update({ name: departmentName })
        .eq("id", editingId);

      setEditingId(null);
    } else {
      await supabase.from("departments").insert({
        name: departmentName,
        is_active: true,
      });
    }

    setDepartmentName("");
    loadDepartments();
  }

  async function toggleDepartment(id: string, active: boolean) {
    await supabase
      .from("departments")
      .update({
        is_active: !active,
      })
      .eq("id", id);

    loadDepartments();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="bg-white rounded-2xl shadow p-8">

          <h1 className="text-3xl font-bold text-[#1d3557]">
            Departments Management
          </h1>

          <p className="text-gray-500 mt-2">
            Create, rename, edit, activate or deactivate departments.
          </p>

          <div className="mt-8 flex gap-4">

            <input
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Department Name"
              className="border rounded-xl px-4 py-3 w-80"
            />

            <button
              onClick={saveDepartment}
              className="rounded-xl bg-[#1d3557] text-white px-6 py-3"
            >
              {editingId ? "Update Department" : "Add Department"}
            </button>

          </div>

          <div className="mt-10 overflow-x-auto">

            <table className="w-full border">

              <thead className="bg-gray-100">

                <tr>

                  <th className="p-3 text-left">
                    Department
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>

                  <th className="p-3 text-left">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>
                {departments.map((dept) => (

                  <tr key={dept.id} className="border-t">

                    <td className="p-3">
                      {dept.name}
                    </td>

                    <td className="p-3">
                      {dept.is_active ? "Active" : "Inactive"}
                    </td>

                    <td className="p-3 space-x-2">

                      <button
                        onClick={() => {
                          setEditingId(dept.id);
                          setDepartmentName(dept.name);
                        }}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          toggleDepartment(
                            dept.id,
                            dept.is_active
                          )
                        }
                        className={`px-3 py-1 rounded text-white ${
                          dept.is_active
                            ? "bg-red-600"
                            : "bg-green-600"
                        }`}
                      >
                        {dept.is_active
                          ? "Disable"
                          : "Enable"}
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </main>

  );

}