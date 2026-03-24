from google import genai
from google.genai import types
import json
import logging
from typing import Optional, Dict, Any, List
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
            
            json_str = self._extract_json(response_text)
            if not json_str:
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