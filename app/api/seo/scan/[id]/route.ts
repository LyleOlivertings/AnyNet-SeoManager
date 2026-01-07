import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import SeoSnapshot from "@/models/SeoSnapshot";

// 1. Define the type properly for Next.js 15+
type Props = {
  params: Promise<{ id: string }>;
};

// PATCH: Update the date of a scan (Time Travel)
export async function PATCH(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Await the params before using the ID
  const { id } = await params;

  try {
    const { date } = await req.json();
    await dbConnect();

    const updated = await SeoSnapshot.findByIdAndUpdate(
      id, 
      { date: new Date(date) }, 
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Remove a scan
export async function DELETE(req: Request, { params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Await the params here too
  const { id } = await params;

  try {
    await dbConnect();
    await SeoSnapshot.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}