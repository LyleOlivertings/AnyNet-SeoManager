import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoReport from "@/models/SeoReport";

// GET: Fetch saved reports
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  await dbConnect();
  
  const reports = await SeoReport.find({ clientId }).sort({ dateGenerated: -1 });
  return NextResponse.json({ success: true, data: reports });
}

// POST: Save a new report
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  await dbConnect();

  const report = await SeoReport.create({
    clientId: body.clientId,
    title: body.title || `SEO Report - ${new Date().toLocaleDateString()}`,
    data: body.data, // This is the comparison array
    range: body.range,
    aiSummary: body.aiSummary || "No AI summary available for this report." // 👈 SAVE THIS
  });

  return NextResponse.json({ success: true, data: report });
}