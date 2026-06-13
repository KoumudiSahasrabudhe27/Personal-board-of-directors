# Personal Board of Directors

> Six AI advisors. One informed decision.

Personal Board of Directors is an AI-powered decision intelligence platform that helps users evaluate important life and career decisions through multiple perspectives.

Instead of relying on a single AI response, the system simulates a boardroom of six advisors, each representing a unique way of thinking. Their perspectives are synthesized into a final recommendation, actionable next steps, and a confidence score.

---

## Problem Statement

Important decisions are often made with incomplete information or biased viewpoints.

Whether choosing between career paths, job offers, startups, higher education, investments, or personal opportunities, people typically rely on:

- Their own assumptions
- Advice from a small group of people
- Generic AI responses

This often leads to overthinking, analysis paralysis, and uncertainty.

---

## Solution

Personal Board of Directors creates a virtual advisory board consisting of six specialized AI personas.

Each advisor evaluates the same decision through a different lens:

- Strategy
- Finance
- Technical growth
- Mental well-being
- Long-term experience
- Personal happiness

The platform then generates:

- Independent advisor perspectives
- Areas of agreement
- Areas of disagreement
- Final consensus recommendation
- Action plan
- Confidence score

This provides users with a structured decision-making framework rather than a single answer.

---

## Advisor Personas

### CEO
Focuses on strategic growth, leverage, leadership, and long-term career positioning.

### Investor
Evaluates financial upside, risk, opportunity cost, and return on investment.

### Engineer
Analyzes technical depth, learning opportunities, and skill development.

### Psychologist
Considers emotional well-being, stress, burnout, motivation, and personal sustainability.

### Mentor
Provides experience-driven guidance focused on timing, growth, and long-term outcomes.

### Friend
Represents intuition, happiness, life satisfaction, and personal fulfillment.

---

## How It Works

1. User submits a decision or dilemma.
2. Azure OpenAI analyzes the situation.
3. Six advisor perspectives are generated.
4. Areas of agreement and disagreement are identified.
5. A moderator synthesizes all viewpoints.
6. A final recommendation is produced.
7. The session is optionally stored in memory for future context.

---

## Features

### Multi-Perspective Decision Intelligence

Receive six distinct viewpoints for every decision.

### AI Moderator

Combines all advisor opinions into one coherent recommendation.

### Consensus Analysis

Highlights where advisors agree and where opinions differ.

### Actionable Guidance

Provides practical next steps rather than generic advice.

### Confidence Scoring

Assigns a confidence score to help evaluate recommendation strength.

### Memory Support

Uses previous board sessions as contextual memory for future decisions.

### Modern Interactive UI

Responsive React interface designed for engaging board-style discussions.

### Azure OpenAI Integration

Powered by Azure OpenAI and Azure AI Foundry.

---

## System Architecture

```text
User
  │
  ▼
React Frontend
  │
  ▼
FastAPI Backend
  │
  ▼
Azure OpenAI (GPT-4.1 Mini)
  │
  ▼
Structured Board Analysis
  │
  ├── CEO Perspective
  ├── Investor Perspective
  ├── Engineer Perspective
  ├── Psychologist Perspective
  ├── Mentor Perspective
  └── Friend Perspective
  │
  ▼
Consensus Recommendation
```

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- FastAPI
- Pydantic

### AI Layer

- Azure OpenAI
- GPT-4.1 Mini
- Structured JSON Output

### Platform

- Azure AI Foundry
- Azure AI Search (Optional)
- Foundry Memory

---

## Project Structure

```text
Personal-board-of-directors
│
├── backend
│   ├── api.py
│   ├── board.py
│   ├── azure_openai.py
│   ├── schemas.py
│   ├── personas.py
│   └── foundry_iq.py
│
├── src
│   ├── components
│   ├── hooks
│   ├── pages
│   └── lib
│
├── public
├── scripts
├── requirements.txt
├── package.json
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/KoumudiSahasrabudhe27/Personal-board-of-directors.git

cd Personal-board-of-directors
```

### Backend Setup

Create a Python virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

Mac/Linux:

```bash
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup

Install Node dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com

AZURE_OPENAI_API_KEY=YOUR_API_KEY

AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini

AZURE_OPENAI_API_VERSION=2024-10-21
```

Optional Azure AI Search / Foundry Memory:

```env
SEARCH_ENDPOINT=https://YOUR-SEARCH-SERVICE.search.windows.net

SEARCH_API_KEY=YOUR_SEARCH_KEY

BOARD_INDEX_NAME=board-decisions

KNOWLEDGE_BASE_NAME=board-decisions-kb

BOARD_KNOWLEDGE_SOURCE=board-decisions-source
```

---

## Running the Application

### Start Backend

```bash
python3 -m uvicorn backend.api:app --reload --port 3001
```

Backend runs at:

```text
http://127.0.0.1:3001
```

### Start Frontend

Open another terminal:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### Open Application

Visit:

```text
http://localhost:5173
```

---

## Example Use Cases

### Career Decisions

- AI Engineering vs Cybersecurity
- Startup vs Corporate Job
- Higher Studies vs Employment

### Financial Decisions

- Investment Opportunities
- Business Expansion
- Risk Evaluation

### Personal Decisions

- Relocation
- Side Projects
- Career Transitions

### Education

- Degree Selection
- Certification Planning
- Skill Development Roadmaps

---

## Screenshots

### Landing Page

<img width="1470" height="829" alt="image" src="https://github.com/user-attachments/assets/de141aa5-9991-4646-a6d8-1bdea55dff8e" />

<img width="1470" height="826" alt="image" src="https://github.com/user-attachments/assets/57331068-4be8-4c33-a68c-217dfd3ec0c1" />

<img width="1470" height="831" alt="image" src="https://github.com/user-attachments/assets/b771e43e-cf3c-4b1f-91b8-355c314dda4d" />


### Board Session

<img width="1470" height="827" alt="image" src="https://github.com/user-attachments/assets/e42750ac-e3f4-47c4-9a37-f64fdd0a7b8d" />


### Final Recommendation

Add screenshot here.

---

## Future Enhancements

- Real multi-agent execution
- Voice-based board meetings
- Personalized advisor tuning
- Team decision-making mode
- Historical decision analytics
- Advisor voting mechanism
- Azure AI Agent Service integration
- RAG-powered knowledge retrieval

---

## Impact

Personal Board of Directors helps users:

- Reduce decision paralysis
- Evaluate choices objectively
- Understand trade-offs clearly
- Balance logic and emotion
- Make more confident decisions

---

## Hackathon Submission

Built for the Microsoft Agents League Hackathon.

Key technologies used:

- Azure AI Foundry
- Azure OpenAI
- FastAPI
- React
- Vite
- Python

---

## Author

**Koumudi Sahasrabudhe**

GitHub:

https://github.com/KoumudiSahasrabudhe27

LinkedIn:

https://www.linkedin.com/in/koumudi-sahasrabudhe-947417288/

---

If you found this project interesting, consider starring the repository.
