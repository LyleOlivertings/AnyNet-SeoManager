import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // <--- FIXED IMPORT
import dbConnect from "@/lib/dbConnect";
import SeoSnapshot from "@/models/SeoSnapshot";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // DEBUG: Remove this after it works
    if (!session) {
      console.log("❌ SEO API: No Session Found. Check cookies.");
      return NextResponse.json({ error: "Unauthorized - No Session" }, { status: 401 });
    }

    await dbConnect();
    const snapshots = await SeoSnapshot.find({}).sort({ date: 1 });

    return NextResponse.json({ success: true, data: snapshots });
  } catch (error) {
    console.error("❌ SEO API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const authHeader = req.headers.get("x-anynet-secret");
    const envSecret = process.env.ANYNET_API_SECRET;
    
    // Allow if Session exists OR if a secret header matches
    const isAuthorized = session || (envSecret && authHeader === envSecret);

    if (!isAuthorized) {
      console.log("❌ SEO API POST: Unauthorized attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const snapshot = await SeoSnapshot.create({
      clientName: body.clientName,
      domain: body.domain,
      healthScore: body.healthScore,
      organicTraffic: body.organicTraffic || 0,
      rankings: body.rankings || [],
      date: new Date(),
    });

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to save scan" }, { status: 500 });
  }
}