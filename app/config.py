import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Secret key
    SECRET_KEY = os.getenv('SECRET_KEY', 'e030444c933825d56217aa758dfed56b61c592073c4aa997c9e25c30785c8a75')
    
    # Gemini API
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-pro')
    GEMINI_TEMPERATURE = float(os.getenv('GEMINI_TEMPERATURE', '0.7'))
    GEMINI_MAX_TOKENS = int(os.getenv('GEMINI_MAX_TOKENS', '2048'))
    
    # Database
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'users.db')
    
    # Session configuration
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'True').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')
    SESSION_LIFETIME_HOURS = int(os.getenv('SESSION_LIFETIME_HOURS', '24'))
    PERMANENT_SESSION_LIFETIME = timedelta(hours=SESSION_LIFETIME_HOURS)
    SESSION_REFRESH_EACH_REQUEST = os.getenv('SESSION_REFRESH_EACH_REQUEST', 'True').lower() == 'true'
    SESSION_COOKIE_DOMAIN = os.getenv('SESSION_COOKIE_DOMAIN')
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # Đây là D:\GitHub\LogiPhy
    APP_DIR = os.path.dirname(os.path.abspath(__file__))  # Đây là D:\GitHub\LogiPhy\app
    
    # Prompt directory - ở resources/prompts (ngoài app)
    PROMPT_DIR = os.getenv('PROMPT_DIR', os.path.join(APP_DIR, 'resources', 'prompts'))
    
    # Shop items file - ở app/static/json/shop.json
    SHOP_ITEMS_FILE = os.getenv('SHOP_ITEMS_FILE', os.path.join(APP_DIR, 'static', 'json', 'shop.json'))
    
    # Static folder - ở app/static
    STATIC_FOLDER = os.path.join(APP_DIR, 'static')
    
    # Prompt files
    QUESTION_PROMPT_FILE = os.getenv('QUESTION_PROMPT_FILE', 'question.txt')
    COMPARE_PROMPT_FILE = os.getenv('COMPARE_PROMPT_FILE', 'compare.txt')
    
    # Ranking
    RANKING_LIMIT = int(os.getenv('RANKING_LIMIT', '50'))
    
    # Debug
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is required in .env file")
        
        # Kiểm tra file shop.json có tồn tại không
        if not os.path.exists(cls.SHOP_ITEMS_FILE):
            print(f"Warning: Shop items file not found at {cls.SHOP_ITEMS_FILE}")