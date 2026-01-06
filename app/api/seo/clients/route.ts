import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";

// GET: List all clients
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const clients = await SeoClient.find({}).sort({ createdAt: -1 });
  return NextResponse.json({ success: true, data: clients });
}

// POST: Add a new client
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await dbConnect();
    const body = await req.json(); // { name, url, keywords }
    
    const newClient = await SeoClient.create(body);
    return NextResponse.json({ success: true, data: newClient });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}