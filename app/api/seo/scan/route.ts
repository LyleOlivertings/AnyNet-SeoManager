import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";
import SeoSnapshot from "@/models/SeoSnapshot";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { clientId } = await req.json();
    await dbConnect();

    const client = await SeoClient.findById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    console.log(`📡 Scanning: ${client.url}`);

    const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

// 1. Fetch HTML
    const { data: html } = await axios.get(client.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...' }
    });
    const $ = cheerio.load(html);

    // 2. Get Page Content (Normalized)
    const title = normalize($("title").text());
    const h1 = normalize($("h1").first().text());
    const description = normalize($('meta[name="description"]').attr("content") || "");
    const body = normalize($("body").text());

    // 3. Score Logic
    let score = 0;
    const maxScorePerKeyword = 100 / client.keywords.length; // Distribute points evenly

    const keywordResults = client.keywords.map((kw: string) => {
        const cleanKw = normalize(kw);
        if (!cleanKw) return null;

        const inTitle = title.includes(cleanKw);
        const inH1 = h1.includes(cleanKw);
        const inDesc = description.includes(cleanKw);
        const inBody = body.includes(cleanKw);

        // Scoring Weights
        let kwScore = 0;
        if (inTitle) kwScore += 40; // Title is king
        if (inH1) kwScore += 30;    // H1 is queen
        if (inDesc) kwScore += 10;
        if (inBody) kwScore += 20;  // Body is baseline

        // Cap at 100% per keyword contribution
        score += (Math.min(kwScore, 100) / 100) * maxScorePerKeyword;

        return {
            keyword: kw,
            foundInTitle: inTitle,
            foundInH1: inH1,
            count: (body.match(new RegExp(cleanKw, "g")) || []).length
        };
    }).filter(Boolean);

    // Round Score
    score = Math.round(score);

    // 4. Save Snapshot
    const snapshot = await SeoSnapshot.create({
      clientId: client._id,
      overallScore: score,
      titleTag: title.substring(0, 100), // Safety clip
      h1Tag: h1.substring(0, 100),
      keywordAnalysis: keywordResults,
      date: new Date(), 
    });

    return NextResponse.json({ success: true, data: snapshot });

  } catch (error: any) {
    console.error("❌ Scan Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}