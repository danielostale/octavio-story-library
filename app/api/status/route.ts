import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const googleConfigured = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );
  const authSecretConfigured = Boolean(process.env.AUTH_SECRET);

  let gemini: { ok: boolean; detail: string; model?: string } = {
    ok: false,
    detail: geminiConfigured ? "Configurada, pendiente de prueba" : "Falta GEMINI_API_KEY",
  };

  if (geminiConfigured) {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY!,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
            generationConfig: { temperature: 0 },
          }),
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const text = await response.text();
        gemini = {
          ok: false,
          model,
          detail: `Gemini ${response.status}: ${text.slice(0, 500)}`,
        };
      } else {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || "")
          .join("")
          .trim();
        gemini = {
          ok: Boolean(text),
          model,
          detail: text ? `Respuesta: ${text}` : "Respuesta vacía de Gemini",
        };
      }
    } catch (error: any) {
      gemini = {
        ok: false,
        model,
        detail: error?.message || "Error desconocido al contactar Gemini",
      };
    }
  }

  return NextResponse.json({
    gemini,
    googleOAuth: {
      configured: googleConfigured,
      authSecretConfigured,
    },
    note: "Este endpoint nunca devuelve claves ni secretos.",
  });
}
