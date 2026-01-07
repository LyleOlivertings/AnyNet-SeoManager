import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SeoReport from "@/models/SeoReport";
import SeoClient from "@/models/SeoClient"; // 👈 Important: Keeps the model registered

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await dbConnect();
    
    // 🛠️ FIX: The field in your schema is 'clientId', not 'client'.
    const report = await SeoReport.findById(params.id).populate("clientId");
    
    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Report Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Server Error" },
      { status: 500 }
    );
  }
}