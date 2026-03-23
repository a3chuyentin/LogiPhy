from flask import Blueprint, render_template, session, send_from_directory
from app.utils.decorators import login_required, redirect_if_logged_in
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@redirect_if_logged_in
def index():
    return render_template('index.html', username=session.get('username'))

@main_bp.route('/home')
@login_required
def home_page():
    return render_template('home.html', username=session.get('username'))

@main_bp.route('/favicon.ico')
def favicon():
    return send_from_directory('resources/icons', 'favicon.ico')