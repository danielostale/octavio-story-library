"use client";

import { useRef, useState } from "react";
import type { StoryLanguage } from "@/lib/types";

const languageLabels: Record<StoryLanguage, string> = {
  es: "Español",
  fr: "Français",
  en: "English",
};

function promptForChatGPT({
  topic,
  language,
  duration,
  transcript,
}: {
  topic: string;
  language: StoryLanguage;
  duration: number;
  transcript: string;
}) {
  return `QUIERO QUE CREES UN LIBRO INFANTIL COMPLETO BASADO EN UN RECUERDO FAMILIAR REAL.\n\nDESTINO\n- Este proyecto pertenece a mi biblioteca familiar \"Octavio Story Library\" en Google Drive.\n- Si tienes acceso a mi Google Drive conectado, guarda el proyecto en stories/personal dentro de esa biblioteca.\n- Crea una carpeta propia para el libro y guarda allí el texto maestro, ilustraciones y PDF final.\n- Si no tienes permiso de escritura, no te detengas: crea igualmente todos los artefactos.\n\nDATOS\n- Tema: ${topic.trim()}\n- Idioma: ${languageLabels[language]}\n- Duración de lectura: ${duration} minutos\n- Formato: libro infantil cuadrado 8 × 8 pulgadas\n- Voz: tercera persona clásica\n- Tono: cálido, elegante, natural y afectuoso; nunca cursi.\n\nFUENTE FACTUAL PRINCIPAL: TRANSCRIPCIÓN DEL RECUERDO\n${transcript.trim()}\n\nREGLAS DE FIDELIDAD\n- La transcripción anterior es la fuente de verdad.\n- NO inventes recuerdos, conversaciones, viajes, parentescos, fechas, detalles ni emociones como si hubieran sucedido.\n- Puedes reorganizar y redactar para convertir el recuerdo en un cuento fluido, pero cualquier detalle factual debe proceder de la transcripción o de información familiar explícitamente disponible en mis fuentes conectadas.\n- Si falta un dato secundario, omítelo o formula la escena de modo que no requiera inventarlo.\n- Si falta un dato verdaderamente imprescindible, pregúntamelo antes de inventarlo.\n\nLIBRO\n1. Escribe el cuento completo adaptado a un niño pequeño y a la duración indicada.\n2. Termina con una reflexión breve y explícita en tercera persona.\n3. Divide el cuento en una paginación adecuada.\n4. Diseña un storyboard coherente de ilustraciones.\n5. Estilo visual: acuarela clásica contemporánea, cálida y elegante, infantil pero no cursi.\n6. Mantén continuidad absoluta de personajes, edades aparentes, rasgos, vestuario y lugares.\n7. Si existen fotos familiares disponibles en esta conversación o en una fuente conectada, úsalas como referencia visual. Si para representar fielmente a una persona real necesitas una foto que no tienes, pídemela.\n8. Genera portada, interiores y contraportada.\n9. Maqueta el libro completo en 8 × 8 pulgadas con márgenes seguros y sangrado razonable.\n10. Produce un PDF final listo para imprimir y usa un nombre de archivo limpio basado en el título.\n\nNo quiero instrucciones sobre cómo hacerlo. Quiero que hagas el trabajo y avances por fases hasta completar el libro.`;
}

export function PersonalStoryBuilder({ recommendedDuration }: { recommendedDuration: number }) {
  const [language, setLanguage] = useState<StoryLanguage>("es");
  const [duration, setDuration] = useState(recommendedDuration);
  const [topic, setTopic] = useState("");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };

      recorder.onstart = () => {
        setRecording(true);
        setStatus("Grabando… cuéntalo con naturalidad.");
      };

      recorder.onstop = async () => {
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        setStatus("Gemini está transcribiendo…");

        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const form = new FormData();
          form.append("audio", blob, "recuerdo.webm");
          form.append("language", language);

          const response = await fetch("/api/transcribe-gemini", {
            method: "POST",
            body: form,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "No se pudo transcribir");

          setTranscript((previous) =>
            [previous.trim(), String(data.text || "").trim()].filter(Boolean).join("\n\n"),
          );
          setStatus("Transcripción de Gemini añadida ✓");
        } catch (error: any) {
          setStatus(error?.message || "No se pudo transcribir el audio.");
        }
      };

      recorderRef.current = recorder;
      recorder.start();
    } catch {
      setStatus("No se pudo acceder al micrófono.");
    }
  }

  async function quickGemini() {
    if (!topic.trim() || !transcript.trim()) return;
    setBusy(true);
    setStatus("Gemini está preparando la versión rápida…");
    try {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          mode: "personal",
          language,
          durationMinutes: duration,
          rawNotes: transcript,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear el cuento");
      localStorage.setItem("octavio-last-personal-story", JSON.stringify(data));
      setStatus(`Versión rápida creada: “${data.title}” ✓`);
    } catch (error: any) {
      setStatus(error?.message || "No se pudo crear el cuento.");
    } finally {
      setBusy(false);
    }
  }

  async function copyChatGPTPrompt() {
    if (!topic.trim() || !transcript.trim()) return;
    try {
      await navigator.clipboard.writeText(
        promptForChatGPT({ topic, language, duration, transcript }),
      );
      setStatus("Prompt familiar para ChatGPT copiado ✓");
    } catch {
      setStatus("No se pudo copiar automáticamente el prompt.");
    }
  }

  return (
    <div className="stack">
      <section className="panel formPanel">
        <label>
          ¿En qué idioma?
          <select value={language} onChange={(e) => setLanguage(e.target.value as StoryLanguage)}>
            {Object.entries(languageLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
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
          ¿Qué historia familiar quieres contar?
          <textarea
            className="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ej. Cómo se conocieron los abuelos"
          />
        </label>

        <div>
          <div className="labelLine">
            <span>Cuéntamela hablando</span>
            <button
              type="button"
              className={recording ? "recording" : "secondary"}
              onClick={toggleRecording}
            >
              {recording ? "■ Terminar" : "● Grabar con Gemini"}
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="La transcripción de Gemini aparecerá aquí. Puedes corregirla o añadir detalles antes de generar el cuento."
          />
        </div>

        <div className="storyActions">
          <button
            type="button"
            className="primary"
            disabled={!topic.trim() || !transcript.trim()}
            onClick={copyChatGPTPrompt}
          >
            ✦ Preparar para ChatGPT
          </button>
          <button
            type="button"
            className="secondary"
            disabled={busy || !topic.trim() || !transcript.trim()}
            onClick={quickGemini}
          >
            {busy ? "Creando…" : "⚡ Versión rápida con Gemini"}
          </button>
        </div>

        <p className="muted small">
          ChatGPT recibe la transcripción como fuente factual y tiene prohibido inventar recuerdos. Gemini sirve para una versión rápida dentro de la app.
        </p>

        {status && <p className="muted">{status}</p>}
      </section>
    </div>
  );
}
