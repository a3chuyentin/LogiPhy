from flask import render_template, request, jsonify
from app.main import bp
from app.database.queries import UserQueries

@bp.route('/')
def index():
    return render_template('main/index.html')