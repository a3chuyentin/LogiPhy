import requests
import logging
import yaml
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class LMStudioService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        from app.config import Config
        Config.validate()
        self.base_url = Config.LM_STUDIO_BASE_URL
        self.model = Config.LM_STUDIO_MODEL
        self.temperature = Config.AI_TEMPERATURE
        self.max_tokens = Config.AI_MAX_TOKENS
        self.timeout = Config.LM_STUDIO_TIMEOUT
        self._initialized = True

    def generate_content(self, prompt: str, **kwargs) -> Optional[str]:
        try:
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": kwargs.get('temperature', self.temperature),
                "max_tokens": kwargs.get('max_tokens', self.max_tokens),
                "stream": False
            }
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                json=payload,
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"LMStudio error: {e}")
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

            raw = raw.replace('§', '\\\\')
            return yaml.safe_load(raw)

        except Exception as e:
            logger.error(f"Generate question error: {e}")
            return None

    def health_check(self) -> bool:
        try:
            r = requests.get(f"{self.base_url}/v1/models", timeout=5)
            return r.status_code == 200
        except:
            return False

lmstudio_service = LMStudioService()