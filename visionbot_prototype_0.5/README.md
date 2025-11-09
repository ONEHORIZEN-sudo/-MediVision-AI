# MediVision AI- AI Image Analysis Chat

A modern web application that combines YOLO object detection with AI-powered chat capabilities through OpenRouter API.

## Features

- **YOLO Object Detection**: Automatically detects and identifies objects in uploaded images
- **AI Chat Interface**: Ask questions about detected objects using OpenRouter API
- **Modern Dark UI**: ChatGPT-inspired interface with dark theme
- **Real-time Analysis**: Instant image processing and chat responses
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure OpenRouter API**:
   - Get your API key from [OpenRouter](https://openrouter.ai/)
   - Replace `YOUR_OPENROUTER_API_KEY` in `app.py` with your actual API key

3. **Run the Application**:
   ```bash
   python app.py
   ```

4. **Access the App**:
   - Open your browser and go to `http://localhost:5000`

## Usage

1. **Upload an Image**: Click the "Upload Image" button and select an image file
2. **View Detections**: See the objects detected by YOLO in the sidebar
3. **Chat**: Ask questions about the image in the chat interface
4. **Get AI Responses**: Receive intelligent responses about the image content

## File Structure

```
visionbot/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── yolov8n.pt         # YOLO model weights
├── uploads/           # Uploaded images storage
├── static/
│   ├── css/
│   │   └── style.css  # Modern dark theme styles
│   └── js/
│       └── script.js  # Frontend JavaScript
└── templates/
    └── index.html     # Main HTML template
```

## Technologies Used

- **Backend**: Flask, YOLO (Ultralytics), OpenCV
- **Frontend**: HTML5, CSS3, JavaScript
- **AI**: OpenRouter API for chat responses
- **Computer Vision**: YOLOv8 for object detection

## API Configuration

Make sure to set up your OpenRouter API key in the `app.py` file:

```python
api_key = "YOUR_OPENROUTER_API_KEY"  # Replace with your actual key
```

## Supported Image Formats

- PNG
- JPG/JPEG
- GIF
- BMP

Maximum file size: 16MB
