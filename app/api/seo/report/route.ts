import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoSnapshot from "@/models/SeoSnapshot";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { clientId, range } = await req.json(); 
    await dbConnect();

    // 1. Fetch Data
    const snapshots = await SeoSnapshot.find({ clientId, type: "RANK_CHECK" }).sort({ date: 1 });
    
    if (snapshots.length === 0) return NextResponse.json({ success: false, error: "No data found." });

    const latest = snapshots[snapshots.length - 1];
    const earliest = snapshots.length > 1 ? snapshots[0] : latest; 

    const comparison = latest.googleRankings.map((current: any) => {
      const old = earliest.googleRankings.find((p: any) => p.keyword === current.keyword);
      const startRank = old ? old.position : 0;
      const endRank = current.position;
      
      let change: any = 0;
      if (snapshots.length === 1) change = "Initial"; 
      else if (startRank === 0 && endRank > 0) change = "NEW"; 
      else if (startRank > 0 && endRank === 0) change = "LOST"; 
      else change = startRank - endRank; 

      return {
        keyword: current.keyword,
        startRank: startRank === 0 ? "n/a" : `#${startRank}`,
        endRank: endRank === 0 ? "Not Ranked" : `#${endRank}`,
        change: change,
        status: change === "NEW" || (typeof change === 'number' && change > 0) ? "improved" : 
                change === "Initial" ? "neutral" : "declined"
      };
    });

    // 🧠 2. GENERATE AI BRIEF
    let aiSummary = "Analysis not available.";
    
    if (process.env.GOOGLE_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 
        
        const prompt = `
          You are a Senior SEO Strategist for AnyNet SA. Analyze this ranking data:
          ${JSON.stringify(comparison.map((c: any) => `${c.keyword}: ${c.startRank} -> ${c.endRank} (${c.status})`))}
          
          Write a concise "Executive Brief" (Max 3 sentences). 
          1. Highlight the biggest win (keyword moving up) or opportunity.
          2. Suggest 1 actionable next step (e.g., optimize H1, build backlinks).
          3. Tone: Professional, encouraging, authority. 
          4. Format: Plain text. No markdown bolding.
        `;

        const result = await model.generateContent(prompt);
        aiSummary = result.response.text();
      } catch (aiError: any) {
        console.error("AI Generation Failed:", aiError.message);
        aiSummary = "AI Insights temporarily unavailable. Please focus on keyword movements shown below.";
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        startDate: earliest.date,
        endDate: latest.date,
        comparison,
        aiSummary
      } 
    });

  } catch (error) {
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}