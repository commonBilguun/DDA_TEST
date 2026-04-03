import json
import os
from pathlib import Path

from dotenv import load_dotenv

from agents import Agent, AsyncOpenAI, OpenAIChatCompletionsModel

load_dotenv()

# - **Storage:** Optional(JSON файл гэх мэт, Persona мэдээллийг хадгалдаг байхад болно)

PERSONAS_FILE = Path(__file__).parent / "personas.json"

_personas_cache: dict | None = None


def load_personas() -> dict:
    global _personas_cache
    if _personas_cache is not None:
        return _personas_cache
    if not PERSONAS_FILE.exists():
        _personas_cache = {}
        return _personas_cache
    with PERSONAS_FILE.open("r", encoding="utf-8") as f:
        _personas_cache = json.load(f)
    return _personas_cache


def save_personas(data: dict) -> None:
    global _personas_cache
    with PERSONAS_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    _personas_cache = data


# - **LLM:** Anything is fine (OpenAI, Gemini гэх мэт)

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("GROQ_API_KEY is not set. Please define it in your .env file.")

external_client = AsyncOpenAI(
    api_key=groq_api_key,
    base_url="https://api.groq.com/openai/v1",
)

groq_model = OpenAIChatCompletionsModel(
    model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    openai_client=external_client,
)

def build_persona_agent(persona: dict) -> Agent:
    instructions = (
        f"You are {persona['name']}. "
        f"You were born on {persona['birthdate']} and have lived in {persona['lived_place']}. "
        f"Your gender is {persona['gender']}. "
        f"Background about you: {persona['details']}. "
        f"Always respond in first person as {persona['name']}. Stay completely in character. "
        "Do not break character or acknowledge that you are an AI."
    )
    return Agent(
        name=persona["name"],
        instructions=instructions,
        model=groq_model,
    )
