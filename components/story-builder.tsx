"use client";

import { useState } from "react";
import type { LibraryEntry, Story, StoryLanguage, StoryMode } from "@/lib/types";

const languageLabels: Record<StoryLanguage, string> = {
  es: "Español",
  fr: "Français",
  en: "English",
};

function languageName(language: StoryLanguage) {
  return languageLabels[language];
}

function chatGptBookPrompt({
  topic,
  mode,
  language,
  duration,
  rawNotes,
}: {
  topic: string;
  mode: StoryMode;
  language: StoryLanguage;
  duration: number;
  rawNotes: string;
}) {
  const isHistorical = mode === "historical";
  const notes = rawNotes.trim()
    ? rawNotes.trim()
    : "No hay notas adicionales. No inventes recuerdos familiares como hechos.";

  return `QUIERO QUE CREES UN LIBRO INFANTIL COMPLETO PARA LA BIBLIOTECA FAMILIAR DE OCTAVIO.

OBJETIVO
Crea el libro final, no solo un borrador de cuento. Actúa como investigador, escritor infantil, editor, director de arte, ilustrador y maquetador. Toma decisiones razonables por tu cuenta y evita hacerme preguntas salvo que falte un dato realmente imprescindible.

DESTINO / BIBLIOTECA
- Esta obra pertenece a la biblioteca familiar "Octavio Story Library" de mi Google Drive.
- Si tienes acceso a mi Google Drive conectado, localiza esa biblioteca y guarda allí el resultado en la categoría adecuada: ${isHistorical ? "stories/historical" : "stories/personal"}.
- Crea una carpeta propia para este libro con un nombre limpio derivado del título final.
- Guarda, cuando sea posible: el texto maestro, los recursos/ilustraciones generados y el PDF final listo para imprimir.
- Si en esta conversación no tienes permiso de escritura en Drive, NO detengas el trabajo: crea igualmente todos los artefactos y entrégamelos para que puedan guardarse después.

ENCARGO
- Tema: ${topic.trim()}
- Tipo: ${isHistorical ? "Historia / conocimiento" : "Historia personal / familiar"}
- Idioma de TODO el libro: ${languageName(language)}
- Duración aproximada de lectura: ${duration} minutos
- Lector: niño pequeño; adapta vocabulario, ritmo, longitud de frases, carga conceptual y densidad visual a una edad infantil temprana.
- Voz narrativa: tercera persona clásica.
- Tono: cálido, elegante, curioso y claro; nunca cursi ni condescendiente.
- El cuento debe funcionar de manera autónoma.
- Termina con una reflexión breve y explícita en tercera persona.

${isHistorical ? `RIGOR HISTÓRICO
- Prioriza al máximo la precisión factual.
- Puedes usar pequeñas libertades narrativas para dar fluidez, pero nunca inventes acontecimientos históricos centrales, relaciones, fechas o hechos importantes.
- Si el tema tiene puntos discutidos, usa la interpretación más respaldada y evita presentar como cierto lo que sea especulativo.
- Vestuario, arquitectura, objetos, tecnología, geografía y ambiente visual deben ser razonablemente coherentes con la época.` : `FIDELIDAD FAMILIAR
- No inventes recuerdos, viajes, conversaciones, parentescos o rasgos personales como si fueran hechos.
- Usa únicamente la información incluida abajo o información familiar disponible de forma explícita en mis fuentes conectadas.
- Si hay fotos familiares disponibles en esta conversación o en una fuente conectada y son útiles, empléalas únicamente como referencia visual.

NOTAS / RECUERDOS A UTILIZAR
${notes}`}

FORMATO DEL LIBRO
- Libro infantil cuadrado de 8 × 8 pulgadas.
- Diseña una paginación adecuada al texto y a la duración solicitada.
- Incluye portada, páginas interiores y contraportada.
- Mantén una relación equilibrada entre texto e imagen; evita páginas saturadas.
- Tipografía grande y legible, con márgenes seguros.
- Prepara el PDF final para impresión con márgenes y sangrado razonables.
- No pongas texto generado dentro de las ilustraciones; el texto se compone después en la maqueta.

DIRECCIÓN ARTÍSTICA
- Estilo por defecto: acuarela clásica contemporánea, cálida y elegante, infantil pero no cursi.
- Mantén continuidad absoluta de personajes, edades aparentes, rasgos, vestuario, paleta general, lugares y época entre ilustraciones.
- Las imágenes deben tener composición editorial, dejar zonas respirables para el texto y funcionar como un libro coherente, no como imágenes independientes.
- Si aparecen personas reales y dispones de referencias visuales, conserva el parecido sin buscar hiperrealismo.

PROCESO QUE QUIERO QUE SIGAS
1. Define silenciosamente el enfoque narrativo y verifica los hechos necesarios antes de escribir.
2. Escribe el cuento completo en ${languageName(language)} con la duración indicada.
3. Revisa coherencia, ritmo, adecuación infantil y precisión factual/familiar.
4. Divide el texto en páginas o dobles páginas.
5. Diseña un storyboard de ilustraciones, indicando qué aparece en cada escena y cómo mantener continuidad visual.
6. Genera las ilustraciones necesarias.
7. Maqueta portada, interiores y contraportada en 8 × 8 pulgadas.
8. Produce el PDF final listo para imprimir.
9. Usa un nombre de archivo limpio basado en el título final.
10. Si puedes escribir en mi Google Drive conectado, guarda el proyecto completo dentro de "Octavio Story Library" en la categoría indicada arriba.

CRITERIO DE CALIDAD
No quiero una respuesta explicándome cómo hacerlo. Quiero que hagas el trabajo y produzcas el libro. Si alguna fase no puede ejecutarse técnicamente en una sola respuesta, avanza todo lo posible y continúa por fases manteniendo exactamente el mismo proyecto, texto y dirección artística hasta completar el PDF final.`;
}

function chatGptPackage(story: Story) {
  const scenes = story.illustrationScenes
    .map(
      (scene, i) =>
        `${i + 1}. ${scene.title}\n   Ilustración: ${scene.description}`,
    )
    .join("\n\n");

  return `QUIERO CONVERTIR ESTE CUENTO EN UN LIBRO INFANTIL ILUSTRADO Y PDF FINAL.\n\nNo reescribas la historia salvo correcciones tipográficas mínimas.\nTrabaja como editor, director de arte e ilustrador.\n\nDESTINO\nSi tienes acceso a mi Google Drive conectado, guarda el proyecto y el PDF final dentro de la biblioteca \"Octavio Story Library\". Si no puedes escribir allí, genera igualmente todos los artefactos.\n\nDATOS DEL LIBRO\n- Título: ${story.title}\n- Edad objetivo: ${story.childAgeLabel}\n- Idioma: ${story.language}\n- Duración aproximada de lectura: ${story.durationMinutes} minutos\n- Formato final preferido: libro infantil cuadrado 8 x 8 pulgadas\n- Estilo visual por defecto: acuarela clásica, cálida, elegante, coherente entre páginas, infantil pero no cursi.\n- Mantén consistencia absoluta de personajes, vestuario, lugares y época.\n- Si existen fotos de referencia adjuntas en esta conversación, úsalas para conservar el parecido de los personajes familiares.\n- Para personajes históricos, respeta vestimenta, arquitectura, objetos y contexto de época razonablemente documentados.\n- No añadas texto dentro de las ilustraciones salvo que forme parte natural de la escena.\n- El PDF debe quedar preparado para impresión, con márgenes y sangrado razonables.\n\nTEXTO DEL CUENTO\n\n${story.story}\n\nREFLEXIÓN FINAL\n\n${story.reflection}\n\nPLAN VISUAL SUGERIDO\n\n${scenes}\n\nTAREA\n1. Decide una paginación adecuada para este texto y esta edad.\n2. Crea portada, páginas interiores ilustradas y contraportada.\n3. Mantén el texto legible y con espacio visual suficiente.\n4. Genera las ilustraciones necesarias manteniendo un único lenguaje visual.\n5. Maqueta el libro completo.\n6. Entrega un PDF final listo para imprimir.\n7. Nombra el archivo de forma clara usando el título del cuento.\n8. Si puedes escribir en Google Drive, guarda el proyecto completo en \"Octavio Story Library\".\n9. Antes de generar, si falta una foto imprescindible para representar fielmente a una persona real, pídemela. Si no es imprescindible, continúa sin preguntar.\n`;
}

export function StoryBuilder({ recommendedDuration }: { recommendedDuration: number }) {
  const [mode, setMode] = useState<StoryMode>("historical");
  const [language, setLanguage] = useState<StoryLanguage>("es");
  const [duration, setDuration] = useState(recommendedDuration);
  const [topic, setTopic] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [story, setStory] = useState<Story | null>(null);
  const [savedEntry, setSavedEntry] = useState<LibraryEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [listening, setListening] = useState(false);

  async function generateStory() {
    setBusy(true);
    setStatus("");
    setStory(null);
    setSavedEntry(null);

    try {
      const r = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          mode,
          language,
          durationMinutes: duration,
          rawNotes,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear el cuento");
      setStory(data);
    } catch (e: any) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyBookPromptForChatGPT() {
    if (!topic.trim()) return;
    const text = chatGptBookPrompt({ topic, mode, language, duration, rawNotes });

    try {
      await navigator.clipboard.writeText(text);
      setStatus(
        "Prompt de libro copiado ✓ Pégalo en ChatGPT para crear la versión completa.",
      );
    } catch {
      setStatus("No se pudo copiar automáticamente el prompt.");
    }
  }

  async function saveStory() {
    if (!story) return;

    setStatus("Guardando…");
    const r = await fetch("/api/drive/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(story),
    });

    const data = await r.json();
    if (!r.ok) {
      setStatus(data.error || "No se pudo guardar");
      return;
    }

    setSavedEntry(data);
    setStatus("Guardado en Drive ✓");
  }

  async function copyForChatGPT() {
    if (!story) return;
    const text = chatGptPackage(story);

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Prompt completo copiado. Ya puedes pegarlo en ChatGPT ✓");
    } catch {
      setStatus("No se pudo copiar automáticamente.");
    }
  }

  function dictate() {
    const w = window as any;
    const SpeechRecognition =
      w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus(
        "El dictado del navegador no está disponible aquí. Puedes usar el dictado del teclado del móvil o escribir las notas.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang =
      language === "es" ? "es-ES" : language === "fr" ? "fr-FR" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setStatus("Escuchando… habla con normalidad.");
    };

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setRawNotes((prev) => [prev, text.trim()].filter(Boolean).join("\n\n"));
    };

    recognition.onerror = () => {
      setStatus("El dictado se ha detenido. Puedes volver a pulsar Hablar.");
    };

    recognition.onend = () => {
      setListening(false);
      setStatus("Dictado añadido ✓");
    };

    recognition.start();
  }

  return (
    <div className="stack">
      <section className="panel formPanel">
        <div className="segmented">
          <button
            className={mode === "historical" ? "active" : ""}
            onClick={() => setMode("historical")}
          >
            Historia / conocimiento
          </button>
          <button
            className={mode === "personal" ? "active" : ""}
            onClick={() => setMode("personal")}
          >
            Historia personal
          </button>
        </div>

        <label>
          ¿En qué idioma?
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as StoryLanguage)}
          >
            {Object.entries(languageLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          ¿Cuánto debe durar?
          <div className="durationRow">
            {[3, 5, 7, 10, 15].map((n) => (
              <button
                key={n}
                type="button"
                className={`duration ${duration === n ? "selected" : ""}`}
                onClick={() => setDuration(n)}
              >
                {n} min{n === recommendedDuration ? " · recomendado" : ""}
              </button>
            ))}
          </div>
        </label>

        <label>
          {mode === "historical"
            ? "¿Sobre qué quieres el cuento?"
            : "¿Qué historia familiar quieres contar?"}
          <textarea
            className="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              mode === "historical"
                ? "Ej. Octavio Augusto y cómo cambió Roma"
                : "Ej. Nuestro viaje a Costa Rica"
            }
          />
        </label>

        {mode === "personal" && (
          <div>
            <div className="labelLine">
              <span>Cuéntame los detalles</span>
              <button
                type="button"
                className={listening ? "recording" : "secondary"}
                onClick={dictate}
                disabled={listening}
              >
                {listening ? "Escuchando…" : "● Hablar"}
              </button>
            </div>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Escribe aquí o pulsa Hablar. También puedes usar el micrófono del teclado del móvil."
            />
          </div>
        )}

        <div className="stack">
          <button
            className="primary wide"
            disabled={!topic.trim()}
            onClick={copyBookPromptForChatGPT}
          >
            ✦ Crear libro completo con ChatGPT
          </button>
          <p className="muted small">
            Copia un encargo editorial completo para que ChatGPT escriba,
            ilustre, maquete y prepare el PDF final, usando la biblioteca de
            Google Drive como destino cuando esté conectada.
          </p>

          <button
            className="secondary wide"
            disabled={busy || !topic.trim()}
            onClick={generateStory}
          >
            {busy ? "Escribiendo…" : "⚡ Hacer versión rápida con Gemini"}
          </button>
          <p className="muted small">
            Genera rápidamente el cuento dentro de esta app. Después puedes
            guardarlo en Drive o convertirlo en libro con ChatGPT.
          </p>
        </div>

        {status && <p className="muted">{status}</p>}
      </section>

      {story && (
        <article className="storySheet">
          <div className="storyTop">
            <div>
              <p className="eyebrow">BORRADOR RÁPIDO · GEMINI</p>
              <h2>{story.title}</h2>
            </div>

            <div className="storyActions">
              <button className="secondary" onClick={saveStory}>
                Guardar en Drive
              </button>
              <button className="primary" onClick={copyForChatGPT}>
                Convertir en libro con ChatGPT
              </button>
            </div>
          </div>

          <div className="storyText">
            {story.story
              .split("\n")
              .map((p, i) => p.trim() && <p key={i}>{p}</p>)}
          </div>

          <aside className="reflection">
            <strong>Lo que hemos aprendido</strong>
            <p>{story.reflection}</p>
          </aside>

          <section className="scenes">
            <div className="sectionHead">
              <div>
                <p className="eyebrow">PLAN DEL LIBRO</p>
                <h3>Escenas propuestas para ilustrar</h3>
              </div>
              <span className="muted small">
                Acuarela por defecto · formato 8×8
              </span>
            </div>

            {story.illustrationScenes.map((scene, index) => (
              <div className="scene" key={`${scene.title}-${index}`}>
                <div className="sceneCopy">
                  <strong>
                    {index + 1}. {scene.title}
                  </strong>
                  <p>{scene.description}</p>
                </div>
              </div>
            ))}
          </section>

          {savedEntry && (
            <p className="muted small">Guardado en Drive ✓</p>
          )}
        </article>
      )}
    </div>
  );
}
