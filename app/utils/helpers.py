import os
import logging
from flask import session
from typing import Optional, Dict, Any
from app.config import Config

logger = logging.getLogger(__name__)

def get_username() -> Optional[str]:
    """Get username from session"""
    return session.get('username')

def read_prompt_file(filename: str) -> Optional[str]:
    """Read prompt file with error handling"""
    try:
        filepath = os.path.join(Config.PROMPT_DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        logger.error(f"Prompt file not found: {filename}")
        return None
    except Exception as e:
        logger.error(f"Error reading prompt file {filename}: {e}")
        return None

def create_prompt_content(lop: str, question_data: str, prompt_template: str) -> str:
    """Create prompt content by combining parameters with template"""
    return f"Lớp: {lop}\nBài toán: {question_data}\n\n{prompt_template}"

def validate_question_response(response: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate and fix question response structure"""
    if not response:
        return {
            'loigiai': [{'buoc': '1', 'chitiet': 'Không có dữ liệu trả về từ AI'}],
            'dapan': 'Lỗi dữ liệu'
        }
    
    # Create a copy to avoid modifying original
    result = response.copy() if isinstance(response, dict) else {}
    
    # Ensure loigiai exists and is a list
    if 'loigiai' not in result or not isinstance(result['loigiai'], list):
        result['loigiai'] = [{'buoc': '1', 'chitiet': 'Không có lời giải chi tiết'}]
    
    # Ensure dapan exists
    if 'dapan' not in result:
        result['dapan'] = 'Không có đáp án'
    
    # Validate and fix each step
    for i, step in enumerate(result['loigiai']):
        if not isinstance(step, dict):
            result['loigiai'][i] = {'buoc': str(i+1), 'chitiet': str(step)}
        else:
            if 'buoc' not in step:
                step['buoc'] = str(i+1)
            if 'chitiet' not in step:
                step['chitiet'] = step.get('tomtat', 'Không có mô tả chi tiết')
    
    return result