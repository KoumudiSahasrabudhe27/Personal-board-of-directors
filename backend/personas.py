from typing import TypedDict


class Persona(TypedDict):
    id: str
    name: str
    initials: str
    title: str
    lens: str
    focus: str


ADVISORS: list[Persona] = [
    {
        "id": "ceo",
        "name": "CEO",
        "initials": "CE",
        "title": "CEO",
        "lens": "Strategic career growth and leverage",
        "focus": "Strategic career growth and leverage",
    },
    {
        "id": "investor",
        "name": "Investor",
        "initials": "IN",
        "title": "Investor",
        "lens": "ROI, risk, and financial upside",
        "focus": "ROI, risk, and financial upside",
    },
    {
        "id": "engineer",
        "name": "Engineer",
        "initials": "EN",
        "title": "Engineer",
        "lens": "Technical depth and skill building",
        "focus": "Technical depth and skill building",
    },
    {
        "id": "psychologist",
        "name": "Psychologist",
        "initials": "PS",
        "title": "Psychologist",
        "lens": "Mental health, burnout, and emotional wellbeing",
        "focus": "Mental health, burnout, and emotional wellbeing",
    },
    {
        "id": "mentor",
        "name": "Mentor",
        "initials": "ME",
        "title": "Mentor",
        "lens": "Timing, experience, and long-term trajectory",
        "focus": "Timing, experience, and long-term trajectory",
    },
    {
        "id": "friend",
        "name": "Friend",
        "initials": "FR",
        "title": "Friend",
        "lens": "Happiness, intuition, and life satisfaction",
        "focus": "Happiness, intuition, and life satisfaction",
    },
]

# Backward-compatible alias used by legacy imports.
PERSONAS = ADVISORS


def get_persona(persona_id: str) -> Persona | None:
    return next((persona for persona in ADVISORS if persona["id"] == persona_id), None)


def public_personas() -> list[dict[str, str]]:
    return [
        {
            "id": persona["id"],
            "name": persona["name"],
            "initials": persona["initials"],
            "title": persona["title"],
            "lens": persona["lens"],
        }
        for persona in ADVISORS
    ]


def advisor_prompt_block() -> str:
    return "\n".join(
        f"- {persona['name']}: {persona['focus']}" for persona in ADVISORS
    )
