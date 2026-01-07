import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SeoReport from "@/models/SeoReport";
import SeoClient from "@/models/SeoClient";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await dbConnect();
    
    // Fetch report and populate the client details
    const report = await SeoReport.findById(params.id).populate("client");
    
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}