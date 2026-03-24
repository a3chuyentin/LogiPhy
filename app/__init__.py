from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from app.config import Config
from app.services.gemini_service import gemini_service
from app.services.lmstudio_service import lmstudio_service

class AIServiceFactory:
    _service_instance = None
    
    @staticmethod
    def get_service():
        if AIServiceFactory._service_instance is None:
            if Config.AI_SERVICE_TYPE == 'gemini':
                AIServiceFactory._service_instance = gemini_service
            elif Config.AI_SERVICE_TYPE == 'lm_studio':
                AIServiceFactory._service_instance = lmstudio_service
            else:
                raise ValueError(f"Unknown AI service type: {Config.AI_SERVICE_TYPE}")
        
        return AIServiceFactory._service_instance

def get_ai_service():
    return AIServiceFactory.get_service()

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    app.config.from_object(Config)
    
    try:
        Config.validate()
    except ValueError as e:
        app.logger.error(f"Configuration error: {e}")
        raise
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dotenv_path = os.path.join(BASE_DIR, '.env')
    load_dotenv(dotenv_path)
    
    from .routes.auth import auth_bp
    from .routes.main import main_bp
    from .routes.practice import practice_bp
    from .routes.learn import learn_bp
    from .routes.handle import handle_bp
    from .routes.shop import shop_bp
    from .routes.admin import admin_bp
    from .routes.api import api_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(practice_bp)
    app.register_blueprint(learn_bp)
    app.register_blueprint(handle_bp)
    app.register_blueprint(shop_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(api_bp)
    
    return app