import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { gatherStudentReportData } from "@/lib/report-data";
import { generateReportAnalysis } from "@/lib/report-analysis";
import { generateCodeEfficiencyReport } from "@/lib/report-code-analysis";
import StudentReportDocument from "@/components/coordinator/StudentReportDocument";

// react-pdf renders in Node; the AI analysis call can take a while.
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "COORDINATOR") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const coordinator = await db.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true },
        });
        if (!coordinator?.organizationId) {
            return NextResponse.json({ error: "No organization" }, { status: 403 });
        }

        const { id: studentId } = await params;

        // gatherStudentReportData enforces the same-organization boundary and returns null otherwise.
        const data = await gatherStudentReportData(studentId, coordinator.organizationId);
        if (!data) {
            return NextResponse.json({ error: "Student not found in your organization" }, { status: 404 });
        }

        // Two independent AI sections run concurrently; both fall back internally on failure,
        // so neither is fatal to report generation.
        const [analysis, codeReport] = await Promise.all([
            generateReportAnalysis(data),
            generateCodeEfficiencyReport(data.recentCodes),
        ]);

        const buffer = await renderToBuffer(
            React.createElement(StudentReportDocument, { data, analysis, codeReport }) as any
        );

        const safeName = (data.student.name || "student").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
        const filename = `Report_${safeName || "student"}.pdf`;

        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Failed to generate student report:", error);
        return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
    }
}
