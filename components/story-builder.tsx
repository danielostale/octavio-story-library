"use client";

import { useRef, useState } from "react";
import type { LibraryEntry, Story, StoryLanguage, StoryMode } from "@/lib/types";

const languageLabels: Record<StoryLanguage, string> = {
  es: "Español",
  fr: "Français",
  en: "English",
};

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
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [imageBusy, setImageBusy] = useState<number | null>(null);

  async function generateStory() {
    setBusy(true); setStatus(""); setStory(null); setSavedEntry(null); setImages({});
    try {
      const r = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, mode, language, durationMinutes: duration, rawNotes }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear el cuento");
      setStory(data);
    } catch (e: any) { setStatus(e.message); }
    finally { setBusy(false); }
  }

  async function saveStory() {
    if (!story) return;
    setStatus("Guardando…");
    const r = await fetch("/api/drive/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(story) });
    const data = await r.json();
    if (!r.ok) { setStatus(data.error || "No se pudo guardar"); return; }
    setSavedEntry(data); setStatus("Guardado en Drive ✓");
  }

  async function generateImage(index: number) {
    if (!story) return;
    const scene = story.illustrationScenes[index];
    setImageBusy(index);
    try {
      const r = await fetch("/api/illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyTitle: story.title, sceneTitle: scene.title, sceneDescription: scene.description }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "No se pudo crear la ilustración");
      const src = data.b64 ? `data:image/png;base64,${data.b64}` : data.url;
      if (src) setImages((prev) => ({ ...prev, [index]: src }));

      if (savedEntry?.folderId && data.b64) {
        await fetch("/api/drive/illustration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyFolderId: savedEntry.folderId,
            filename: `${String(index + 1).padStart(2, "0")}-${scene.title.replace(/[^a-z0-9áéíóúüñ -]/gi, "").slice(0, 50)}.png`,
            b64: data.b64,
          }),
        });
      }
    } catch (e: any) { setStatus(e.message); }
    finally { setImageBusy(null); }
  }

  async function toggleRecording() {
    if (recording && mediaRecorder.current) {
      mediaRecorder.current.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        const form = new FormData();
        form.append("audio", blob, "story-audio.webm");
        setStatus("Transcribiendo…");
        try {
          const r = await fetch("/api/transcribe", { method: "POST", body: form });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "No se pudo transcribir");
          setRawNotes((prev) => [prev, data.text].filter(Boolean).join("\n\n"));
          setStatus("Transcripción añadida ✓");
        } catch (e: any) { setStatus(e.message); }
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setStatus("El navegador no pudo acceder al micrófono.");
    }
  }

  return (
    <div className="stack">
      <section className="panel formPanel">
        <div className="segmented">
          <button className={mode === "historical" ? "active" : ""} onClick={() => setMode("historical")}>Historia / conocimiento</button>
          <button className={mode === "personal" ? "active" : ""} onClick={() => setMode("personal")}>Historia personal</button>
        </div>

        <label>¿En qué idioma?
          <select value={language} onChange={(e) => setLanguage(e.target.value as StoryLanguage)}>
            {Object.entries(languageLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>

        <label>¿Cuánto debe durar?
          <div className="durationRow">
            {[3, 5, 7, 10, 15].map((n) => (
              <button key={n} type="button" className={`duration ${duration === n ? "selected" : ""}`} onClick={() => setDuration(n)}>{n} min{n === recommendedDuration ? " · recomendado" : ""}</button>
            ))}
            {!([3, 5, 7, 10, 15].includes(recommendedDuration)) && (
              <button type="button" className={`duration ${duration === recommendedDuration ? "selected" : ""}`} onClick={() => setDuration(recommendedDuration)}>{recommendedDuration} min · recomendado</button>
            )}
          </div>
        </label>

        <label>{mode === "historical" ? "¿Sobre qué quieres el cuento?" : "¿Qué historia familiar quieres contar?"}
          <textarea className="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={mode === "historical" ? "Ej. Octavio Augusto y cómo cambió Roma" : "Ej. Nuestro viaje a Costa Rica"} />
        </label>

        {mode === "personal" && (
          <div>
            <div className="labelLine"><span>Cuéntame los detalles</span><button type="button" className={recording ? "recording" : "secondary"} onClick={toggleRecording}>{recording ? "■ Terminar grabación" : "● Hablar"}</button></div>
            <textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} placeholder="Puedes escribir aquí o pulsar Hablar y contarlo de forma natural…" />
          </div>
        )}

        <button className="primary wide" disabled={busy || !topic.trim()} onClick={generateStory}>{busy ? "Escribiendo…" : "Crear cuento"}</button>
        {status && <p className="muted">{status}</p>}
      </section>

      {story && (
        <article className="storySheet">
          <div className="storyTop"><div><p className="eyebrow">BORRADOR</p><h2>{story.title}</h2></div><div className="storyActions"><button className="secondary" onClick={saveStory}>Guardar en Drive</button></div></div>
          <div className="storyText">{story.story.split("\n").map((p, i) => p.trim() && <p key={i}>{p}</p>)}</div>
          <aside className="reflection"><strong>Lo que hemos aprendido</strong><p>{story.reflection}</p></aside>

          <section className="scenes">
            <div className="sectionHead"><div><p className="eyebrow">ILUSTRACIONES</p><h3>Escenas propuestas</h3></div><span className="muted small">Acuarela por defecto · formato 8×8</span></div>
            {!savedEntry && <p className="notice">Consejo: guarda primero el cuento. Así las ilustraciones se archivarán automáticamente en su carpeta de Drive.</p>}
            {story.illustrationScenes.map((scene, index) => (
              <div className="scene" key={`${scene.title}-${index}`}>
                <div className="sceneCopy"><strong>{index + 1}. {scene.title}</strong><p>{scene.description}</p><button className="secondary" disabled={imageBusy === index} onClick={() => generateImage(index)}>{imageBusy === index ? "Pintando…" : "Generar ilustración"}</button></div>
                {images[index] && <img className="sceneImage" src={images[index]} alt={scene.title} />}
              </div>
            ))}
          </section>
        </article>
      )}
    </div>
  );
}
