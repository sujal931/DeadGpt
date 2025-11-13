const input = document.querySelector("#input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask");
const voiceBtn = document.querySelector("#voice-btn");
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeText = document.querySelector("#theme-text");

const convoId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

// Theme Management
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeIcon(true);
}

themeToggle?.addEventListener('click', toggleTheme);

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    if (isDark) {
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
        themeText.textContent = 'Light';
    } else {
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
        themeText.textContent = 'Dark';
    }
}

// Voice recognition
let recognition = null;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        input.value = transcript;
        autoResize();
    };

    recognition.onend = () => {
        isRecording = false;
        voiceBtn.classList.remove('recording');
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        voiceBtn.classList.remove('recording');
    };
}

input?.addEventListener('keydown', handleEnter);
input?.addEventListener('input', autoResize);
askBtn?.addEventListener('click', handleAsk);
voiceBtn?.addEventListener('click', handleVoice);

async function generate(text) {
    // Remove welcome message
    const welcome = chatContainer.querySelector('.welcome');
    if (welcome) {
        welcome.remove();
    }

    // Add user message
    addMessage(text, 'user');
    input.value = "";
    autoResize();

    // Show typing indicator
    showTyping();

    try {
        const assistantMessage = await callServer(text);
        hideTyping();
        addMessage(assistantMessage, 'bot');
    } catch (error) {
        hideTyping();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessage(text, type) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${type}`;
    
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    
    wrapper.appendChild(message);
    chatContainer.appendChild(wrapper);
    
    scrollToBottom();
}

function showTyping() {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper bot';
    wrapper.id = 'typing-indicator';
    
    const message = document.createElement('div');
    message.className = 'message';
    
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = `
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    `;
    
    message.appendChild(typing);
    wrapper.appendChild(message);
    chatContainer.appendChild(wrapper);
    
    scrollToBottom();
}

function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) {
        typing.remove();
    }
}

function scrollToBottom() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

async function handleEnter(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) {
            return;
        }
        await generate(text);
    }
}

async function callServer(inputText) {
    const response = await fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({convoId: convoId, message: inputText})
    });

    if (!response.ok) {
        throw new Error("Failed to fetch");
    }

    const result = await response.json();
    return result.message;
}

async function handleAsk(e) {
    const text = input.value.trim();
    if (!text) {
        return;
    }
    await generate(text);
}

function handleVoice() {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }

    if (isRecording) {
        recognition.stop();
        isRecording = false;
        voiceBtn.classList.remove('recording');
    } else {
        try {
            recognition.start();
            isRecording = true;
            voiceBtn.classList.add('recording');
        } catch (error) {
            console.error('Voice recognition error:', error);
        }
    }
}

// Initialize
autoResize();
