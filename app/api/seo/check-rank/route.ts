import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";
import SeoSnapshot from "@/models/SeoSnapshot";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId } = await req.json();
    if (!process.env.SERP_API_KEY) return NextResponse.json({ error: "Missing SERP_API_KEY" }, { status: 500 });

    await dbConnect();
    const client = await SeoClient.findById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const rankingResults = [];
    const competitorInsights: any[] = [];

    // NOTE: SerpApi is expensive (1 credit per keyword). 
    // Recommended: Only check the first 5 keywords automatically.
    const keywordsToCheck = client.keywords.slice(0, 5); 

    for (const keyword of keywordsToCheck) {
      try {
        console.log(`🔎 Checking Rank: ${keyword}`);
        const response = await axios.get("https://serpapi.com/search", {
          params: {
            api_key: process.env.SERP_API_KEY,
            q: keyword,
            location: "Cape Town, Western Cape, South Africa",
            google_domain: "google.co.za",
            gl: "za",
            hl: "en",
            num: 10
          }
        });

        const organicResults = response.data.organic_results || [];
        const hit = organicResults.find((r: any) => r.link.includes(client.url));

        // Save our rank
        rankingResults.push({
          keyword,
          position: hit ? hit.position : 0,
          urlFound: hit ? hit.link : "Not found"
        });

        // Save Top Competitor (The first result that isn't us)
        const topCompetitor = organicResults.find((r: any) => !r.link.includes(client.url));
        if (topCompetitor) {
            competitorInsights.push({
                keyword,
                competitorDomain: new URL(topCompetitor.link).hostname,
                position: topCompetitor.position
            });
        }

      } catch (err) {
        console.error(`Err ${keyword}`, err);
      }
    }

    // FIXED: Save 'competitorInsights' AND maintain previous score if possible
    // (Ideally, fetch the last AUDIT score to preserve the visual grade)
    const lastAudit = await SeoSnapshot.findOne({ clientId, type: "AUDIT" }).sort({ date: -1 });

    const snapshot = await SeoSnapshot.create({
      clientId: client._id,
      overallScore: lastAudit ? lastAudit.overallScore : 0, // Preserves the score!
      googleRankings: rankingResults,
      competitorInsights,
      type: "RANK_CHECK"
    });

    return NextResponse.json({ success: true, data: snapshot });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}