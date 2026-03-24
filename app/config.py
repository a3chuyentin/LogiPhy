import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'e030444c933825d56217aa758dfed56b61c592073c4aa997c9e25c30785c8a75')
    
    AI_SERVICE_TYPE = os.getenv('AI_SERVICE_TYPE', 'gemini')
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
    GEMINI_TEMPERATURE = float(os.getenv('GEMINI_TEMPERATURE', '0.7'))
    GEMINI_MAX_TOKENS = int(os.getenv('GEMINI_MAX_TOKENS', '8192'))
    
    LM_STUDIO_BASE_URL = os.getenv('LM_STUDIO_BASE_URL', 'http://localhost:1234')
    LM_STUDIO_MODEL = os.getenv('LM_STUDIO_MODEL', 'local-model')
    LM_STUDIO_TIMEOUT = int(os.getenv('LM_STUDIO_TIMEOUT', '60')) 
    
    AI_TEMPERATURE = float(os.getenv('AI_TEMPERATURE', '0.7'))
    AI_MAX_TOKENS = int(os.getenv('AI_MAX_TOKENS', '8192'))
    
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'users.db')
    
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    SESSION_LIFETIME_HOURS = int(os.getenv('SESSION_LIFETIME_HOURS', '24'))
    PERMANENT_SESSION_LIFETIME = timedelta(hours=SESSION_LIFETIME_HOURS)
    SESSION_REFRESH_EACH_REQUEST = os.getenv('SESSION_REFRESH_EACH_REQUEST', 'True').lower() == 'true'
    SESSION_COOKIE_DOMAIN = os.getenv('SESSION_COOKIE_DOMAIN')
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    APP_DIR = os.path.dirname(os.path.abspath(__file__))
    
    PROMPT_DIR = os.getenv('PROMPT_DIR', os.path.join(APP_DIR, 'resources', 'prompts'))
    
    SHOP_ITEMS_FILE = os.getenv('SHOP_ITEMS_FILE', os.path.join(APP_DIR, 'static', 'json', 'shop.json'))
    
    STATIC_FOLDER = os.path.join(APP_DIR, 'static')
    
    QUESTION_PROMPT_FILE = os.getenv('QUESTION_PROMPT_FILE', 'question.txt')
    COMPARE_PROMPT_FILE = os.getenv('COMPARE_PROMPT_FILE', 'compare.txt')
    
    RANKING_LIMIT = int(os.getenv('RANKING_LIMIT', '50'))
    
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    @classmethod
    def validate(cls):
        """Validate required configurations based on service type"""
        
        if cls.AI_SERVICE_TYPE not in ['gemini', 'lm_studio']:
            raise ValueError(f"Invalid AI_SERVICE_TYPE: {cls.AI_SERVICE_TYPE}. Must be 'gemini' or 'lm_studio'")
        
        if cls.AI_SERVICE_TYPE == 'gemini':
            if not cls.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is required in .env file when using Gemini service")
            if not cls.GEMINI_API_KEY.startswith('AIza'):
                raise ValueError("GEMINI_API_KEY appears to be invalid (should start with 'AIza')")
        
        elif cls.AI_SERVICE_TYPE == 'lm_studio':
            if not cls.LM_STUDIO_BASE_URL:
                raise ValueError("LM_STUDIO_BASE_URL is required in .env file when using LM Studio service")
            
            cls.LM_STUDIO_BASE_URL = cls.LM_STUDIO_BASE_URL.rstrip('/')
            
            if not cls.LM_STUDIO_BASE_URL.startswith('http://') and not cls.LM_STUDIO_BASE_URL.startswith('https://'):
                raise ValueError(f"LM_STUDIO_BASE_URL must start with http:// or https://, got: {cls.LM_STUDIO_BASE_URL}")
        
        if cls.SHOP_ITEMS_FILE and not os.path.exists(cls.SHOP_ITEMS_FILE):
            print(f"Warning: Shop items file not found at {cls.SHOP_ITEMS_FILE}")
        
        if cls.PROMPT_DIR and not os.path.exists(cls.PROMPT_DIR):
            print(f"Warning: Prompt directory not found at {cls.PROMPT_DIR}")
        
        if cls.AI_TEMPERATURE < 0 or cls.AI_TEMPERATURE > 2:
            print(f"Warning: AI_TEMPERATURE {cls.AI_TEMPERATURE} is out of typical range (0-2)")
        
        if cls.AI_MAX_TOKENS <= 0:
            raise ValueError(f"AI_MAX_TOKENS must be positive, got: {cls.AI_MAX_TOKENS}")
        
        if cls.AI_SERVICE_TYPE == 'gemini':
            print(f"  - Model: {cls.GEMINI_MODEL}")
        else:
            print(f"  - Base URL: {cls.LM_STUDIO_BASE_URL}")
            print(f"  - Model: {cls.LM_STUDIO_MODEL}")
    
    @classmethod
    def get_ai_config(cls):
        if cls.AI_SERVICE_TYPE == 'gemini':
            return {
                'api_key': cls.GEMINI_API_KEY,
                'model': cls.GEMINI_MODEL,
                'temperature': cls.AI_TEMPERATURE,
                'max_tokens': cls.AI_MAX_TOKENS
            }
        else:
            return {
                'base_url': cls.LM_STUDIO_BASE_URL,
                'model': cls.LM_STUDIO_MODEL,
                'temperature': cls.AI_TEMPERATURE,
                'max_tokens': cls.AI_MAX_TOKENS,
                'timeout': cls.LM_STUDIO_TIMEOUT
            }
    
    @classmethod
    def get_prompt_path(cls, prompt_type='question'):
        if prompt_type == 'question':
            prompt_file = cls.QUESTION_PROMPT_FILE
        elif prompt_type == 'compare':
            prompt_file = cls.COMPARE_PROMPT_FILE
        else:
            raise ValueError(f"Unknown prompt type: {prompt_type}")
        
        if os.path.isabs(prompt_file):
            return prompt_file
        
        return os.path.join(cls.PROMPT_DIR, prompt_file)