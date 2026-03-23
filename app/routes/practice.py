from flask import Blueprint, render_template, session
from app.utils.decorators import login_required

practice_bp = Blueprint('practice', __name__)

@practice_bp.route('/practice')
@login_required
def practice_page():
    return render_template('practice.html', username=session.get('username'))