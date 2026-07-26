import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

function securityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        error:
          "Admin access is required.",
      },
      { status: 403 }
    );
  }

  console.error(
    "HR AI Gemini error:",
    error
  );

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to answer the HR question.",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const requestStart = Date.now();

  try {
    await requireAdmin();

    const body = await request.json();

    const question = String(
      body.message || ""
    ).trim();

    if (!question) {
      return NextResponse.json(
        {
          error:
            "Please enter an HR question.",
        },
        { status: 400 }
      );
    }

    const project =
      process.env.GOOGLE_CLOUD_PROJECT;

    const location =
      process.env.GOOGLE_CLOUD_LOCATION ||
      "global";

    if (!project) {
      throw new Error(
        "GOOGLE_CLOUD_PROJECT is missing."
      );
    }

    const supabase = getSupabaseServer();

    const employeeQueryStart = Date.now();

    const { data: employees, error: employeeError } =
      await supabase
        .from("employees")
        .select(
          `
            employee_code,
            first_name,
            middle_name,
            last_name,
            department,
            position,
            status,
            joining_date,
            mobile_number,
            email,
            basic_salary,
            accommodation_allowance,
            transportation_allowance
          `
        )
        .order("first_name", {
          ascending: true,
        });

    if (employeeError) {
      throw new Error(employeeError.message);
    }

    const employeeContext =
      (employees || []).map((employee) => ({
        employee_id:
          employee.employee_code || "-",
        employee_name: [
          employee.first_name,
          employee.middle_name,
          employee.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim(),
        department:
          employee.department || "-",
        position:
          employee.position || "-",
        status:
          employee.status || "Available",
        joining_date:
          employee.joining_date || "-",
        mobile:
          employee.mobile_number || "-",
        email:
          employee.email || "-",
        basic_salary:
          employee.basic_salary ?? "-",
        accommodation_allowance:
          employee.accommodation_allowance ?? "-",
        transportation_allowance:
          employee.transportation_allowance ?? "-",
      }));

    const ai = new GoogleGenAI({
      vertexai: true,
      project,
      location,
      apiVersion: "v1",
    });

    const geminiStart = Date.now();

    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
You are the private HR AI Assistant for the ICDE HR Management System.

Rules:
- Answer only from the connected Employees data below.
- Do not invent employee names, counts, salaries, departments, dates, contact details or other information.
- Answer briefly and directly.
- When asked for a count, give the count directly.
- When asked for a table, return only a Markdown table.
- Treat statuses containing inactive, deactivated or terminated as inactive.
- All other statuses are active.
- For employee searches, match Employee ID or employee name.
- If information is not available, say it is not available in the connected Employees data.

CONNECTED EMPLOYEES:
${JSON.stringify(employeeContext)}

ADMIN QUESTION:
${question}
        `.trim(),
      });

    console.log(
      "HR AI EMPLOYEE QUERY:",
      Date.now() - employeeQueryStart,
      "ms"
    );

    const answer =
      response.text?.trim();

    console.log(
      "HR AI TIMING:",
      {
        gemini_ms:
          Date.now() - geminiStart,
        total_ms:
          Date.now() - requestStart,
      }
    );

    if (!answer) {
      throw new Error(
        "Gemini returned an empty answer."
      );
    }

    return NextResponse.json({
      answer,
      module: "employees",
    });
  } catch (error) {
    return securityError(error);
  }
}
