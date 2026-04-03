from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    stream: bool = False


class ChatResponse(BaseModel):
    response: str


class PersonaCreate(BaseModel):
    name: str
    birthdate: str
    lived_place: str
    details: str
    gender: str


class Persona(PersonaCreate):
    id: str
    created_at: str
