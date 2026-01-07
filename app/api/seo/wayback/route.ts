import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";
import SeoSnapshot from "@/models/SeoSnapshot";
import axios from "axios";
import * as cheerio from "cheerio";

// Helper to normalize text (Same as your main scanner)
const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { clientId, date } = await req.json(); // date = "2023-10-01"
    await dbConnect();

    const client = await SeoClient.findById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    // 1. Ask Wayback Machine for a snapshot near this date
    // Format date for API: YYYYMMDD
    const targetTimestamp = date.replace(/-/g, "");
    const waybackUrl = `https://archive.org/wayback/available?url=${client.url}&timestamp=${targetTimestamp}`;
    
    console.log(`🕰️ Checking Wayback Machine: ${waybackUrl}`);
    const waybackRes = await axios.get(waybackUrl);
    const snapshots = waybackRes.data.archived_snapshots;

    if (!snapshots.closest || !snapshots.closest.url) {
      return NextResponse.json({ 
        success: false, 
        error: "No historical archive found for this date. Try a different month." 
      });
    }

    const archiveUrl = snapshots.closest.url;
    const archiveDate = snapshots.closest.timestamp; // YYYYMMDDHHMMSS
    console.log(`✅ Found Archive: ${archiveUrl}`);

    // 2. Fetch the OLD HTML
    const { data: html } = await axios.get(archiveUrl);
    const $ = cheerio.load(html);

    // 3. Run the Audit (Same logic as live scan)
    const title = normalize($("title").text());
    const h1 = normalize($("h1").first().text());
    const description = normalize($('meta[name="description"]').attr("content") || "");
    const body = normalize($("body").text());

    let score = 0;
    const maxScorePerKeyword = 100 / client.keywords.length;

    const keywordResults = client.keywords.map((kw: string) => {
        const cleanKw = normalize(kw);
        if (!cleanKw) return null;

        const inTitle = title.includes(cleanKw);
        const inH1 = h1.includes(cleanKw);
        const inDesc = description.includes(cleanKw);
        const inBody = body.includes(cleanKw);

        let kwScore = 0;
        if (inTitle) kwScore += 40;
        if (inH1) kwScore += 30;
        if (inDesc) kwScore += 10;
        if (inBody) kwScore += 20;

        score += (Math.min(kwScore, 100) / 100) * maxScorePerKeyword;

        return {
            keyword: kw,
            foundInTitle: inTitle,
            foundInH1: inH1,
            count: (body.match(new RegExp(cleanKw, "g")) || []).length
        };
    }).filter(Boolean);

    score = Math.round(score);

    // 4. Save as Backdated Snapshot
    // Parse Archive Date (YYYYMMDDHHMMSS) -> JS Date
    const year = archiveDate.substring(0, 4);
    const month = archiveDate.substring(4, 6) - 1; // JS months are 0-indexed
    const day = archiveDate.substring(6, 8);
    const historicDate = new Date(year, month, day);

    const snapshot = await SeoSnapshot.create({
      clientId: client._id,
      overallScore: score,
      titleTag: title.substring(0, 100),
      h1Tag: h1.substring(0, 100),
      keywordAnalysis: keywordResults,
      date: historicDate, // 👈 BACKDATED!
      type: "AUDIT" // Mark as audit
    });

    return NextResponse.json({ success: true, data: snapshot, archiveDate: historicDate });

  } catch (error: any) {
    console.error("Wayback Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to retrieve historical data." }, { status: 500 });
  }
}