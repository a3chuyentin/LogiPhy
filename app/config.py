import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'e030444c933825d56217aa758dfed56b61c592073c4aa997c9e25c30785c8a75')
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
    GEMINI_TEMPERATURE = float(os.getenv('GEMINI_TEMPERATURE', '0.7'))
    GEMINI_MAX_TOKENS = int(os.getenv('GEMINI_MAX_TOKENS', '2048'))
    
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
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required in .env file")
        
        if not os.path.exists(cls.SHOP_ITEMS_FILE):
            print(f"Warning: Shop items file not found at {cls.SHOP_ITEMS_FILE}")