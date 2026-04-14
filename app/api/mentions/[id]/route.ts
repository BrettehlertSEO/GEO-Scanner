import { NextRequest, NextResponse } from "next/server";
import { getMentionById } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const mentionId = parseInt(id, 10);

    if (isNaN(mentionId)) {
      return NextResponse.json({ error: "Invalid mention ID" }, { status: 400 });
    }

    const mention = getMentionById(mentionId);

    if (!mention) {
      return NextResponse.json({ error: "Mention not found" }, { status: 404 });
    }

    return NextResponse.json(mention);
  } catch (error) {
    console.error("Error fetching mention:", error);
    return NextResponse.json({ error: "Failed to fetch mention" }, { status: 500 });
  }
}
