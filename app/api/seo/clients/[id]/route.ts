import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoClient from "@/models/SeoClient";
import SeoSnapshot from "@/models/SeoSnapshot";
import SeoReport from "@/models/SeoReport";

// Helper to handle the params promise
type Props = {
  params: Promise<{ id: string }>;
};

// GET: Fetch Single Client
export async function GET(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Await the params to get the ID
  const { id } = await params;

  await dbConnect();
  const client = await SeoClient.findById(id);
  
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: client });
}

// PUT: Update Client Details
export async function PUT(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Await the params
  const { id } = await params;

  try {
    const body = await req.json();
    await dbConnect();

    const updatedClient = await SeoClient.findByIdAndUpdate(
      id,
      {
        name: body.name,
        url: body.url,
        keywords: body.keywords,
        competitors: body.competitors || [],
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updatedClient });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Remove Client
export async function DELETE(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Await the params
  const { id } = await params;

  try {
    await dbConnect();

    // Delete Client
    await SeoClient.findByIdAndDelete(id);

    // Cascade Delete (Clean up mess)
    await SeoSnapshot.deleteMany({ clientId: id });
    await SeoReport.deleteMany({ clientId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}