from flask import Blueprint, jsonify, session, request
import logging
from app.models.database import Database
from app.utils.decorators import login_required, api_login_required

api_bp = Blueprint('api', __name__)
db = Database()
logger = logging.getLogger(__name__)

@api_bp.route('/api/rankings')
@login_required
def get_rankings():
    try:
        rankings = db.get_rankings(limit=50)
        
        all_items = db.get_all_shop_items()
        items_dict = {item['id']: item['name'] for item in all_items}

        rank_data = []
        for rank, user_data in enumerate(rankings, 1):
            selected_item = user_data.get('selecteditem', 'none')
            item_name = items_dict.get(selected_item, None) if selected_item != 'none' else None
            
            rank_data.append({
                'rank': rank,
                'username': user_data['username'],
                'totalpoint': user_data['totalpoint'],
                'selecteditem': selected_item,
                'item_name': item_name
            })

        logger.info(f"Rankings data: {rank_data}")
        return jsonify({'success': True, 'rankings': rank_data})

    except Exception as e:
        logger.error(f"Error getting rankings: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra khi lấy dữ liệu ranking'}), 500

@api_bp.route('/api/user/points')
@login_required
def get_user_points():
    try:
        user_data = db.get_user_data(session['username'])
        if user_data:
            return jsonify({
                'success': True,
                'current_points': user_data.get('currentpoint', 0),
                'total_points': user_data.get('totalpoint', 0)
            })
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404
    except Exception as e:
        logger.error(f"Error getting user points: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@api_bp.route('/api/change_account_information', methods=['POST'])
@api_login_required
def change_account_information():
    try:
        data = request.get_json()
        new_password = data.get("newpassword", '').strip()
        repeat_password = data.get("repeatpassword", '').strip()
        current_password = data.get("currentpassword", '').strip()
        
        if not db.login_user(session['username'], current_password):
            return jsonify({"success": False, "error": "Mật khẩu hiện tại không đúng"}), 403
            
        if new_password != repeat_password:
            return jsonify({"success": False, "error": "Mật khẩu mới không khớp"}), 403
            
        if new_password == '' or repeat_password == '':
            return jsonify({"success": False, "error": "Mật khẩu không được để trống"}), 403
            
        if current_password == new_password:
            return jsonify({"success": True, "error": ""}), 200
            
        db.update_field(session['username'], 'password', db.hash_password(new_password))
        return jsonify({"success": True, "error": ""}), 200
        
    except Exception as e:
        logger.error(f"Error trying to update data: {e}")
        return jsonify({"success": False, "error": str(e)}), 500