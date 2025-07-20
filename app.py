import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from dotenv import load_dotenv
from supabase import create_client, Client
import openai
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
supabase: Client = create_client(supabase_url, supabase_key)

# OpenAI 설정
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cards', methods=['GET', 'POST'])
def cards():
    if request.method == 'GET':
        try:
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

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        url = data.get('url')
        card_id = data.get('cardId')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # 웹페이지 내용 가져오기
        web_content = fetch_webpage_content(url)
        
        # OpenAI로 분석
        prompt = f"""
다음은 에듀테크 웹사이트의 내용입니다:

제목: {web_content['title']}
설명: {web_content['description']}
내용: {web_content['text_content']}

이 웹사이트를 분석해서 다음 정보를 JSON 형태로 제공해주세요:

{{
  "summary": "이 에듀테크 도구에 대한 간단하고 명확한 요약 (한국어, 100자 이내)",
  "keywords": ["핵심", "키워드", "배열", "형태로", "5개"], 
  "category": "교육 카테고리 (예: 언어학습, 수학, 과학, 코딩교육, 협업도구 등)",
  "educational_value": "교육적 가치와 활용 방안에 대한 설명 (한국어, 150자 이내)"
}}

응답은 반드시 유효한 JSON 형태로만 해주세요.
"""
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 에듀테크 전문가입니다. 웹사이트를 분석하여 교육적 가치와 활용 방안을 평가합니다."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        try:
            analysis_result = eval(response.choices[0].message.content)
        except:
            analysis_result = {
                "summary": "AI 분석에 실패했습니다.",
                "keywords": ["분석실패"],
                "category": "기타",
                "educational_value": "분석 결과를 가져올 수 없습니다."
            }
        
        # 카드 업데이트
        if card_id:
            supabase.table('edutech_cards').update({
                'ai_summary': analysis_result['summary'],
                'ai_keywords': analysis_result['keywords'],
                'ai_category': analysis_result['category']
            }).eq('id', card_id).execute()
        
        return jsonify(analysis_result)
        
    except Exception as e:
        print(f"Error analyzing webpage: {e}")
        return jsonify({'error': 'Failed to analyze webpage'}), 500

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

def fetch_webpage_content(url):
    try:
        response = requests.get(url)
        html = response.text
        
        # 제목 추출
        title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else ''
        
        # 설명 추출
        desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE)
        description = desc_match.group(1).strip() if desc_match else ''
        
        # 텍스트 내용 추출
        text_content = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', html, flags=re.IGNORECASE)
        text_content = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', text_content, flags=re.IGNORECASE)
        text_content = re.sub(r'<[^>]+>', ' ', text_content)
        text_content = re.sub(r'\s+', ' ', text_content).strip()[:2000]
        
        return {
            'title': title,
            'description': description,
            'text_content': text_content
        }
    except Exception as e:
        print(f"Error fetching webpage: {e}")
        raise Exception('Failed to fetch webpage content')

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
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))