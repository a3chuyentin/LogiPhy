from flask import Blueprint, request, jsonify, render_template, session
import logging
from app.models.database import Database
from app.utils.decorators import admin_required, api_admin_required

admin_bp = Blueprint('admin', __name__)
db = Database()
logger = logging.getLogger(__name__)

@admin_bp.route('/admin')
@admin_required
def admin_page():
    return render_template('admin.html', username=session.get('username'))

@admin_bp.route('/api/admin/users')
@api_admin_required
def admin_get_users():
    try:
        users = db.get_all_users()
        return jsonify({'success': True, 'users': users})
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra'}), 500

@admin_bp.route('/api/admin/stats')
@api_admin_required
def admin_get_stats():
    try:
        users = db.get_all_users()
        total_users = len(users)
        total_points = sum(user.get('totalpoint', 0) for user in users)

        top_user = max(users, key=lambda x: x.get('totalpoint', 0), default=None)
        top_user_name = top_user['username'] if top_user else 'Không có'

        top_users = sorted(users, key=lambda x: x.get('totalpoint', 0), reverse=True)[:10]

        return jsonify({
            'success': True,
            'total_users': total_users,
            'total_points': total_points,
            'top_user': top_user_name,
            'top_users': top_users
        })
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra'}), 500

@admin_bp.route('/api/admin/update-user', methods=['POST'])
@api_admin_required
def admin_update_user():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Không có dữ liệu'}), 400

    username = data.get('username')
    total_point = data.get('total_point', 0)
    current_point = data.get('current_point', 0)

    if not username:
        return jsonify({'success': False, 'error': 'Thiếu username'}), 400

    try:
        if db.update_user_points(username, total_point, current_point):
            return jsonify({'success': True, 'message': 'Cập nhật thành công'})
        else:
            return jsonify({'success': False, 'error': 'Không thể cập nhật'}), 500
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra'}), 500

@admin_bp.route('/api/admin/delete-user', methods=['POST'])
@api_admin_required
def admin_delete_user():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Không có dữ liệu'}), 400

    username = data.get('username')

    if not username:
        return jsonify({'success': False, 'error': 'Thiếu username'}), 400

    if username == 'admin':
        return jsonify({'success': False, 'error': 'Không thể xóa tài khoản admin'}), 400

    try:
        if db.delete_user(username):
            return jsonify({'success': True, 'message': 'Xóa user thành công'})
        else:
            return jsonify({'success': False, 'error': 'Không thể xóa user'}), 500
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra'}), 500

@admin_bp.route('/api/admin/change-password', methods=['POST'])
@api_admin_required
def admin_change_own_password():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Không có dữ liệu'}), 400

    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'success': False, 'error': 'Vui lòng điền đầy đủ thông tin'}), 400

    if not db.login_user(session['username'], current_password):
        return jsonify({'success': False, 'error': 'Mật khẩu hiện tại không đúng'}), 400

    if db.update_user_password(session['username'], new_password):
        return jsonify({'success': True, 'message': 'Đổi mật khẩu thành công'})
    else:
        return jsonify({'success': False, 'error': 'Không thể đổi mật khẩu'}), 500

@admin_bp.route('/api/admin/change-user-password', methods=['POST'])
@api_admin_required
def admin_change_user_password():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Không có dữ liệu'}), 400

    username = data.get('username')
    new_password = data.get('new_password')

    if not username or not new_password:
        return jsonify({'success': False, 'error': 'Vui lòng điền đầy đủ thông tin'}), 400

    if db.update_user_password(username, new_password):
        return jsonify({'success': True, 'message': f'Đổi mật khẩu cho {username} thành công'})
    else:
        return jsonify({'success': False, 'error': 'Không thể đổi mật khẩu'}), 500