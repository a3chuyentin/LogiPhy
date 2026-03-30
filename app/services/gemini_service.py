import logging
import yaml
from typing import Optional, Dict, Any
from google import genai
from google.genai import types
from app.config import Config
import re

logger = logging.getLogger(__name__)

class GeminiService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        Config.validate()
        self.api_key = Config.GEMINI_API_KEY
        self.model = Config.GEMINI_MODEL
        self.temperature = Config.GEMINI_TEMPERATURE
        self.max_tokens = Config.GEMINI_MAX_TOKENS
        self.client = genai.Client(api_key=self.api_key)
        self._initialized = True

    def generate_content(self, prompt: str, **kwargs) -> Optional[str]:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=kwargs.get('temperature', self.temperature),
                    max_output_tokens=kwargs.get('max_tokens', self.max_tokens),
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return None

    def generate_question(self, prompt: str) -> Optional[Dict[str, Any]]:
        try:
            raw = self.generate_content(prompt)
            if not raw:
                return None

            raw = raw.strip()
            if raw.startswith('```yaml'):
                raw = raw[7:]
            elif raw.startswith('```'):
                raw = raw[3:]
            if raw.endswith('```'):
                raw = raw[:-3]
            raw = raw.strip()

            raw = re.sub(r'\\(?!n)', r'\\\\', raw)
            raw = raw.replace('§', '\\\\')
            return yaml.safe_load(raw)

        except Exception as e:
            logger.error(f"Generate question error: {e}")
            return None

gemini_service = GeminiService()