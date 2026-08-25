import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { driveClient, loadLibraryIndex } from "@/lib/google-drive";

export async function GET() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Google Drive authorization required" }, { status: 401 });
  }
  const library = await loadLibraryIndex(driveClient(session.accessToken));
  return NextResponse.json(library);
}
