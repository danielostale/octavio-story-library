import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const language = String(form.get("language") || "es");

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Falta el audio." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no está configurada." },
        { status: 503 },
      );
    }

    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
    const bytes = Buffer.from(await audio.arrayBuffer());
    const base64 = bytes.toString("base64");
    const mimeType = audio.type || "audio/webm";
    const languageName = language === "fr" ? "francés" : language === "en" ? "inglés" : "español";

    const prompt = `Transcribe fielmente este audio en ${languageName}.\n\nEs un recuerdo familiar contado de forma espontánea para convertirlo después en un cuento infantil. Conserva nombres propios, lugares, fechas, anécdotas, detalles y matices. Elimina únicamente muletillas claramente accidentales y repeticiones sin contenido. NO inventes, completes ni corrijas hechos. Devuelve solamente la transcripción limpia en texto corrido, sin introducciones ni comentarios.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.1 },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Gemini error ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!text) throw new Error("Gemini no devolvió una transcripción.");
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "No se pudo transcribir el audio." },
      { status: 502 },
    );
  }
}
