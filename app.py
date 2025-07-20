import os
import json
from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv
from supabase import create_client, Client
import requests
import re
from urllib.parse import urlparse
from werkzeug.utils import secure_filename
import uuid

load_dotenv()

app = Flask(__name__)

# 업로드 설정
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 업로드 폴더 생성
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Supabase 설정
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print("Warning: Supabase environment variables not found")
    supabase = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)

# OpenAI 관련 설정 제거됨

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cards', methods=['GET', 'POST'])
def cards():
    if request.method == 'GET':
        try:
            if not supabase:
                return jsonify({'error': 'Database not configured'}), 500
                
            search = request.args.get('search', '')
            category = request.args.get('category', '')
            subject = request.args.get('subject', '')
            
            query = supabase.table('edutech_cards').select('*')
            
            if search:
                query = query.or_(f"webpage_name.ilike.%{search}%,user_summary.ilike.%{search}%,ai_summary.ilike.%{search}%")
            
            if category:
                query = query.eq('ai_category', category)
            
            if subject:
                query = query.contains('useful_subjects', [subject])
            
            query = query.order('created_at', desc=True)
            
            result = query.execute()
            return jsonify(result.data or [])
            
        except Exception as e:
            print(f"Error fetching cards: {e}")
            return jsonify({'error': 'Failed to fetch cards'}), 500
    
    elif request.method == 'POST':
        try:
            data = request.json
            url = data.get('url')
            webpage_name = data.get('webpage_name')
            user_summary = data.get('user_summary', '')
            useful_subjects = data.get('useful_subjects', [])
            educational_meaning = data.get('educational_meaning', '')
            
            if not url or not webpage_name:
                return jsonify({'error': 'URL and webpage_name are required'}), 400
            
            # 썸네일 URL 처리
            thumbnail_url = data.get('thumbnail_url', '')
            if not thumbnail_url:
                thumbnail_url = f"https://via.placeholder.com/400x300?text={webpage_name}"
            
            new_card = {
                'url': url,
                'webpage_name': webpage_name,
                'user_summary': user_summary,
                'useful_subjects': useful_subjects,
                'educational_meaning': educational_meaning,
                'thumbnail_url': thumbnail_url,
            }
            
            result = supabase.table('edutech_cards').insert(new_card).execute()
            return jsonify(result.data[0]), 201
            
        except Exception as e:
            print(f"Error creating card: {e}")
            if 'duplicate key' in str(e):
                return jsonify({'error': 'URL already exists'}), 409
            return jsonify({'error': 'Failed to create card'}), 500

@app.route('/api/cards/<int:card_id>', methods=['PUT', 'DELETE'])
def card_operations(card_id):
    if not supabase:
        return jsonify({'error': 'Database not configured'}), 500
        
    if request.method == 'PUT':
        try:
            data = request.json
            url = data.get('url')
            webpage_name = data.get('webpage_name')
            user_summary = data.get('user_summary', '')
            useful_subjects = data.get('useful_subjects', [])
            educational_meaning = data.get('educational_meaning', '')
            
            if not url or not webpage_name:
                return jsonify({'error': 'URL and webpage_name are required'}), 400
            
            update_data = {
                'url': url,
                'webpage_name': webpage_name,
                'user_summary': user_summary,
                'useful_subjects': useful_subjects,
                'educational_meaning': educational_meaning,
                'updated_at': 'now()'
            }
            
            # 썸네일 URL이 제공되면 업데이트
            thumbnail_url = data.get('thumbnail_url')
            if thumbnail_url is not None:
                update_data['thumbnail_url'] = thumbnail_url
            
            # 먼저 카드가 존재하는지 확인
            check_result = supabase.table('edutech_cards').select('id').eq('id', card_id).execute()
            if not check_result.data:
                return jsonify({'error': 'Card not found'}), 404
            
            result = supabase.table('edutech_cards').update(update_data).eq('id', card_id).execute()
                
            return jsonify(result.data[0] if result.data else {'message': 'Updated successfully'})
            
        except Exception as e:
            print(f"Error updating card: {e}")
            return jsonify({'error': 'Failed to update card'}), 500
    
    elif request.method == 'DELETE':
        try:
            data = request.json or {}
            password = data.get('password', '')
            
            # 비밀번호 확인 (여기서 변경 가능)
            ADMIN_PASSWORD = "admin"  # 이 부분에서 비밀번호를 변경할 수 있습니다
            
            if password != ADMIN_PASSWORD:
                return jsonify({'error': '비밀번호가 일치하지 않습니다'}), 401
            
            # 먼저 카드가 존재하는지 확인
            check_result = supabase.table('edutech_cards').select('id').eq('id', card_id).execute()
            if not check_result.data:
                return jsonify({'error': 'Card not found'}), 404
            
            # 카드 삭제
            result = supabase.table('edutech_cards').delete().eq('id', card_id).execute()
            
            return jsonify({'message': 'Card deleted successfully'})
            
        except Exception as e:
            print(f"Error deleting card: {e}")
            return jsonify({'error': 'Failed to delete card'}), 500

# OpenAI 분석 기능 제거됨

@app.route('/api/duplicate-check', methods=['POST'])
def duplicate_check():
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        domain = urlparse(url).hostname
        
        result = supabase.table('edutech_cards').select('id, webpage_name, url').ilike('url', f'%{domain}%').limit(5).execute()
        
        return jsonify({'duplicates': result.data or []})
        
    except Exception as e:
        print(f"Error checking duplicates: {e}")
        return jsonify({'error': 'Failed to check duplicates'}), 500

# 웹페이지 내용 추출 함수 제거됨 (OpenAI 분석 관련)

@app.route('/api/upload-thumbnail', methods=['POST'])
def upload_thumbnail():
    try:
        if 'thumbnail' not in request.files:
            return jsonify({'error': 'No file selected'}), 400
        
        file = request.files['thumbnail']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if file and allowed_file(file.filename):
            # 고유한 파일명 생성
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
            filename = secure_filename(unique_filename)
            
            # 파일 저장
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # 파일 URL 반환
            file_url = f"/static/uploads/{filename}"
            return jsonify({
                'success': True,
                'filename': filename,
                'url': file_url
            })
        else:
            return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG, GIF, WebP allowed'}), 400
            
    except Exception as e:
        print(f"Error uploading thumbnail: {e}")
        return jsonify({'error': 'Failed to upload thumbnail'}), 500

@app.route('/static/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)
else:
    # Production server settings
    import logging
    logging.basicConfig(level=logging.INFO)