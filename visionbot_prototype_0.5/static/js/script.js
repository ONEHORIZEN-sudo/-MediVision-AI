let currentImageData = null;
let isRecording = false;
let voiceEnabled = true;
let recognition = null;
let speechSynthesis = window.speechSynthesis;

document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceToggleBtn = document.getElementById('voiceToggleBtn');
    const chatMessages = document.getElementById('chatMessages');
    const loading = document.getElementById('loading');
    
    // Initialize speech recognition
    initSpeechRecognition();
    
    // Enable general chat on page load
    enableGeneralChat();

    imageInput.addEventListener('change', handleImageUpload);
    sendBtn.addEventListener('click', sendMessage);
    voiceBtn.addEventListener('click', toggleVoiceRecording);
    voiceToggleBtn.addEventListener('click', toggleVoiceResponse);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !sendBtn.disabled) {
            sendMessage();
        }
    });
    
    // Enable general chat on page load
    enableGeneralChat();

    function showLoading() {
        loading.style.display = 'flex';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Check file type
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            addBotMessage('❌ Please upload a valid medical image file (PNG, JPG, JPEG, GIF, or BMP)');
            return;
        }

        // Check file size (16MB limit)
        if (file.size > 16 * 1024 * 1024) {
            addBotMessage('❌ File size too large. Please upload a medical image smaller than 16MB');
            return;
        }

        showLoading();

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            hideLoading();
            
            if (data.success) {
                currentImageData = data.image_data;
                displayImage(data.image_data);
                displayDetections(data.detections);
                enableChat();
                addBotMessage(`I've analyzed your medical image and identified ${data.detections.length} findings using AI diagnostic algorithms. What would you like to know about the results?`);
            } else {
                addBotMessage(`Upload failed: ${data.error}`);
            }
        })
        .catch(error => {
            hideLoading();
            console.error('Upload error:', error);
            addBotMessage(`Upload failed: ${error.message}`);
        });
    }

    function displayImage(imageData) {
        const imagePreview = document.getElementById('imagePreview');
        const uploadZone = document.getElementById('uploadZone');
        const cardTitle = document.getElementById('cardTitle');
        const clearBtn = document.getElementById('clearBtn');
        
        imagePreview.innerHTML = `<img src="data:image/jpeg;base64,${imageData}" alt="Uploaded image">`;
        uploadZone.style.display = 'none';
        imagePreview.style.display = 'block';
        cardTitle.textContent = 'Uploaded Image';
        clearBtn.style.display = 'block';
    }

    function displayDetections(detections) {
        const detectionsDiv = document.getElementById('detections');
        const detectionCount = document.getElementById('detectionCount');
        
        detectionCount.textContent = detections.length;
        
        if (detections.length === 0) {
            detectionsDiv.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No objects detected</p></div>';
            return;
        }

        let html = '';
        detections.forEach(detection => {
            const confidence = (detection.confidence * 100).toFixed(1);
            html += `
                <div class="detection-item">
                    <span class="detection-class">${detection.class}</span>
                    <span class="detection-confidence">${confidence}%</span>
                </div>
            `;
        });
        
        detectionsDiv.innerHTML = html;
    }

    function enableChat() {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = "Ask about the medical findings...";
        messageInput.focus();
    }
    
    function enableGeneralChat() {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = "Ask me anything...";
        messageInput.focus();
    }
    
    function enableGeneralChat() {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.placeholder = "Ask me anything...";
        messageInput.focus();
    }

    function addMessage(content, isUser = false, includeImage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-group ${isUser ? 'user' : 'bot'}`;
        
        let imageHtml = '';
        if (includeImage && currentImageData) {
            imageHtml = `<img src="data:image/jpeg;base64,${currentImageData}" alt="Image" class="message-image">`;
        }
        
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const sanitizedContent = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-bubble">
                <div class="message-header">
                    <span class="sender-name">${isUser ? 'You' : 'MediVision AI'}</span>
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-text">
                    <span>${sanitizedContent}</span>
                    ${imageHtml}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addBotMessage(content) {
        addMessage(content, false);
    }

    function addUserMessage(content, includeImage = false) {
        addMessage(content, true, includeImage);
    }
    
    function addThinkingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-group bot thinking-message';
        messageDiv.id = 'thinking-message';
        
        const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-bubble">
                <div class="message-header">
                    <span class="sender-name">MediVision AI</span>
                    <span class="message-time">${currentTime}</span>
                </div>
                <div class="message-text thinking-text">
                    <span class="thinking-dots">AI is thinking</span>
                    <div class="thinking-animation">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }
    
    function removeThinkingMessage() {
        const thinkingMsg = document.getElementById('thinking-message');
        if (thinkingMsg) {
            thinkingMsg.remove();
        }
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Include image only if available, otherwise send as normal chat
        addUserMessage(message, currentImageData ? true : false);
        messageInput.value = '';
        
        // Show thinking message
        const thinkingMessage = addThinkingMessage();

        fetch('/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: message,
                image_data: currentImageData || ''
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            removeThinkingMessage();
            if (data.error) {
                addBotMessage(`❌ Error: ${data.error}`);
            } else {
                addBotMessage(data.response || 'No response received');
            }
        })
        .catch(error => {
            removeThinkingMessage();
            console.error('Query error:', error);
            addBotMessage(`⚠️ Sorry, I encountered an error: ${error.message}`);
        });
    }

    // Clear image function
    window.clearImage = function() {
        const imagePreview = document.getElementById('imagePreview');
        const uploadZone = document.getElementById('uploadZone');
        const cardTitle = document.getElementById('cardTitle');
        const clearBtn = document.getElementById('clearBtn');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const detections = document.getElementById('detections');
        const detectionCount = document.getElementById('detectionCount');
        
        currentImageData = null;
        imagePreview.style.display = 'none';
        uploadZone.style.display = 'block';
        cardTitle.textContent = 'Upload Medical Image';
        clearBtn.style.display = 'none';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        messageInput.placeholder = 'Ask about the medical findings...';
        detectionCount.textContent = '0';
        detections.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>No findings yet</p></div>';
    };

    // Voice Assistant Functions
    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;
            
            recognition.onstart = function() {
                console.log('Voice recognition started');
            };
            
            recognition.onresult = function(event) {
                if (event.results.length > 0) {
                    const transcript = event.results[0][0].transcript;
                    console.log('Transcript:', transcript);
                    messageInput.value = transcript;
                    stopRecording();
                    setTimeout(() => {
                        if (transcript.trim()) {
                            sendMessage();
                        }
                    }, 100);
                }
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                stopRecording();
                if (event.error === 'no-speech') {
                    addBotMessage('No speech detected. Please try again.');
                } else if (event.error === 'not-allowed') {
                    addBotMessage('Microphone access denied. Please allow microphone access.');
                } else {
                    addBotMessage('Voice recognition error. Please try again.');
                }
            };
            
            recognition.onend = function() {
                console.log('Voice recognition ended');
                stopRecording();
            };
        } else {
            voiceBtn.style.display = 'none';
            console.warn('Speech recognition not supported in this browser');
        }
    }
    
    function toggleVoiceRecording() {
        if (!recognition) {
            addBotMessage('Voice recognition not supported in this browser.');
            return;
        }
        
        if (isRecording) {
            recognition.stop();
        } else {
            startRecording();
        }
    }
    
    function startRecording() {
        if (!recognition) return;
        
        try {
            isRecording = true;
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            recognition.start();
            addBotMessage('🎤 Listening... Speak now!');
        } catch (error) {
            console.error('Error starting recognition:', error);
            stopRecording();
            addBotMessage('Failed to start voice recognition.');
        }
    }
    
    function stopRecording() {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
    
    function toggleVoiceResponse() {
        voiceEnabled = !voiceEnabled;
        const icon = voiceToggleBtn.querySelector('i');
        
        if (voiceEnabled) {
            voiceToggleBtn.classList.remove('muted');
            icon.className = 'fas fa-volume-up';
            addBotMessage('🔊 Voice responses enabled');
        } else {
            voiceToggleBtn.classList.add('muted');
            icon.className = 'fas fa-volume-mute';
            speechSynthesis.cancel();
            addBotMessage('🔇 Voice responses disabled');
        }
    }
    
    function speakText(text) {
        if (!voiceEnabled || !speechSynthesis) return;
        
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
    }
    
    // Modify addBotMessage to include voice
    const originalAddBotMessage = addBotMessage;
    addBotMessage = function(content) {
        originalAddBotMessage(content);
        // Clean text for speech (remove emojis and special characters)
        const cleanText = content.replace(/[❌⚠️🎤🔊🔇]/g, '').trim();
        if (cleanText && !cleanText.startsWith('Upload failed') && !cleanText.startsWith('Error')) {
            speakText(cleanText);
        }
    };
    
    // Add some interactive elements
    setTimeout(() => {
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            particle.style.animationDelay = `${index * 0.5}s`;
        });
    }, 100);
});