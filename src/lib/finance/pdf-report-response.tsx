import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { ReportPDF } from "@/components/reports/report-pdf";
import { getReportsDataset } from "@/lib/finance/server-reports";

type ReportKind = "monthly" | "yearly";

function fileSafe(value: string | number) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createPdfReportResponse(kind: ReportKind) {
  const { dashboard, reports } = await getReportsDataset();
  const label = kind === "monthly" ? reports.monthly.label : reports.yearly.year;
  const filename = `DFT-${kind}-report-${fileSafe(label)}.pdf`;
  const buffer = await renderToBuffer(
    <ReportPDF kind={kind} dashboard={dashboard} reports={reports} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store"
    }
  });
}
