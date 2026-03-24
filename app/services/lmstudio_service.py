import requests
import json
import logging
from typing import Optional, Dict, Any, List
import re
import json5
from json_repair import repair_json

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
        
        logger.info(f"LMStudioService initialized with base URL: {self.base_url}, model: {self.model}")
    
    def generate_content(self, prompt: str, **kwargs) -> Optional[str]:
        try:
            temperature = kwargs.get('temperature', self.temperature)
            max_tokens = kwargs.get('max_tokens', self.max_tokens)
            
            url = f"{self.base_url}/v1/chat/completions"
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            }
            
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling LM Studio API: {e}")
            return None
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return None
    
    def generate_question(self, prompt: str) -> Optional[List[Dict[str, Any]]]:
        try:
            response_text = self.generate_content(prompt)
            if not response_text:
                return None
            
            cleaned_text = self._clean_json_response(response_text)
            
            data = self._parse_json_with_fallback(cleaned_text)
            if data:
                return data if isinstance(data, list) else [data]
            
            return None
                
        except Exception as e:
            logger.error(f"Error in generate_question: {e}")
            return None
    
    def _parse_json_with_fallback(self, text: str) -> Optional[Any]:
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Standard JSON parse failed: {e}")
        
        try:
            return json5.loads(text)
        except Exception as e:
            logger.warning(f"JSON5 parse failed: {e}")
        
        try:
            repaired = repair_json(text)
            return json.loads(repaired)
        except Exception as e:
            logger.warning(f"JSON repair failed: {e}")
        
        try:
            fixed = self._fix_unterminated_strings(text)
            return json.loads(fixed)
        except Exception as e:
            logger.warning(f"Custom string fix failed: {e}")
        
        extracted = self._extract_json_from_text(text)
        if extracted:
            return extracted
        
        logger.error(f"All JSON parsing methods failed. Raw text first 1000 chars: {text[:1000]}")
        return None
    
    def _fix_unterminated_strings(self, text: str) -> str:
        lines = text.split('\n')
        fixed_lines = []
        
        for line in lines:
            quote_count = line.count('"')
            if quote_count % 2 != 0: 
                line = line.rstrip() + '"'
            fixed_lines.append(line)
        
        return '\n'.join(fixed_lines)
    
    def _clean_json_response(self, text: str) -> str:
        cleaned = text.strip()
        
        if cleaned.startswith('```json'):
            cleaned = cleaned[7:]
        elif cleaned.startswith('```'):
            cleaned = cleaned[3:]
            
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        
        cleaned = cleaned.strip()
        
        cleaned = re.sub(r'\{\{', '{', cleaned)
        cleaned = re.sub(r'\}\}', '}', cleaned)
        
        brace_count = 0
        bracket_count = 0
        start_idx = -1
        in_string = False
        escape_next = False
        
        for i, char in enumerate(cleaned):
            if escape_next:
                escape_next = False
                continue
                
            if char == '\\':
                escape_next = True
                continue
                
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
                
            if not in_string:
                if char == '{':
                    if brace_count == 0 and bracket_count == 0:
                        start_idx = i
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0 and start_idx != -1:
                        cleaned = cleaned[start_idx:i+1]
                        break
                elif char == '[':
                    if brace_count == 0 and bracket_count == 0:
                        start_idx = i
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                    if bracket_count == 0 and start_idx != -1:
                        cleaned = cleaned[start_idx:i+1]
                        break
        
        cleaned = re.sub(r',\s*}', '}', cleaned)
        cleaned = re.sub(r',\s*]', ']', cleaned)
        cleaned = re.sub(r'}\s*{', '},{', cleaned)
        
        logger.debug(f"Cleaned JSON (first 500 chars): {cleaned[:500]}")
        
        return cleaned.strip()
    
    def _extract_json_from_text(self, text: str) -> Optional[Any]:
        array_pattern = r'(\[[\s\S]*\])'
        matches = re.search(array_pattern, text, re.DOTALL)
        
        if matches:
            try:
                return json.loads(matches.group())
            except:
                pass
        
        object_pattern = r'(\{[\s\S]*\})'
        matches = re.search(object_pattern, text, re.DOTALL)
        
        if matches:
            try:
                return json.loads(matches.group())
            except:
                pass
        
        return None
    
    def generate_with_custom_config(self, prompt: str, temperature: float = None, max_tokens: int = None) -> Optional[str]:
        try:
            temp = temperature if temperature is not None else self.temperature
            tokens = max_tokens if max_tokens is not None else self.max_tokens
            
            url = f"{self.base_url}/v1/chat/completions"
            
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": temp,
                "max_tokens": tokens,
                "stream": False
            }
            
            response = requests.post(url, json=payload, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            return result["choices"][0]["message"]["content"]
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling LM Studio API with custom config: {e}")
            return None
        except Exception as e:
            logger.error(f"Error generating content with custom config: {e}")
            return None
    
    def health_check(self) -> bool:
        try:
            url = f"{self.base_url}/v1/models"
            response = requests.get(url, timeout=5)
            return response.status_code == 200
        except:
            return False

lmstudio_service = LMStudioService()