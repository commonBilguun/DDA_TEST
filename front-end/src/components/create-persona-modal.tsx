"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPersona, Persona, PersonaCreate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  onCreated: (persona: Persona) => void;
  onClose: () => void;
}

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say", "Other"];

const EMPTY: PersonaCreate = {
  name: "",
  birthdate: "",
  lived_place: "",
  details: "",
  gender: "",
};

export function CreatePersonaModal({ onCreated, onClose }: Props) {
  const [form, setForm] = useState<PersonaCreate>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof PersonaCreate, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Basic validation
    for (const [key, val] of Object.entries(form)) {
      if (!val.trim()) {
        setError(`"${key.replace("_", " ")}" is required.`);
        return;
      }
    }

    setLoading(true);
    try {
      const persona = await createPersona(form);
      onCreated(persona);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create persona.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-card border shadow-2xl p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-1">Create Persona</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <LabeledField label="Name">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Nikola Bilguun"
            />
          </LabeledField>

          {/* Birthdate */}
          <LabeledField label="Birthdate">
            <Input
              type="date"
              value={form.birthdate}
              onChange={(e) => set("birthdate", e.target.value)}
            />
          </LabeledField>

          {/* Lived place */}
          <LabeledField label="Lived Place">
            <Input
              value={form.lived_place}
              onChange={(e) => set("lived_place", e.target.value)}
              placeholder="e.g. Ulaanbaatar, Mongolia"
            />
          </LabeledField>

          {/* Gender */}
          <LabeledField label="Gender">
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !form.gender && "text-muted-foreground"
              )}
            >
              <option value="" disabled>Select gender…</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </LabeledField>

          {/* Details */}
          <LabeledField label="Details">
            <textarea
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              placeholder="Personality, occupation, background story, quirks…"
              rows={4}
              className={cn(
                "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              )}
            />
          </LabeledField>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create Persona"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {children}
    </div>
  );
}
