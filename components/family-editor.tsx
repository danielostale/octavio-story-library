"use client";

import { useEffect, useState } from "react";
import type { FamilyMember, FamilyMemory, FamilyProfile } from "@/lib/types";

const blank: FamilyProfile = { version: 1, members: [], memories: [], updatedAt: "" };

export function FamilyEditor() {
  const [profile, setProfile] = useState<FamilyProfile>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/drive/family")
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  function addMember() {
    setProfile((p) => ({
      ...p,
      members: [...p.members, { id: crypto.randomUUID(), name: "", relationship: "", traits: [], likes: [], notes: "" }],
    }));
  }

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    setProfile((p) => ({ ...p, members: p.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }

  function addMemory() {
    setProfile((p) => ({
      ...p,
      memories: [...p.memories, { id: crypto.randomUUID(), title: "", detail: "", people: [] }],
    }));
  }

  function updateMemory(id: string, patch: Partial<FamilyMemory>) {
    setProfile((p) => ({ ...p, memories: p.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  }

  async function save() {
    setSaving(true); setStatus("");
    try {
      const r = await fetch("/api/drive/family", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (!r.ok) throw new Error((await r.json()).error || "No se pudo guardar");
      setProfile(await r.json());
      setStatus("Guardado en Drive");
    } catch (e: any) { setStatus(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="muted">Cargando ficha…</p>;

  return (
    <div className="stack">
      <section className="panel">
        <div className="sectionHead"><h2>Personas</h2><button className="secondary" onClick={addMember}>+ Añadir</button></div>
        {profile.members.map((m) => (
          <div className="subpanel" key={m.id}>
            <div className="twoCols">
              <label>Nombre<input value={m.name} onChange={(e) => updateMember(m.id, { name: e.target.value })} /></label>
              <label>Relación con Octavio<input value={m.relationship} onChange={(e) => updateMember(m.id, { relationship: e.target.value })} /></label>
            </div>
            <label>Rasgos (separados por comas)<input value={m.traits.join(", ")} onChange={(e) => updateMember(m.id, { traits: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} /></label>
            <label>Le gusta…<input value={m.likes.join(", ")} onChange={(e) => updateMember(m.id, { likes: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} /></label>
            <label>Notas narrativas<textarea value={m.notes} onChange={(e) => updateMember(m.id, { notes: e.target.value })} /></label>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="sectionHead"><h2>Recuerdos</h2><button className="secondary" onClick={addMemory}>+ Añadir</button></div>
        {profile.memories.map((m) => (
          <div className="subpanel" key={m.id}>
            <label>Título<input value={m.title} onChange={(e) => updateMemory(m.id, { title: e.target.value })} /></label>
            <label>Qué ocurrió<textarea value={m.detail} onChange={(e) => updateMemory(m.id, { detail: e.target.value })} /></label>
            <label>Personas (separadas por comas)<input value={m.people.join(", ")} onChange={(e) => updateMemory(m.id, { people: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} /></label>
          </div>
        ))}
      </section>
      <div className="actions"><button className="primary" disabled={saving} onClick={save}>{saving ? "Guardando…" : "Guardar ficha"}</button><span className="muted">{status}</span></div>
    </div>
  );
}
