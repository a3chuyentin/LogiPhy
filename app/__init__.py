from flask import Flask
from config import Config
from app.database import db_connection

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db_connection.init_app(app)
    
    from app.main import bp as main_bp
    app.register_blueprint(main_bp)
    
    with app.app_context():
        from app.database.queries import UserQueries
    
    return app