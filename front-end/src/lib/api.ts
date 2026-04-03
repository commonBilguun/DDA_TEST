const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7860";

export interface PersonaCreate {
  name: string;
  birthdate: string;
  lived_place: string;
  details: string;
  gender: string;
}

export interface Persona extends PersonaCreate {
  id: string;
  created_at: string;
}


export async function getPersonas(): Promise<Persona[]> {
  const res = await fetch(`${API_URL}/personas`);
  if (!res.ok) throw new Error(`Failed to fetch personas: ${res.status}`);
  return res.json();
}

export async function createPersona(data: PersonaCreate): Promise<Persona> {
  const res = await fetch(`${API_URL}/personas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create persona: ${res.status}`);
  return res.json();
}

export async function deletePersona(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/personas/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete persona: ${res.status}`);
}

async function _stream(
  url: string,
  message: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok || !res.body) {
    onError(`Request failed: ${res.status} ${res.statusText}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") { onDone(); return; }
      if (data.startsWith("Error:")) { onError(data.slice(7).trim()); return; }
      onChunk(data);
    }
  }

  onDone();
}

export async function streamPersonaChat(
  personaId: string,
  message: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<void> {
  return _stream(`${API_URL}/personas/${personaId}/chat/stream`, message, history, onChunk, onDone, onError);
}

