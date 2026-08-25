import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { driveClient, saveStoryToDrive } from "@/lib/google-drive";
import type { Story } from "@/lib/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Google Drive authorization required" }, { status: 401 });
  }
  if (session.authError) {
    return NextResponse.json({ error: "Google authorization expired. Sign in again." }, { status: 401 });
  }

  const story = (await request.json()) as Story;
  const entry = await saveStoryToDrive(driveClient(session.accessToken), story);
  return NextResponse.json(entry);
}
