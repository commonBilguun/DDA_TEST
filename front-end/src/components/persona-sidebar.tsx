"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Persona } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Trash2, UserPlus } from "lucide-react";

interface PersonaSidebarProps {
  personas: Persona[];
  selectedPersona: Persona | null;
  onSelectPersona: (persona: Persona) => void;
  onDeletePersona: (id: string) => void;
  onNewPersona: () => void;
}

export function PersonaSidebar({
  personas,
  selectedPersona,
  onSelectPersona,
  onDeletePersona,
  onNewPersona,
}: PersonaSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r bg-card h-screen">
      {/* App title */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-sm font-bold tracking-tight">DDA</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Persona Manager</p>
      </div>

      {/* Persona list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {personas.length > 0 ? (
          <>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Personas
            </p>
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="relative mx-1"
                onMouseEnter={() => setHoveredId(persona.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelectPersona(persona)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-muted pr-8",
                    selectedPersona?.id === persona.id && "bg-muted font-semibold"
                  )}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                      {persona.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 text-left">
                    <p className="truncate leading-none">{persona.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {persona.gender} · {persona.lived_place}
                    </p>
                  </div>
                </button>

                {/* Delete button — visible on hover */}
                {hoveredId === persona.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePersona(persona.id);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Delete ${persona.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </>
        ) : null}
      </nav>

      {/* New Persona button */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onNewPersona}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          New Persona
        </Button>
      </div>
    </aside>
  );
}
