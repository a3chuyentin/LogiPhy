import requests
import logging
from typing import Optional, Dict, Any, List
import re
import json

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
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            return content
            
        except Exception as e:
            logger.error(f"Error calling LM Studio API: {e}")
            return None

    def generate_question(self, prompt: str) -> Optional[List[Dict[str, Any]]]:
        try:
            response_text = self.generate_content(prompt)
            if not response_text:
                logger.error("No response text from generate_content")
                return None
            
            json_str = self._extract_json(response_text)
                        
            if not json_str:
                logger.error("No JSON extracted from response")
                return None
            
            data = self._safe_json_parse(json_str)
            
            return data if isinstance(data, list) else [data]
                    
        except Exception as e:
            logger.error(f"Error in generate_question: {e}")
            return None
    
    def _extract_json(self, text: str) -> Optional[str]:
        text = text.strip()
        
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text.strip())
        return match.group(1) if match else None
    
    def _safe_json_parse(self, json_str: str):
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            try:
                json_str = json_str.replace('\\"', '"')
                json_str = json_str.replace("\\'", "'")
                json_str = re.sub(r'(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', '', json_str)
                return json.loads(json_str)
            except json.JSONDecodeError:
                try:
                    json_str = json_str.encode('utf-8').decode('unicode_escape')
                    return json.loads(json_str)
                except:
                    try:
                        import ast
                        return ast.literal_eval(json_str)
                    except:
                        logger.error(f"Failed to parse JSON: {json_str[:200]}")
                        raise
    
    def generate_with_custom_config(self, prompt: str, temperature: float = None, max_tokens: int = None) -> Optional[str]:
        return self.generate_content(prompt, temperature=temperature, max_tokens=max_tokens)
    
    def health_check(self) -> bool:
        try:
            response = requests.get(f"{self.base_url}/v1/models", timeout=5)
            return response.status_code == 200
        except:
            return False

lmstudio_service = LMStudioService()