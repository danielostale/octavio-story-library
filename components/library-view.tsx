"use client";

import { useEffect, useState } from "react";
import type { LibraryEntry } from "@/lib/types";

export function LibraryView() {
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/drive/library")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "No se pudo cargar Drive");
        return r.json();
      })
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Cargando biblioteca…</p>;
  if (error) return <div className="notice error">{error}</div>;
  if (!items.length) return <div className="emptyState">Todavía no hay cuentos guardados. Empieza creando el primero.</div>;

  return (
    <div className="libraryGrid">
      {items.map((item) => (
        <article className="bookCard" key={item.id}>
          <div className="bookCover">
            <span>{item.mode === "historical" ? "HISTORIA" : "FAMILIA"}</span>
            <strong>{item.title}</strong>
          </div>
          <div className="bookMeta">
            <span>{item.language.toUpperCase()}</span>
            <span>{item.durationMinutes} min</span>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
