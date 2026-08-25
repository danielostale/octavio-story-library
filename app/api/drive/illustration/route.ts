import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { driveClient, saveIllustrationToDrive } from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Google Drive authorization required" }, { status: 401 });
  }
  const { storyFolderId, filename, b64 } = await request.json();
  if (!storyFolderId || !filename || !b64) {
    return NextResponse.json({ error: "Missing illustration data" }, { status: 400 });
  }
  const fileId = await saveIllustrationToDrive(
    driveClient(session.accessToken),
    storyFolderId,
    filename,
    b64,
  );
  return NextResponse.json({ fileId });
}
