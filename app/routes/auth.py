from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from app.models.database import Database
from app.utils.decorators import redirect_if_logged_in

auth_bp = Blueprint('auth', __name__)
db = Database()

@auth_bp.route('/login')
@redirect_if_logged_in
def login_page():
    return render_template('login.html', username=session.get('username'))

@auth_bp.route('/register')
@redirect_if_logged_in
def register_page():
    return render_template('register.html', username=session.get('username'))

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400

    if db.login_user(username, password):
        session['username'] = username
        return jsonify({'success': True, 'message': 'Đăng nhập thành công!'})
    else:
        return jsonify({'success': False, 'message': 'Sai tên đăng nhập hoặc mật khẩu!'})

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Vui lòng nhập đầy đủ thông tin'}), 400

    if db.user_exists(username):
        return jsonify({'success': False, 'message': 'Tên đăng nhập đã tồn tại!'})

    if db.register_user(username, password):
        return jsonify({'success': True, 'message': 'Đăng ký thành công!'})
    else:
        return jsonify({'success': False, 'message': 'Đăng ký thất bại!'})

@auth_bp.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('main.index'))