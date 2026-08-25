import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { childAgeLabel } from "@/lib/age";
import { driveClient, getFamilyProfile } from "@/lib/google-drive";
import { generateWithGemini } from "@/lib/gemini";
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as StoryRequest;
  if (!body.topic?.trim()) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }

  const birthDate = process.env.CHILD_BIRTH_DATE || "";
  const childName = process.env.CHILD_NAME || "Octavio";
  const ageLabel = birthDate
    ? childAgeLabel(birthDate)
    : "edad infantil no especificada";

  let family = null;
  if (body.mode === "personal" && session.accessToken) {
    try {
      family = await getFamilyProfile(driveClient(session.accessToken));
    } catch (error) {
      console.warn("Family context unavailable; continuing without it", error);
    }
  }

  const basePrompt = buildStoryPrompt(body, childName, ageLabel, family);
  const prompt = `${basePrompt}\n\nIMPORTANTE:\nDevuelve EXCLUSIVAMENTE JSON válido, sin markdown ni texto adicional, con esta forma:\n{\n  \"title\": \"string\",\n  \"story\": \"string\",\n  \"reflection\": \"string\",\n  \"illustrationScenes\": [\n    {\"title\": \"string\", \"description\": \"string\"}\n  ]\n}\n\nPara illustrationScenes propone entre 4 y 8 escenas visuales concretas.\nNo inventes hechos históricos centrales. En historias personales, no inventes recuerdos que no estén en las notas o en la ficha familiar.`;

  try {
    const output = await generateWithGemini(prompt);
    const parsed = parseModelJson(output);

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
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "No se pudo crear el cuento." },
      { status: 502 },
    );
  }
}
