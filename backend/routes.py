import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from agents import Runner

from agent import (
    build_persona_agent,
    load_personas,
    save_personas,
)
from models import ChatRequest, ChatResponse, Persona, PersonaCreate

router = APIRouter()


# - **Framework:** FastAPI
# - **Language:** English 

@router.get("/")
async def root():
    return {
        "name": "DDA Persona Chat",
        "version": "1.0.0",
        "endpoints": {
            "GET /health": "Health check",
            "GET /personas": "List all personas",
            "POST /personas": "Create a persona",
            "GET /personas/{id}": "Get a persona",
            "DELETE /personas/{id}": "Delete a persona",
            "POST /personas/{id}/chat": "Chat with a persona",
            "POST /personas/{id}/chat/stream": "Stream chat with a persona",
        },
    }


@router.get("/health")
async def health():
    return {"status": "ok", "provider": "groq"}

@router.post("/personas", response_model=Persona)
async def create_persona(body: PersonaCreate):
    personas = load_personas()
    persona_id = str(uuid.uuid4())
    persona = Persona(
        id=persona_id,
        created_at=datetime.now(timezone.utc).isoformat(),
        **body.model_dump(),
    )
    personas[persona_id] = persona.model_dump()
    save_personas(personas)
    return persona


@router.get("/personas", response_model=list[Persona])
async def list_personas():
    return list(load_personas().values())


@router.get("/personas/{persona_id}", response_model=Persona)
async def get_persona(persona_id: str):
    personas = load_personas()
    if persona_id not in personas:
        raise HTTPException(status_code=404, detail="Persona not found")
    return personas[persona_id]


@router.delete("/personas/{persona_id}", status_code=204)
async def delete_persona(persona_id: str):
    personas = load_personas()
    if persona_id not in personas:
        raise HTTPException(status_code=404, detail="Persona not found")
    del personas[persona_id]
    save_personas(personas)


@router.post("/personas/{persona_id}/chat", response_model=ChatResponse)
async def persona_chat(persona_id: str, request: ChatRequest):
    personas = load_personas()
    if persona_id not in personas:
        raise HTTPException(status_code=404, detail="Persona not found")
    agent = build_persona_agent(personas[persona_id])
    messages = [*request.history, {"role": "user", "content": request.message}]
    try:
        result = await Runner.run(agent, messages)
        return ChatResponse(response=result.final_output)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# - **AI Streaming:** AI-аас хариу ирж байгаа мэт streaming хэлбэрээр response буцаах.
@router.post("/personas/{persona_id}/chat/stream")
async def persona_chat_stream(persona_id: str, request: ChatRequest):
    personas = load_personas()
    if persona_id not in personas:
        raise HTTPException(status_code=404, detail="Persona not found")
    agent = build_persona_agent(personas[persona_id])
    messages = [*request.history, {"role": "user", "content": request.message}]

    async def generate():
        try:
            result = Runner.run_streamed(agent, messages)
            async for event in result.stream_events():
                if event.type == "raw_response_event":
                    if hasattr(event.data, "delta") and event.data.delta:
                        yield f"data: {event.data.delta}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
