import type { FamilyProfile, StoryRequest } from "@/lib/types";

const languageName = { es: "español", fr: "francés", en: "inglés" } as const;

export function buildStoryPrompt(
  request: StoryRequest,
  childName: string,
  ageLabel: string,
  family?: FamilyProfile | null,
) {
  const familyContext = family
    ? JSON.stringify(family, null, 2)
    : "No hay ficha familiar disponible.";

  return `
Eres el autor de la biblioteca privada de cuentos de ${childName}.

OBJETIVO
Escribe un cuento infantil autónomo que pueda leerse por sí solo. El destinatario tiene ${ageLabel}. Duración aproximada al leer en voz alta: ${request.durationMinutes} minutos. Idioma único del cuento: ${languageName[request.language]}.

REGLAS FIJAS DE LA COLECCIÓN
- Narrador en tercera persona clásica.
- Tono cálido, claro, elegante y nunca cursi. Adapta el tono al tema.
- Termina con una reflexión breve y explícita sobre lo aprendido, también en tercera persona.
- El cuento debe ser comprensible sin haber leído ningún otro libro de la colección.
- No hables directamente al niño en segunda persona salvo que sea imprescindible dentro de un diálogo.
- Respeta la edad: vocabulario, longitud de frases, densidad conceptual y ritmo apropiados.

MODO: ${request.mode}
${
  request.mode === "historical"
    ? `- Máximo rigor histórico. Los hechos, fechas, relaciones y acontecimientos centrales deben ser verídicos.
- Se permiten pequeñas licencias narrativas para describir ambiente, transiciones o diálogos plausibles, pero nunca inventar como hecho histórico algo materialmente falso.
- Prioriza aspectos interesantes, bellos, curiosos y formativos, sin convertir al personaje histórico en un héroe perfecto.`
    : `- Trabaja solamente con hechos familiares proporcionados por el usuario o presentes en la ficha familiar.
- No inventes recuerdos, viajes, personalidades ni hechos biográficos como si fueran reales.
- Puedes embellecer la narración y describir escenas de forma literaria siempre que no alteres los hechos.`
}

TEMA O PETICIÓN
${request.topic}

NOTAS/TRANSCRIPCIÓN DEL USUARIO
${request.rawNotes || "No se añadieron notas."}

FICHA FAMILIAR (úsala solo cuando sea relevante)
${familyContext}

SALIDA
Devuelve SOLO JSON válido, sin markdown ni texto adicional, con esta estructura exacta:
{
  "title": "...",
  "story": "...",
  "reflection": "...",
  "illustrationScenes": [
    {"title": "...", "description": "..."}
  ]
}

En illustrationScenes propone entre 3 y 8 escenas visuales importantes. No generes imágenes; solo describe escenas que después puedan ilustrarse en acuarela.
`.trim();
}

export function buildIllustrationPrompt(args: {
  storyTitle: string;
  sceneTitle: string;
  sceneDescription: string;
  customStyle?: string;
}) {
  return `
Create a children's book illustration for the private family collection "Octavio Story Library".
Book: ${args.storyTitle}
Scene: ${args.sceneTitle}
Scene description: ${args.sceneDescription}

Default visual identity: classic warm watercolor, hand-painted paper texture, refined children's-book composition, gentle natural light, expressive but not cartoonishly exaggerated, timeless European picture-book feeling. No text, no captions, no typography.
${args.customStyle ? `Custom style override: ${args.customStyle}` : "Use the default watercolor identity."}

The image must work as a square 8x8-inch picture-book page/crop. Keep important faces and objects away from the extreme edges so later print bleed/cropping is safe.
`.trim();
}
