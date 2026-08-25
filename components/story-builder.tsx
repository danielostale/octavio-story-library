"use client";

import { useState } from "react";
import type { LibraryEntry, Story, StoryLanguage, StoryMode } from "@/lib/types";

const languageLabels: Record<StoryLanguage, string> = {
  es: "Español",
  fr: "Français",
  en: "English",
};

function chatGptPackage(story: Story) {
  const scenes = story.illustrationScenes
    .map(
      (scene, i) =>
        `${i + 1}. ${scene.title}\n   Ilustración: ${scene.description}`,
    )
    .join("\n\n");

  return `QUIERO CONVERTIR ESTE CUENTO EN UN LIBRO INFANTIL ILUSTRADO Y PDF FINAL.\n\nNo reescribas la historia salvo correcciones tipográficas mínimas.\nTrabaja como editor, director de arte e ilustrador.\n\nDATOS DEL LIBRO\n- Título: ${story.title}\n- Edad objetivo: ${story.childAgeLabel}\n- Idioma: ${story.language}\n- Duración aproximada de lectura: ${story.durationMinutes} minutos\n- Formato final preferido: libro infantil cuadrado 8 x 8 pulgadas\n- Estilo visual por defecto: acuarela clásica, cálida, elegante, coherente entre páginas, infantil pero no cursi.\n- Mantén consistencia absoluta de personajes, vestuario, lugares y época.\n- Si existen fotos de referencia adjuntas en esta conversación, úsalas para conservar el parecido de los personajes familiares.\n- Para personajes históricos, respeta vestimenta, arquitectura, objetos y contexto de época razonablemente documentados.\n- No añadas texto dentro de las ilustraciones salvo que forme parte natural de la escena.\n- El PDF debe quedar preparado para impresión, con márgenes y sangrado razonables.\n\nTEXTO DEL CUENTO\n\n${story.story}\n\nREFLEXIÓN FINAL\n\n${story.reflection}\n\nPLAN VISUAL SUGERIDO\n\n${scenes}\n\nTAREA\n1. Decide una paginación adecuada para este texto y esta edad.\n2. Crea portada, páginas interiores ilustradas y contraportada.\n3. Mantén el texto legible y con espacio visual suficiente.\n4. Genera las ilustraciones necesarias manteniendo un único lenguaje visual.\n5. Maqueta el libro completo.\n6. Entrega un PDF final listo para imprimir.\n7. Nombra el archivo de forma clara usando el título del cuento.\n8. Antes de generar, si falta una foto imprescindible para representar fielmente a una persona real, pídemela. Si no es imprescindible, continúa sin preguntar.\n`;
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

        <button
          className="primary wide"
          disabled={busy || !topic.trim()}
          onClick={generateStory}
        >
          {busy ? "Escribiendo…" : "Crear cuento"}
        </button>

        {status && <p className="muted">{status}</p>}
      </section>

      {story && (
        <article className="storySheet">
          <div className="storyTop">
            <div>
              <p className="eyebrow">BORRADOR</p>
              <h2>{story.title}</h2>
            </div>

            <div className="storyActions">
              <button className="secondary" onClick={saveStory}>
                Guardar en Drive
              </button>
              <button className="primary" onClick={copyForChatGPT}>
                Copiar para ChatGPT
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

            <p className="notice">
              Cuando este cuento te encante, pulsa “Copiar para ChatGPT”. La app
              preparará todas las instrucciones para convertirlo en libro
              ilustrado y PDF sin usar una API de imágenes de pago.
            </p>

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
