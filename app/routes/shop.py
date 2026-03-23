from flask import Blueprint, request, jsonify, render_template, session
import json
import logging
from app.models.database import Database
from app.utils.decorators import login_required
from app.config import Config

shop_bp = Blueprint('shop', __name__)
db = Database()
logger = logging.getLogger(__name__)

@shop_bp.route('/shop')
@login_required
def shop_page():
    return render_template('shop.html', username=session.get('username'))

@shop_bp.route('/api/shop/items')
@login_required
def get_shop_items():
    try:
        with open(Config.SHOP_ITEMS_FILE, 'r', encoding='utf-8') as file:
            shop_data = json.load(file)
            return jsonify({'success': True, 'items': shop_data['items']})
    except Exception as e:
        logger.error(f"Error loading shop items: {str(e)}")
        return jsonify({'success': False, 'error': 'Không thể tải danh sách items'}), 500

@shop_bp.route('/api/shop/buy', methods=['POST'])
@login_required
def buy_item():
    data = request.get_json()
    logger.info(f"Buy item request data: {data}")

    if not data:
        return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400

    item_id = data.get('item_id', '').strip()
    logger.info(f"Item ID: {item_id}")

    if not item_id:
        return jsonify({'success': False, 'message': 'Thiếu thông tin item'}), 400

    try:
        username = session['username']
        user_data = db.get_user_data(username)
        logger.info(f"User data: {user_data}")

        if not user_data:
            return jsonify({'success': False, 'message': 'Không tìm thấy thông tin user'}), 404

        with open(Config.SHOP_ITEMS_FILE, 'r', encoding='utf-8') as file:
            shop_data = json.load(file)

        item_info = None
        for item in shop_data['items']:
            if item['id'] == item_id:
                item_info = item
                break

        if not item_info:
            return jsonify({'success': False, 'message': 'Item không tồn tại'}), 404

        logger.info(f"Item info: {item_info}")

        owns_item = user_data.get(item_id, False)
        logger.info(f"User owns {item_id}: {owns_item}")

        if owns_item:
            return jsonify({'success': False, 'message': 'Bạn đã sở hữu item này'}), 400

        current_points = user_data.get('currentpoint', 0)
        item_price = item_info['price']

        logger.info(f"User points: {current_points}, Item price: {item_price}")

        if current_points < item_price:
            return jsonify({
                'success': False, 
                'message': f'Không đủ điểm để mua. Bạn có {current_points} điểm, cần {item_price} điểm'
            }), 400

        new_current_points = current_points - item_price

        db.update_field(username, item_id, True)
        db.update_current_point(username, new_current_points)

        logger.info(f"Purchase successful for {username}: {item_info['name']}")

        return jsonify({
            'success': True,
            'message': f'Mua {item_info["name"]} thành công!',
            'new_balance': new_current_points,
            'item': {
                'id': item_id,
                'name': item_info['name'],
                'price': item_price
            }
        })

    except Exception as e:
        logger.error(f"Error buying item: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra khi mua item'}), 500

@shop_bp.route('/api/inventory')
@login_required
def get_inventory():
    try:
        user_data = db.get_user_data(session['username'])
        if not user_data:
            return jsonify({'success': False, 'error': 'Không tìm thấy user'}), 404

        with open(Config.SHOP_ITEMS_FILE, 'r', encoding='utf-8') as file:
            shop_data = json.load(file)

        inventory = []
        for item in shop_data['items']:
            item_id = item['id']
            if user_data.get(item_id, False):
                inventory.append({
                    'id': item_id,
                    'name': item['name'],
                    'price': item['price'],
                    'selected': user_data.get('selecteditem') == item_id
                })

        return jsonify({
            'success': True,
            'inventory': inventory,
            'current_points': user_data.get('currentpoint', 0),
            'total_points': user_data.get('totalpoint', 0)
        })

    except Exception as e:
        logger.error(f"Error getting inventory: {str(e)}")
        return jsonify({'success': False, 'error': 'Có lỗi xảy ra khi lấy inventory'}), 500

@shop_bp.route('/api/inventory/select', methods=['POST'])
@login_required
def select_item():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Không có dữ liệu'}), 400

    item_id = data.get('item_id', '').strip()

    if not item_id:
        return jsonify({'success': False, 'message': 'Thiếu thông tin item'}), 400

    try:
        user_data = db.get_user_data(session['username'])
        if not user_data.get(item_id, False):
            return jsonify({'success': False, 'message': 'Bạn không sở hữu item này'}), 400

        db.update_selected_item(session['username'], item_id)

        return jsonify({'success': True, 'message': 'Đã chọn item thành công!'})

    except Exception as e:
        logger.error(f"Error selecting item: {str(e)}")
        return jsonify({'success': False, 'message': 'Có lỗi xảy ra khi chọn item'}), 500