import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";
import SeoSnapshot from "@/models/SeoSnapshot";
import axios from "axios";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId } = await req.json();
    if (!process.env.SERP_API_KEY) {
      return NextResponse.json({ error: "Missing SERP_API_KEY" }, { status: 500 });
    }

    await dbConnect();
    const client = await SeoClient.findById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // 2. Loop through Keywords and Check Google
    // Note: SerpApi Free Tier is 100 searches/mo. Be careful with loops!
    const rankingResults = [];

    for (const keyword of client.keywords) {
      try {
        console.log(`🔎 Checking Rank for: ${keyword}`);
        
        const response = await axios.get("https://serpapi.com/search", {
          params: {
            api_key: process.env.SERP_API_KEY,
            q: keyword,
            location: "Cape Town, Western Cape, South Africa", // Local SEO is key!
            google_domain: "google.co.za",
            gl: "za",
            hl: "en",
            num: 20 // Check top 20 results
          }
        });

        const organicResults = response.data.organic_results || [];
        
        // Find where our client URL appears
        const hit = organicResults.find((r: any) => r.link.includes(client.url));

        rankingResults.push({
          keyword,
          position: hit ? hit.position : 0, // 0 means "Not in top 20"
          urlFound: hit ? hit.link : "Not found"
        });

      } catch (err) {
        console.error(`Failed to check ${keyword}`, err);
        rankingResults.push({ keyword, position: 0, urlFound: "Error" });
      }
    }

    // 3. Save to Snapshot (Merge with latest or create new)
    // We create a new snapshot specifically for this ranking check
    const snapshot = await SeoSnapshot.create({
      clientId: client._id,
      overallScore: 0, // Placeholder, or fetch last score
      googleRankings: rankingResults,
      type: "RANK_CHECK"
    });

    return NextResponse.json({ success: true, data: snapshot });

  } catch (error: any) {
    console.error("❌ Ranking Check Failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}