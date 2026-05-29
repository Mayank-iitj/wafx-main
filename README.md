# HireMind AI 🧠

> **Autonomous AI Candidate Intelligence & Ranking System**  
> Production-grade AI recruitment platform. Palantir-grade intelligence meets LinkedIn Recruiter.

<div align="center">

![HireMind AI](https://img.shields.io/badge/HireMind-AI-6366f1?style=for-the-badge&logo=brain&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| AI Copilot | Conversational recruiter - streaming GPT-4o / Gemini / Claude |
| Multi-dim Ranking | 9-dimension ML scoring: technical, behavioral, cultural, potential |
| Hidden Gem Detection | Finds undervalued candidates with 99% future potential |
| JD Intelligence | Extracts skills, culture, inferred signals from job descriptions |
| Bias Audit | GDPR-compliant fairness scoring across 6 dimensions |
| Knowledge Graph | Visual skill-candidate relationship explorer |
| Interview Kits | AI-generated question sets tailored per candidate |
| Batch Upload | Drag-drop PDF/DOCX resume parsing with async processing |

---

## Quick Start - Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+

### Frontend
```bash
cd hiremind-ai
npm install
npm run dev
# Open http://localhost:5173
```

### Backend
```bash
cd hiremind-ai/backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
cp ../.env.example .env      # Edit with your API keys

uvicorn app.main:app --reload --port 8000
# Open http://localhost:8000/docs
```

---

## Docker (Full Stack)

```bash
cp .env.example .env
docker-compose up -d
# App: http://localhost
# API docs: http://localhost:8000/docs
```

---

## AI Provider Configuration

Edit `.env`:

```env
# Options: "openai" | "gemini" | "claude" | "mock"
AI_PROVIDER=mock

OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

Demo Mode (AI_PROVIDER=mock): Full app works without any API keys.

---

## Architecture

```
hiremind-ai/
├── src/                        # React + TypeScript frontend
│   ├── pages/                  # 21 pages
│   ├── lib/                    # API client, copilot streaming, utils
│   ├── store/                  # Zustand auth + UI stores
│   └── data/                   # Mock data for demo mode
│
├── backend/                    # FastAPI Python backend
│   └── app/
│       ├── routers/            # 8 API routers
│       ├── services/           # AI engines
│       │   ├── ai_provider.py      # OpenAI/Gemini/Claude/Mock
│       │   ├── ranking_engine.py   # Multi-dim ML scoring
│       │   ├── jd_intelligence.py  # JD NLP analysis
│       │   ├── explainability.py   # XAI explanations
│       │   ├── embedding_service.py
│       │   └── resume_parser.py    # PDF/DOCX parsing
│       ├── models/             # SQLAlchemy ORM
│       ├── schemas/            # Pydantic schemas
│       └── core/               # Config, security, JWT
│
├── docker-compose.yml
└── .env.example
```

---

## Demo Login

```
Email: demo@hiremind.ai
Password: (any password)
```

---

## Tech Stack

Frontend: React 19, TypeScript, Vite, TailwindCSS v4, Framer Motion, Recharts, Zustand

Backend: FastAPI, SQLAlchemy (async), Pydantic v2, JWT auth, Celery

AI/ML: sentence-transformers, OpenAI GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet

Databases: PostgreSQL, Redis, Qdrant (vectors), Neo4j (knowledge graph)
