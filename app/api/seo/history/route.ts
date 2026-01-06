import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoSnapshot from "@/models/SeoSnapshot";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { clientId } = await req.json();
    await dbConnect();

    // Fetch last 10 scans for this client, sorted by date
    const history = await SeoSnapshot.find({ clientId })
      .sort({ date: 1 }) // Oldest to newest for the graph
      .limit(20)
      .select("date overallScore");

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}