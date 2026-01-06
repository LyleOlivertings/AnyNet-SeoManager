import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoSnapshot from "@/models/SeoSnapshot";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { clientId, range } = await req.json(); // range = "30_DAYS" (default)
    await dbConnect();

    // 1. Fetch all snapshots for this client sorted by date
    const snapshots = await SeoSnapshot.find({ 
      clientId,
      type: "RANK_CHECK" // Only look at rank checks, not technical audits
    }).sort({ date: 1 });

    if (snapshots.length < 2) {
      return NextResponse.json({ success: false, error: "Need at least 2 scans to generate a report." });
    }

    // 2. Determine "Before" and "After"
    const latest = snapshots[snapshots.length - 1];
    const earliest = snapshots[0]; // Or filter by date range if you want specific months

    // 3. Calculate Growth
    const comparison = latest.googleRankings.map((current: any) => {
      const old = earliest.googleRankings.find((p: any) => p.keyword === current.keyword);
      const startRank = old ? old.position : 0;
      const endRank = current.position;
      
      // Calculate change (Negative is BAD in rank, unless we handle 0 as "unranked")
      // Logic: If moved from 10 to 4, that is +6 spots gained.
      let change = 0;
      if (startRank === 0 && endRank > 0) change = "NEW"; // Entered rankings
      else if (startRank > 0 && endRank === 0) change = "LOST"; // Dropped out
      else change = startRank - endRank; // e.g., 10 - 4 = 6 (Positive improvement)

      return {
        keyword: current.keyword,
        startRank: startRank === 0 ? "> 100" : `#${startRank}`,
        endRank: endRank === 0 ? "> 100" : `#${endRank}`,
        change: change,
        status: change === "NEW" || (typeof change === 'number' && change > 0) ? "improved" : "declined"
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        startDate: earliest.date,
        endDate: latest.date,
        comparison
      } 
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}