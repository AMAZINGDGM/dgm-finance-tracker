import { createPdfReportResponse } from "@/lib/finance/pdf-report-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return createPdfReportResponse("yearly");
}
