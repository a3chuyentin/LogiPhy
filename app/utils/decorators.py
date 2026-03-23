from functools import wraps
from flask import session, redirect, url_for, jsonify
from app.models.database import Database

db = Database()

def login_required(f):
    """Decorator to require login for protected routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('main.index'))
        return f(*args, **kwargs)
    return decorated_function

def redirect_if_logged_in(f):
    """Decorator to redirect if user is already logged in"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' in session:
            return redirect(url_for('main.home_page'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('main.index'))
        
        if not db.is_admin(session['username']):
            return redirect(url_for('main.home_page'))
        
        return f(*args, **kwargs)
    return decorated_function

def api_login_required(f):
    """Decorator for API routes that require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'success': False, 'error': 'Not logged in'}), 403
        return f(*args, **kwargs)
    return decorated_function

def api_admin_required(f):
    """Decorator for API routes that require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'success': False, 'error': 'Not logged in'}), 403
        
        if not db.is_admin(session['username']):
            return jsonify({'success': False, 'error': 'Insufficient permissions'}), 403
        
        return f(*args, **kwargs)
    return decorated_function