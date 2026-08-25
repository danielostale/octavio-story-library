import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { childAgeLabel } from "@/lib/age";
import { driveClient, getFamilyProfile } from "@/lib/google-drive";
import { openai } from "@/lib/openai";
import { buildStoryPrompt } from "@/lib/prompts";
import type { Story, StoryRequest } from "@/lib/types";

function parseModelJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as StoryRequest;
  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const birthDate = process.env.CHILD_BIRTH_DATE || "";
  const childName = process.env.CHILD_NAME || "Octavio";
  const ageLabel = birthDate ? childAgeLabel(birthDate) : "edad infantil no especificada";

  let family = null;
  if (body.mode === "personal" && session.accessToken) {
    try {
      family = await getFamilyProfile(driveClient(session.accessToken));
    } catch (error) {
      console.warn("Family context unavailable; continuing without it", error);
    }
  }

  const prompt = buildStoryPrompt(body, childName, ageLabel, family);
  const response = await openai.responses.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-terra",
    input: prompt,
  });

  try {
    const parsed = parseModelJson(response.output_text);
    const story: Story = {
      id: crypto.randomUUID(),
      title: String(parsed.title || body.topic),
      mode: body.mode,
      language: body.language,
      durationMinutes: body.durationMinutes,
      childAgeLabel: ageLabel,
      createdAt: new Date().toISOString(),
      story: String(parsed.story || ""),
      reflection: String(parsed.reflection || ""),
      illustrationScenes: Array.isArray(parsed.illustrationScenes)
        ? parsed.illustrationScenes.slice(0, 8).map((scene: any) => ({
            title: String(scene.title || "Escena"),
            description: String(scene.description || ""),
          }))
        : [],
    };
    return NextResponse.json(story);
  } catch (error) {
    console.error("Model returned invalid JSON", response.output_text, error);
    return NextResponse.json(
      { error: "The model returned an unexpected format. Please retry." },
      { status: 502 },
    );
  }
}
