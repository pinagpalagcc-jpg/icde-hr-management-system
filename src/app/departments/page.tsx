"use client";

import {
  useEffect,
  useState,
} from "react";

type Department = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function DepartmentsPage() {
  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([]);

  const [
    departmentName,
    setDepartmentName,
  ] = useState("");

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadDepartments() {
    try {
      const response = await fetch(
        "/api/departments",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to load departments."
        );
      }

      setDepartments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function saveDepartment() {
    const name =
      departmentName.trim();

    if (!name) {
      alert(
        "Please enter a department name."
      );
      return;
    }

    const response = await fetch(
      "/api/departments",
      {
        method: editingId
          ? "PATCH"
          : "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                name,
              }
            : {
                name,
              }
        ),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.error ||
          "Unable to save department."
      );
      return;
    }

    setDepartmentName("");
    setEditingId(null);
    await loadDepartments();
  }

  async function toggleDepartment(
    id: string,
    active: boolean
  ) {
    const response = await fetch(
      "/api/departments",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          id,
          is_active: !active,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      alert(
        data.error ||
          "Unable to update department."
      );
      return;
    }

    await loadDepartments();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-[#1d3557]">
            Departments Management
          </h1>

          <p className="mt-2 text-gray-500">
            Create, rename, edit, activate or deactivate departments.
          </p>

          <div className="mt-8 flex gap-4">
            <input
              value={departmentName}
              onChange={(event) =>
                setDepartmentName(
                  event.target.value
                )
              }
              placeholder="Department Name"
              className="w-80 rounded-xl border px-4 py-3"
            />

            <button
              onClick={saveDepartment}
              className="rounded-xl bg-[#1d3557] px-6 py-3 text-white"
            >
              {editingId
                ? "Update Department"
                : "Add Department"}
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
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-gray-500"
                    >
                      Loading departments...
                    </td>
                  </tr>
                ) : (
                  departments.map(
                    (department) => (
                      <tr
                        key={
                          department.id
                        }
                        className="border-t"
                      >
                        <td className="p-3">
                          {
                            department.name
                          }
                        </td>

                        <td className="p-3">
                          {department.is_active
                            ? "Active"
                            : "Inactive"}
                        </td>

                        <td className="space-x-2 p-3">
                          <button
                            onClick={() => {
                              setEditingId(
                                department.id
                              );

                              setDepartmentName(
                                department.name
                              );
                            }}
                            className="rounded bg-blue-600 px-3 py-1 text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              toggleDepartment(
                                department.id,
                                department.is_active
                              )
                            }
                            className={`rounded px-3 py-1 text-white ${
                              department.is_active
                                ? "bg-red-600"
                                : "bg-green-600"
                            }`}
                          >
                            {department.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
