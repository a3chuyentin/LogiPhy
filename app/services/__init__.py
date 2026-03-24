from app.services.gemini_service import gemini_service
from app.services.lmstudio_service import lmstudio_service
from app.config import Config
import logging

logger = logging.getLogger(__name__)

class AIServiceFactory:
    _service_instance = None
    
    @staticmethod
    def get_service():
        if AIServiceFactory._service_instance is None:
            if Config.AI_SERVICE_TYPE == 'gemini':
                logger.info("Using Gemini AI service")
                AIServiceFactory._service_instance = gemini_service
            elif Config.AI_SERVICE_TYPE == 'lm_studio':
                logger.info(f"Using LM Studio AI service at {Config.LM_STUDIO_BASE_URL}")
                AIServiceFactory._service_instance = lmstudio_service
            else:
                raise ValueError(f"Unknown AI service type: {Config.AI_SERVICE_TYPE}")
        
        return AIServiceFactory._service_instance

def get_ai_service():
    return AIServiceFactory.get_service()