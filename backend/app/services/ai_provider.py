"""
HireMind AI — AI Provider Service
Unified interface for LLM-powered features.
Supports: OpenAI, Google Gemini, Anthropic Claude, and Mock mode.

Usage:
    from app.services.ai_provider import ai_provider
    response = await ai_provider.complete("Your prompt here")
"""
import asyncio
from typing import Optional, AsyncGenerator
from app.core.config import settings


class AIProvider:
    """
    Unified LLM interface with automatic provider selection.
    All methods are async-first. Streaming supported for copilot.
    """

    def __init__(self):
        self.provider = settings.AI_PROVIDER
        self._client = None
        self._groq_client = None

    async def _get_openai_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def _get_groq_client(self):
        if self._groq_client is None:
            from openai import AsyncOpenAI
            api_key = settings.GROQ_API_KEY or "dummy-key"
            self._groq_client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
        return self._groq_client

    async def complete(self, prompt: str, system: str = "", max_tokens: int = 1000) -> str:
        """Non-streaming completion."""
        if self.provider == "groq":
            return await self._groq_complete(prompt, system, max_tokens)
        elif self.provider == "openai":
            return await self._openai_complete(prompt, system, max_tokens)
        elif self.provider == "gemini":
            return await self._gemini_complete(prompt, system, max_tokens)
        elif self.provider == "claude":
            return await self._claude_complete(prompt, system, max_tokens)
        else:
            return self._mock_complete(prompt)

    async def stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        """Streaming completion for copilot chat."""
        if self.provider == "groq":
            async for chunk in self._groq_stream(prompt, system):
                yield chunk
        elif self.provider == "openai":
            async for chunk in self._openai_stream(prompt, system):
                yield chunk
        elif self.provider == "gemini":
            async for chunk in self._gemini_stream(prompt, system):
                yield chunk
        elif self.provider == "claude":
            async for chunk in self._claude_stream(prompt, system):
                yield chunk
        else:
            async for chunk in self._mock_stream(prompt):
                yield chunk

    # ── Groq ───────────────────────────────────────────────

    async def _groq_complete(self, prompt: str, system: str, max_tokens: int) -> str:
        try:
            client = await self._get_groq_client()
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            response = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[AIProvider] Groq error: {e}")
            return self._mock_complete(prompt)

    async def _groq_stream(self, prompt: str, system: str) -> AsyncGenerator[str, None]:
        try:
            client = await self._get_groq_client()
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            stream = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True,
                temperature=0.4,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as e:
            print(f"[AIProvider] Groq stream error: {e}")
            async for chunk in self._mock_stream(prompt):
                yield chunk

    # ── OpenAI ─────────────────────────────────────────────

    async def _openai_complete(self, prompt: str, system: str, max_tokens: int) -> str:
        client = await self._get_openai_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content

    async def _openai_stream(self, prompt: str, system: str) -> AsyncGenerator[str, None]:
        client = await self._get_openai_client()
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True,
            temperature=0.4,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    # ── Google Gemini ───────────────────────────────────────

    async def _gemini_complete(self, prompt: str, system: str, max_tokens: int) -> str:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                "gemini-1.5-pro",
                system_instruction=system or "You are HireMind AI, an intelligent recruitment assistant.",
            )
            full_prompt = prompt
            response = await asyncio.to_thread(model.generate_content, full_prompt)
            return response.text
        except Exception as e:
            print(f"[AIProvider] Gemini error: {e}")
            return self._mock_complete(prompt)

    async def _gemini_stream(self, prompt: str, system: str) -> AsyncGenerator[str, None]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(
                "gemini-1.5-pro",
                system_instruction=system or "You are HireMind AI.",
            )
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                yield chunk.text
                await asyncio.sleep(0)
        except Exception as e:
            print(f"[AIProvider] Gemini stream error: {e}")
            async for chunk in self._mock_stream(prompt):
                yield chunk

    # ── Anthropic Claude ────────────────────────────────────

    async def _claude_complete(self, prompt: str, system: str, max_tokens: int) -> str:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                system=system or "You are HireMind AI, an intelligent recruitment assistant.",
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except Exception as e:
            print(f"[AIProvider] Claude error: {e}")
            return self._mock_complete(prompt)

    async def _claude_stream(self, prompt: str, system: str) -> AsyncGenerator[str, None]:
        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            async with client.messages.stream(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system or "You are HireMind AI.",
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except Exception as e:
            print(f"[AIProvider] Claude stream error: {e}")
            async for chunk in self._mock_stream(prompt):
                yield chunk

    # ── Mock ────────────────────────────────────────────────

    def _mock_complete(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "rank" in prompt_lower or "best" in prompt_lower:
            return ("Based on my analysis of the candidate pool, **Aria Chen** ranks #1 with a 94% fit score. "
                    "Her RLHF experience at OpenAI and exceptional behavioral signals (145 commits/month) "
                    "make her the strongest match for this GenAI platform role.")
        if "gem" in prompt_lower or "hidden" in prompt_lower:
            return ("🌟 **Hidden Gem Alert**: Priya Nair (Physics PhD) has a 99% future potential score. "
                    "While her current LLM stack experience is limited, her learning velocity (0.98) is "
                    "the highest in the pool. Self-taught PyTorch in 4 months. High-ROI long-term hire.")
        return ("I've analyzed your query against the full candidate database and job requirements. "
                "Based on multi-dimensional scoring across 9 competency dimensions, I can provide "
                "detailed insights. What specific aspect of the talent pipeline would you like to explore?")

    async def _mock_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        response = self._mock_complete(prompt)
        for char in response:
            yield char
            await asyncio.sleep(0.015)

    async def analyze_jd(self, jd_text: str, title: str = "") -> dict:
        """Use LLM to enhance JD analysis beyond rule-based parsing."""
        if self.provider == "mock":
            from app.services.jd_intelligence import jd_engine
            return jd_engine.analyze(jd_text, title)

        system = """You are an expert technical recruiter and ML engineer. 
        Analyze this job description and extract structured intelligence.
        Respond with ONLY valid JSON, no markdown."""

        prompt = f"""Analyze this job description for "{title}":

{jd_text[:4000]}

Return JSON with:
{{
  "domain": "string",
  "seniority": "Junior|Mid|Senior|Staff|Principal",
  "skills_required": ["list", "of", "skills"],
  "skills_preferred": ["list"],
  "leadership_expected": boolean,
  "culture": "string description",
  "urgency_level": "Low|Medium|High",
  "role_complexity": 0.0-1.0,
  "inferred_signals": ["hidden expectations inferred from JD"],
  "ideal_profile": "string description of ideal candidate"
}}"""

        try:
            import json
            raw = await self.complete(prompt, system, max_tokens=1500)
            # Clean markdown code blocks if present
            raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(raw)
        except Exception as e:
            print(f"[AIProvider] JD analysis error: {e}")
            from app.services.jd_intelligence import jd_engine
            return jd_engine.analyze(jd_text, title)

    async def generate_copilot_response(
        self,
        user_message: str,
        context: dict,
        conversation_history: list,
    ) -> str:
        """Generate AI Copilot response with full candidate context."""
        system = """You are HireMind AI, an expert AI recruitment copilot.
You have access to a database of ranked candidates, job descriptions, and behavioral signals.
Be concise, insightful, and data-driven. Use candidate names and specific scores when relevant.
Format your response in clear prose with **bold** for key names and numbers."""

        context_str = ""
        if context.get("top_candidates"):
            context_str = "\n\nTop Candidates:\n" + "\n".join([
                f"- {c['name']}: {c['overall_fit']:.0%} overall fit, rank #{c['rank']}"
                for c in context.get("top_candidates", [])[:5]
            ])

        history_str = ""
        for msg in conversation_history[-6:]:
            history_str += f"\n{msg['role'].upper()}: {msg['content']}"

        full_prompt = f"""Candidate Database Context:{context_str}

Conversation History:{history_str}

Current Question: {user_message}"""

        return await self.complete(full_prompt, system, max_tokens=800)


ai_provider = AIProvider()
