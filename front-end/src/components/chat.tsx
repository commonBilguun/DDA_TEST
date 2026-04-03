"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { streamPersonaChat, getPersonas, deletePersona, Persona } from "@/lib/api";
import { CreatePersonaModal } from "@/components/create-persona-modal";
import { PersonaSidebar } from "@/components/persona-sidebar";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  content: string;
}

function welcomeForPersona(persona: Persona) {
  return `Hi! I'm ${persona.name}. Feel free to talk to me — I'll stay fully in character. What's on your mind?`;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  // Persona state
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load personas on mount
  useEffect(() => {
    getPersonas().then(setPersonas).catch(console.error);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function selectPersona(persona: Persona) {
    setSelectedPersona(persona);
    setMessages([{ id: "welcome", role: "assistant", content: welcomeForPersona(persona) }]);
  }

  function handlePersonaCreated(persona: Persona) {
    setPersonas((prev) => [...prev, persona]);
    setShowCreateModal(false);
    selectPersona(persona);
  }

  async function handleDeletePersona(id: string) {
    await deletePersona(id).catch(console.error);
    setPersonas((prev) => prev.filter((p) => p.id !== id));
    if (selectedPersona?.id === id) {
      setSelectedPersona(null);
      setMessages([]);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    // Snapshot history before state update, exclude synthetic welcome and empty messages, easy way to create context window, or context about conversation.
    const history = messages
      .filter((m) => m.id !== "welcome" && m.content.trim() !== "")
      .map((m) => ({ role: m.role, content: m.content }));

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const onChunk = (chunk: string) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
      );
    const onDone = () => setStreaming(false);
    const onError = (err: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `⚠️ Error: ${err}` } : m
        )
      );
      setStreaming(false);
    };

    if (selectedPersona) {
      await streamPersonaChat(selectedPersona.id, text, history, onChunk, onDone, onError);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const displayName = selectedPersona ? selectedPersona.name : "No persona selected";
  const avatarLabel = selectedPersona
    ? selectedPersona.name.slice(0, 2).toUpperCase()
    : "–";
  const subtitle = selectedPersona
    ? `Persona · ${selectedPersona.gender} · Born ${selectedPersona.birthdate}`
    : "Select a persona from the sidebar to start chatting";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left sidebar */}
      <PersonaSidebar
        personas={personas}
        selectedPersona={selectedPersona}
        onSelectPersona={selectPersona}
        onDeletePersona={handleDeletePersona}
        onNewPersona={() => setShowCreateModal(true)}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="border-b px-4 py-3 flex items-center gap-3 bg-card shadow-sm shrink-0">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {avatarLabel}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          </div>
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              !selectedPersona
                ? "bg-muted-foreground"
                : streaming
                ? "bg-yellow-400 animate-pulse"
                : "bg-green-500"
            )}
          />
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {!selectedPersona ? (
              <div className="flex flex-col items-center justify-center h-full py-24 gap-3 text-center">
                <p className="text-sm font-medium">No persona selected</p>
                <p className="text-xs text-muted-foreground">
                  Pick a persona from the sidebar, or create a new one to start chatting.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-semibold",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.role === "user" ? "U" : avatarLabel}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {msg.content}
                  {streaming &&
                    msg.role === "assistant" &&
                    msg === messages[messages.length - 1] && (
                      <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-text-bottom" />
                    )}
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t bg-card px-4 py-3 shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                selectedPersona
                  ? `Message ${selectedPersona.name}…`
                  : "Select a persona to start chatting…"
              }
              disabled={streaming || !selectedPersona}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={sendMessage}
              disabled={streaming || !selectedPersona || !input.trim()}
              size="icon"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Create persona modal */}
      {showCreateModal && (
        <CreatePersonaModal
          onCreated={handlePersonaCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

