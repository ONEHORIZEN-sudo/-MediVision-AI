from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import cv2
import numpy as np
from ultralytics import YOLO
import requests
import base64
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 5242880))  # 5MB default

# Load YOLO model
model = YOLO('yolov8n.pt')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_image(image_path):
    """Analyze image using YOLO and return detection results"""
    results = model(image_path)
    detections = []
    
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                cls = int(box.cls[0].cpu().numpy())
                class_name = model.names[cls]
                
                detections.append({
                    'class': class_name,
                    'confidence': float(conf),
                    'bbox': [float(x1), float(y1), float(x2), float(y2)]
                })
    
    return detections

def query_openrouter(prompt, image_data=None):
    """Send query to AI API with medical analysis capability"""
    # Try OpenRouter first
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    github_token = os.getenv('GITHUB_TOKEN')
    
    if not openrouter_key and not github_token:
        return "Error: No API key configured"
    
    # Add multilingual and dialect instruction
    multilingual_instruction = """Please respond in the exact same language, script, and style as the user's query. 
    - If user writes in Hindi (Devanagari script), respond in Hindi (Devanagari script)
    - If user writes Hindi words in English script (transliterated like 'kya hai ye'), respond in the same transliterated Hindi style
    - If user writes in English, respond in English
    - If user mixes languages, follow the same mixing pattern
    - Match the user's dialect, formality level, and writing style exactly
    - Preserve any regional expressions or colloquialisms used by the user"""
    
    if image_data:
        image_prompt = f"""{multilingual_instruction}
        
        Analyze this image and answer the user's question. Provide detailed analysis of what you see in the image.
        
        User query: {prompt}"""
        
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": image_prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
            ]
        }]
        model_name = "google/gemini-2.5-flash"
    else:
        enhanced_prompt = f"{multilingual_instruction}\n\nUser query: {prompt}"
        messages = [{"role": "user", "content": enhanced_prompt}]
        model_name = "google/gemini-2.5-flash"

    data = {
        "model": model_name,
        "messages": messages,
        "max_tokens": 1000
    }
    
    # Try OpenRouter first, then GitHub Models as fallback
    if openrouter_key:
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                                   headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0]['message']['content']
                    return content.replace('*', '')
        except:
            pass
    
    # Fallback to GitHub Models
    if github_token:
        try:
            headers = {
                "Authorization": f"token {github_token}",
                "Content-Type": "application/json"
            }
            
            # Use GitHub Models API (simplified)
            github_data = {
                "model": "gpt-4o-mini",
                "messages": messages,
                "max_tokens": 500
            }
            
            response = requests.post("https://models.inference.ai.azure.com/chat/completions", 
                                   headers=headers, json=github_data, timeout=20)
            
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and len(result['choices']) > 0:
                    content = result['choices'][0]['message']['content']
                    return content.replace('*', '')
        except:
            pass
    
    return "I'm currently experiencing connectivity issues. Please try again later."

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/app')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file selected'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'})
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Analyze image with YOLO
            detections = analyze_image(filepath)
            
            # Convert image to base64 for display
            with open(filepath, "rb") as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode()
        except Exception as e:
            return jsonify({'error': f'File processing failed: {str(e)}'})
        
        return jsonify({
            'success': True,
            'filename': filename,
            'image_data': img_base64,
            'detections': detections
        })
    
    return jsonify({'error': 'Invalid file type'})

@app.route('/query', methods=['POST'])
def handle_query():
    try:
        data = request.json
        query = data.get('query', '')
        image_data = data.get('image_data', '')
        
        if not query:
            return jsonify({'error': 'No query provided'})
        
        # Pass image_data only if it exists, otherwise None for normal chat
        response = query_openrouter(query, image_data if image_data else None)
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    app.run(debug=debug_mode)
