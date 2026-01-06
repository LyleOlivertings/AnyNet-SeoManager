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

    // 1. Fetch with a "Real" Browser Header (Anti-bot bypass)
    const { data: html } = await axios.get(client.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 
    });

    const $ = cheerio.load(html);

    // 2. Extract & Normalize Text (The Fix)
    // We lowercase everything and remove crazy extra spaces
    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1").first().text().trim();
    
    // Get ALL text from the body, remove scripts/styles, and normalize whitespace
    $('script').remove();
    $('style').remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").toLowerCase();

    // 3. Analyze Keywords (Flexible Match)
    let score = 100;
    
    const keywordResults = client.keywords.map((kw: string) => {
      const cleanKw = kw.toLowerCase().trim();
      if (!cleanKw) return null;

      const inTitle = title.toLowerCase().includes(cleanKw);
      const inH1 = h1.toLowerCase().includes(cleanKw);
      const inBody = bodyText.includes(cleanKw);

      // Penalties
      if (!inTitle) score -= 15;
      if (!inH1) score -= 20;
      if (!inBody) score -= 10;

      return {
        keyword: kw,
        foundInTitle: inTitle,
        foundInH1: inH1,
        foundInBody: inBody,
        count: (bodyText.match(new RegExp(cleanKw, "g")) || []).length
      };
    }).filter(Boolean);

    score = Math.max(0, score); // Can't go below 0

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