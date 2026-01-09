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

    console.log(`📡 Elite Scan Initiated: ${client.url}`);

    // 1. Performance Check (Time to First Byte)
    const startTime = performance.now();
    let html = "";
    try {
        const response = await axios.get(client.url, {
            headers: { 
                'User-Agent': 'AnyNet-SEO-Bot/1.0 (Compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml' 
            },
            timeout: 10000
        });
        html = response.data;
    } catch (e: any) {
        return NextResponse.json({ success: false, error: `Unreachable: ${e.message}` }, { status: 500 });
    }
    const loadTime = Math.round(performance.now() - startTime);
    const $ = cheerio.load(html);
    const norm = (t: string) => t ? t.toLowerCase().replace(/\s+/g, " ").trim() : "";

    // 2. Technical Audits
    // A. Meta Tags
    const title = $("title").text().trim();
    const desc = $('meta[name="description"]').attr("content")?.trim() || "";
    const metaAnalysis = {
        metaTitle: { 
            value: title.substring(0, 60) + (title.length > 60 ? "..." : ""), 
            status: title.length > 0 && title.length < 60 ? "Good" : "Issue",
            length: title.length 
        },
        metaDescription: { 
            value: desc.substring(0, 100) + (desc.length > 100 ? "..." : ""), 
            status: desc.length >= 50 && desc.length <= 160 ? "Optimal" : "Issue",
            length: desc.length
        }
    };

    // B. Headers
    const h1Count = $("h1").length;
    const h1Content = $("h1").first().text().trim();

    // C. Images
    const imgs = $("img");
    let missingAlt = 0;
    imgs.each((_, el) => { if (!$(el).attr("alt")) missingAlt++; });
    const imageHealth = {
        total: imgs.length,
        missingAlt,
        score: imgs.length > 0 ? Math.round(((imgs.length - missingAlt) / imgs.length) * 100) : 100
    };

    // D. Links
    const internalLinks = $("a[href^='/']").length + $(`a[href*='${client.url}']`).length;
    const externalLinks = $("a").length - internalLinks;

    // 3. Keyword Content Analysis
    const bodyText = norm($("body").text());
    const keywordResults = client.keywords.map((kw: string) => {
        const cleanKw = norm(kw);
        if (!cleanKw) return null;
        
        const inTitle = norm(title).includes(cleanKw);
        const inH1 = norm(h1Content).includes(cleanKw);
        const inDesc = norm(desc).includes(cleanKw);
        const count = (bodyText.match(new RegExp(cleanKw, "g")) || []).length;

        let kScore = 0;
        if (inTitle) kScore += 30;
        if (inH1) kScore += 30;
        if (inDesc) kScore += 10;
        if (count > 0) kScore += 30;

        return {
            keyword: kw,
            foundInTitle: inTitle,
            foundInH1: inH1,
            foundInDesc: inDesc,
            countInBody: count,
            score: Math.min(kScore, 100)
        };
    }).filter(Boolean);

    // 4. Calculate Final Score
    let score = 0;
    // Tech Points (40)
    if (metaAnalysis.metaTitle.status === "Good") score += 10;
    if (metaAnalysis.metaDescription.status === "Optimal") score += 10;
    if (h1Count === 1) score += 10;
    if (imageHealth.score > 80) score += 10;
    // Speed Points (20)
    if (loadTime < 500) score += 20;
    else if (loadTime < 1500) score += 10;
    // Content Points (40)
    const avgKwScore = keywordResults.length > 0 
        ? keywordResults.reduce((a:number, b:any) => a + b.score, 0) / keywordResults.length 
        : 0;
    score += Math.round((avgKwScore / 100) * 40);

    // 5. Save
    const snapshot = await SeoSnapshot.create({
      clientId: client._id,
      overallScore: score,
      type: "AUDIT",
      technicalAnalysis: {
          ...metaAnalysis,
          h1Count,
          h1Content,
          imageHealth,
          linkHealth: { internal: internalLinks, external: externalLinks },
          loadTime
      },
      keywordAnalysis: keywordResults
    });

    return NextResponse.json({ success: true, data: snapshot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}