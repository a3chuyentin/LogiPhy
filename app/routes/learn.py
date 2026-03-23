from flask import Blueprint, render_template, session
from app.utils.decorators import login_required

learn_bp = Blueprint('learn', __name__)

@learn_bp.route('/learn')
@login_required
def learn_page():
    return render_template('learn.html', username=session.get('username'))