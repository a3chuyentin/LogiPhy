from flask import session
import logging

logger = logging.getLogger(__name__)

def inject_user_info():
    user_info = {
        'is_admin': False,
        'username': None
    }
    
    if 'username' in session:
        user_info['username'] = session['username']
        
        from app.models.database import Database
        db = Database()
        user_data = db.get_user_data(session['username'])
        
        if user_data:
            user_info['is_admin'] = user_data.get('is_admin', False)
            logger.debug(f"User {session['username']} is_admin: {user_info['is_admin']}")
    
    return user_info