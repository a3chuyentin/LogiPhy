from flask import Blueprint, request, jsonify, session, Response
import time
import logging
from app.models.database import Database
from app.services import get_ai_service
from app.utils.helpers import read_prompt_file, create_prompt_content, validate_question_response
from app.utils.decorators import login_required
from app.config import Config
import json

handle_bp = Blueprint('handle', __name__)
db = Database()
logger = logging.getLogger(__name__)

@handle_bp.route('/process-question', methods=['POST'])
@login_required
def process_question():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Không có dữ liệu'}), 400

    lop = data.get('lop', '').strip()
    question_data = data.get('question', '').strip()

    if not question_data:
        return jsonify({'error': 'Vui lòng nhập câu hỏi'}), 400

    prompt_template = read_prompt_file(Config.QUESTION_PROMPT_FILE)
    if not prompt_template:
        return jsonify({'error': 'Không thể đọc file prompt'}), 500

    content = create_prompt_content(lop, question_data, prompt_template)
    logger.info(f"Sending to AI: {content}")

    try:
        ai_service = get_ai_service()
        questions_json = ai_service.generate_question(content)
        logger.info(f"AI response: {questions_json}")

        if not questions_json:
            final_result = {
                'loigiai': [{'buoc': '1', 'chitiet': 'Lỗi: Không có phản hồi từ AI'}],
                'dapan': 'Lỗi hệ thống'
            }
        else:
            result = questions_json[0] if isinstance(questions_json, list) else questions_json
            final_result = validate_question_response(result)
        
        logger.info(f"Final processed result: {final_result}")
        
        return Response(
            json.dumps(final_result, ensure_ascii=False),
            mimetype='application/json'
        )

    except Exception as e:
        logger.error(f"Error in process_question: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        error_result = {
            'loigiai': [{'buoc': '1', 'chitiet': f'Lỗi hệ thống: {str(e)}'}],
            'dapan': 'Lỗi xử lý'
        }
        
        return Response(
            json.dumps(error_result, ensure_ascii=False),
            mimetype='application/json',
            status=500
        )

@handle_bp.route('/process-answer', methods=['POST'])
@login_required
def process_answer():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Không có dữ liệu'}), 400

    lop = data.get('lop', '').strip()
    question = data.get('question', '').strip()
    user_answer = data.get('user_answer', '').strip()
    question_id = data.get('id', '').strip()

    if not question or not user_answer:
        return jsonify({'error': 'Thiếu thông tin câu hỏi hoặc câu trả lời'}), 400

    prompt_template = read_prompt_file(Config.COMPARE_PROMPT_FILE)
    if not prompt_template:
        return jsonify({'error': 'Không thể đọc file prompt'}), 500

    prompt = f"Lớp: {lop}\nCâu hỏi: {question}\nCâu trả lời của học sinh: {user_answer}\n\n{prompt_template}"

    try:
        ai_service = get_ai_service()
        compare_result = ai_service.generate_question(prompt)
        
        try:
            json_data = None
            if compare_result:
                if isinstance(compare_result, list) and len(compare_result) > 0:
                    json_data = compare_result[0]
                elif isinstance(compare_result, dict):
                    json_data = compare_result
            
            if json_data:
                acstatus = json_data.get('acstatus', "false")
                
                if str(acstatus).lower() == "true":
                    session_key = f"score_{question_id}"
                    
                    if session_key in session:
                        earned_point = session[session_key]
                        user_data = db.get_user_data(session['username'])
                        
                        if user_data is not None:
                            total_point = user_data.get('totalpoint', 0) + earned_point
                            current_point = user_data.get('currentpoint', 0) + earned_point
                            db.update_points(session['username'], total_point, current_point)
        except Exception as e:
            logging.error(f"Error in points update: {e}")

        session[f"score_{question_id}"] = 0
        
        response_data = compare_result if isinstance(compare_result, list) else [compare_result]
        
        return Response(
            json.dumps(response_data, ensure_ascii=False),
            mimetype='application/json'
        )
        
    except Exception as e:
        logging.error(f"Error processing answer: {str(e)}")
        return jsonify({'error': 'Có lỗi xảy ra khi xử lý câu trả lời'}), 500

@handle_bp.route('/api/new_session_id', methods=['POST'])
@login_required
def new_session_id():
    logger.info(f"new_session_id endpoint called by user: {session.get('username')}")

    epoch_time = int(time.time())
    session_key = f"score_{epoch_time}"

    if session_key in session:
        logger.warning(f"new_session_id: Session already exists: {session_key}")
        return jsonify({'success': False, 'grade': 0, 'comment': 'Already exists', 'id': ''}), 409

    session[session_key] = 100
    logger.info(f"new_session_id: Created new session: {session_key} for user: {session['username']}")

    return jsonify({
        'success': True,
        'grade': 100,
        'comment': '',
        'id': str(epoch_time)
    }), 200


@handle_bp.route('/api/update_temporary_score', methods=['POST'])
@login_required
def update_temporary_score():
    data = request.get_json()
    change_in_score = data.get('change', '0').strip()
    session_id = data.get('id', '').strip()
    
    if f"score_{session_id}" not in session:
        return jsonify({'success': False, 'grade': 0, 'comment': 'Not existed', 'id': ''}), 404

    new_score = int(session[f"score_{session_id}"]) + int(change_in_score)
    if new_score < 0:
        new_score = 0
    session[f"score_{session_id}"] = new_score
    
    return jsonify({
        'success': True,
        'grade': session[f"score_{session_id}"],
        'comment': '',
        'id': session_id
    }), 200


@handle_bp.route('/api/zero_out_temporary_score', methods=['POST'])
@login_required
def zero_out_temporary_score():
    data = request.get_json()
    session_id = data.get('id', '').strip()
    
    if f"score_{session_id}" not in session:
        return jsonify({'success': False, 'grade': 0, 'comment': 'Not existed', 'id': ''}), 404
        
    session[f"score_{session_id}"] = 0
    return jsonify({
        'success': True,
        'grade': session[f"score_{session_id}"],
        'comment': '',
        'id': session_id
    }), 200