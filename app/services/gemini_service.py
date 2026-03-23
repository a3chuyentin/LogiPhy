from google import genai
from google.genai import types
import json
import logging
from typing import Optional, Dict, Any, List
from app.config import Config

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
        
        logger.info(f"GeminiService initialized with model: {self.model}")
    
    def generate_content(self, prompt: str, **kwargs) -> Optional[str]:
        try:
            temperature = kwargs.get('temperature', self.temperature)
            max_tokens = kwargs.get('max_tokens', self.max_tokens)
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return None
    
    def generate_question(self, prompt: str) -> Optional[List[Dict[str, Any]]]:
        try:
            response_text = self.generate_content(prompt)
            if not response_text:
                return None
            
            cleaned_text = self._clean_json_response(response_text)
            
            try:
                data = json.loads(cleaned_text)
                return data if isinstance(data, list) else [data]
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}")
                logger.error(f"Raw text: {cleaned_text}")
                
                return self._extract_json_from_text(cleaned_text)
                
        except Exception as e:
            logger.error(f"Error in generate_question: {e}")
            return None
    
    def _clean_json_response(self, text: str) -> str:
        cleaned = text.strip()
        
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        elif cleaned.startswith('```'):
            cleaned = cleaned[3:]
            
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        
        cleaned = cleaned.strip()
        
        import re
        
        cleaned = re.sub(r'\{\{', '{', cleaned)
        cleaned = re.sub(r'\}\}', '}', cleaned)
        
        brace_count = 0
        start_idx = -1
        
        for i, char in enumerate(cleaned):
            if char == '{':
                if brace_count == 0:
                    start_idx = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_idx != -1:
                    cleaned = cleaned[start_idx:i+1]
                    break
        
        cleaned = re.sub(r',\s*}', '}', cleaned)
        cleaned = re.sub(r',\s*]', ']', cleaned)
        
        logger.debug(f"Cleaned JSON (first 500 chars): {cleaned[:500]}")
        
        return cleaned.strip()
    
    def _extract_json_from_text(self, text: str) -> Optional[List[Dict[str, Any]]]:
        import re
        json_pattern = r'(\[.*\]|\{.*\})'
        matches = re.search(json_pattern, text, re.DOTALL)
        
        if matches:
            try:
                data = json.loads(matches.group())
                return data if isinstance(data, list) else [data]
            except:
                pass
        return None
    
    def generate_with_custom_config(self, prompt: str, temperature: float = None, max_tokens: int = None) -> Optional[str]:
        try:
            temp = temperature if temperature is not None else self.temperature
            tokens = max_tokens if max_tokens is not None else self.max_tokens
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temp,
                    max_output_tokens=tokens,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Error generating content with custom config: {e}")
            return None

gemini_service = GeminiService()