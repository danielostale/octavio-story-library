import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { driveClient, getFamilyProfile, saveFamilyProfile } from "@/lib/google-drive";
import type { FamilyProfile } from "@/lib/types";

function emptyProfile(): FamilyProfile {
  return { version: 1, members: [], memories: [], updatedAt: new Date().toISOString() };
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Google Drive authorization required" }, { status: 401 });
  }
  const profile = await getFamilyProfile(driveClient(session.accessToken));
  return NextResponse.json(profile || emptyProfile());
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Google Drive authorization required" }, { status: 401 });
  }

  const profile = (await request.json()) as FamilyProfile;
  profile.version = profile.version || 1;
  profile.updatedAt = new Date().toISOString();
  await saveFamilyProfile(driveClient(session.accessToken), profile);
  return NextResponse.json(profile);
}
