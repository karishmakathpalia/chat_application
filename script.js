// Global variables
let currentUser = '';
let currentRoom = 'general';
let activeFormats = new Set();
let messageHistory = {};
let roomUsers = {
    'general': ['Alice', 'Bob'],
    'tech': ['Charlie'],
    'random': ['Dave', 'Eve', 'Frank']
};

// Initialize default messages for each room
messageHistory = {
    'general': [
        {
            user: 'Alice',
            text: 'Welcome to the chat! 👋',
            timestamp: new Date(Date.now() - 60000),
            id: 1
        },
        {
            user: 'Bob',
            text: 'Hey everyone! How\'s it going?',
            timestamp: new Date(Date.now() - 120000),
            id: 2
        }
    ],
    'tech': [
        {
            user: 'Charlie',
            text: 'Anyone working on interesting projects lately?',
            timestamp: new Date(Date.now() - 300000),
            id: 3
        }
    ],
    'random': [
        {
            user: 'Dave',
            text: 'Random fact: Octopuses have three hearts! 🐙',
            timestamp: new Date(Date.now() - 180000),
            id: 4
        },
        {
            user: 'Eve',
            text: 'That\'s actually fascinating!',
            timestamp: new Date(Date.now() - 90000),
            id: 5
        }
    ]
};

// Login functionality
function login() {
    const username = document.getElementById('usernameInput').value.trim();
    
    if (!username) {
        showNotification('Please enter a username', 'error');
        return;
    }

    if (username.length < 2) {
        showNotification('Username must be at least 2 characters', 'error');
        return;
    }

    // Check if username is already taken
    const allUsers = Object.values(roomUsers).flat();
    if (allUsers.includes(username)) {
        showNotification('Username already taken. Please choose another.', 'error');
        return;
    }

    currentUser = username;
    document.getElementById('userInfo').textContent = `👤 ${username}`;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'flex';
    
    // Add user to current room
    if (!roomUsers[currentRoom]) {
        roomUsers[currentRoom] = [];
    }
    roomUsers[currentRoom].push(currentUser);
    
    updateRoomUsers();
    showNotification(`Welcome ${username}!`, 'success');
    
    // Add join message
    addSystemMessage(`${username} joined the room`);
}

// Room management
function joinRoom(roomName) {
    if (roomName === currentRoom) return;

    // Remove user from previous room
    if (roomUsers[currentRoom]) {
        roomUsers[currentRoom] = roomUsers[currentRoom].filter(u => u !== currentUser);
    }

    // Add system message about leaving
    if (messageHistory[currentRoom]) {
        addSystemMessage(`${currentUser} left the room`, currentRoom);
    }

    currentRoom = roomName;
    
    // Add user to new room
    if (!roomUsers[roomName]) {
        roomUsers[roomName] = [];
    }
    roomUsers[roomName].push(currentUser);

    // Update UI
    document.querySelectorAll('.room-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-room="${roomName}"]`).classList.add('active');

    const roomEmojis = {
        'general': '🌟',
        'tech': '💻',
        'random': '🎲'
    };

    document.getElementById('currentRoomName').textContent = `${roomEmojis[roomName] || '💬'} ${roomName.charAt(0).toUpperCase() + roomName.slice(1)}`;
    document.getElementById('roomInfo').textContent = `You are now in the ${roomName} room`;

    loadMessages();
    updateRoomUsers();
    
    // Add join message
    addSystemMessage(`${currentUser} joined the room`);
    
    showNotification(`Joined ${roomName} room`);
}

function createRoom() {
    const roomName = document.getElementById('newRoomInput').value.trim().toLowerCase();
    
    if (!roomName) {
        showNotification('Please enter a room name', 'error');
        return;
    }

    if (roomName.length < 3) {
        showNotification('Room name must be at least 3 characters', 'error');
        return;
    }

    if (document.querySelector(`[data-room="${roomName}"]`)) {
        showNotification('Room already exists', 'error');
        return;
    }

    // Create new room
    const roomList = document.getElementById('roomList');
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-item';
    roomDiv.setAttribute('data-room', roomName);
    roomDiv.onclick = () => joinRoom(roomName);
    roomDiv.innerHTML = `
        <div>💬 ${roomName.charAt(0).toUpperCase() + roomName.slice(1)}</div>
        <div class="room-users">0 users online</div>
    `;
    
    roomList.appendChild(roomDiv);
    
    // Initialize room data
    messageHistory[roomName] = [];
    roomUsers[roomName] = [];
    
    document.getElementById('newRoomInput').value = '';
    showNotification(`Room "${roomName}" created successfully!`);
}

// Message handling
function sendMessage() {
    const input = document.getElementById('messageInput');
    let text = input.value.trim();
    
    if (!text) {
        showNotification('Please enter a message', 'error');
        return;
    }

    // Apply formatting
    text = applyFormatting(text);

    const message = {
        user: currentUser,
        text: text,
        timestamp: new Date(),
        id: Date.now()
    };

    if (!messageHistory[currentRoom]) {
        messageHistory[currentRoom] = [];
    }
    messageHistory[currentRoom].push(message);

    input.value = '';
    displayMessage(message);
    scrollToBottom();
    
    // Clear active formats
    activeFormats.clear();
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

function applyFormatting(text) {
    if (activeFormats.has('bold')) {
        text = `<strong>${text}</strong>`;
    }
    if (activeFormats.has('italic')) {
        text = `<em>${text}</em>`;
    }
    if (activeFormats.has('link')) {
        // Simple link detection and conversion
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    } else {
        // Auto-link URLs even without link formatting
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }
    return text;
}

function displayMessage(message) {
    const messagesContainer = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.user === currentUser ? 'own' : ''}`;
    
    const timeStr = formatTime(message.timestamp);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-header">${message.user} • ${timeStr}</div>
            <div class="message-text">${message.text}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // Play notification sound for other users' messages
    if (message.user !== currentUser) {
        playNotificationSound();
    }
}

function addSystemMessage(text, room = currentRoom) {
    const message = {
        user: 'System',
        text: `<em style="opacity: 0.7">${text}</em>`,
        timestamp: new Date(),
        id: Date.now(),
        isSystem: true
    };

    if (!messageHistory[room]) {
        messageHistory[room] = [];
    }
    messageHistory[room].push(message);

    if (room === currentRoom) {
        displayMessage(message);
        scrollToBottom();
    }
}

function loadMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    if (messageHistory[currentRoom]) {
        messageHistory[currentRoom].forEach(message => {
            displayMessage(message);
        });
    }
    
    scrollToBottom();
}

// Formatting functions
function toggleFormat(format) {
    const btn = document.querySelector(`[data-format="${format}"]`);
    
    if (activeFormats.has(format)) {
        activeFormats.delete(format);
        btn.classList.remove('active');
    } else {
        activeFormats.add(format);
        btn.classList.add('active');
    }
}

// Utility functions
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'Just now';
    } else if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} min${mins > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleString();
    }
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

function updateRoomUsers() {
    // Update room user counts
    document.querySelectorAll('.room-item').forEach(item => {
        const roomName = item.getAttribute('data-room');
        const userCount = roomUsers[roomName] ? roomUsers[roomName].length : 0;
        const userCountEl = item.querySelector('.room-users');
        if (userCountEl) {
            userCountEl.textContent = `${userCount} user${userCount !== 1 ? 's' : ''} online`;
        }
    });

    // Update online users list
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    
    if (roomUsers[currentRoom]) {
        roomUsers[currentRoom].forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <div class="user-status"></div>
                <div>${user}${user === currentUser ? ' (You)' : ''}</div>
            `;
            userList.appendChild(userDiv);
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    if (type === 'error') {
        notification.style.background = '#ef4444';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function playNotificationSound() {
    // Create a simple notification sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Fallback: no sound if Web Audio API is not supported
    }
}

// Event listeners
document.getElementById('messageInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

document.getElementById('usernameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

document.getElementById('newRoomInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
        createRoom();
    }
});

// Simulate real-time activity
function simulateActivity() {
    const activities = [
        () => {
            if (Math.random() > 0.7) {
                const randomUsers = ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'];
                const randomMessages = [
                    'Hey everyone! 👋',
                    'How\'s everyone doing today?',
                    'Anyone seen that new tech announcement?',
                    'Great weather today! ☀️',
                    'Working on any cool projects?',
                    'Coffee break time! ☕',
                    'Check out this link: https://example.com',
                    'Did you know that **honey never spoils**?',
                    'What\'s your favorite programming language?',
                    'Anyone up for a quick chat?'
                ];
                
                const user = randomUsers[Math.floor(Math.random() * randomUsers.length)];
                const text = randomMessages[Math.floor(Math.random() * randomMessages.length)];
                
                // Only add message if it's not from current user and they're not in the room
                if (user !== currentUser && !roomUsers[currentRoom]?.includes(user)) {
                    const message = {
                        user: user,
                        text: text,
                        timestamp: new Date(),
                        id: Date.now() + Math.random()
                    };
                    
                    if (!messageHistory[currentRoom]) {
                        messageHistory[currentRoom] = [];
                    }
                    messageHistory[currentRoom].push(message);
                    displayMessage(message);
                    scrollToBottom();
                }
            }
        }
    ];
    
    // Run random activity every 10-30 seconds
    setTimeout(() => {
        activities[0]();
        simulateActivity();
    }, Math.random() * 20000 + 10000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Focus on username input when page loads
    document.getElementById('usernameInput').focus();
    
    // Start simulating activity after 5 seconds
    setTimeout(simulateActivity, 5000);
    
    // Auto-scroll messages container
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.addEventListener('scroll', function() {
        // Auto-scroll to bottom if user is near bottom
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        if (scrollHeight - scrollTop - clientHeight < 100) {
            messagesContainer.scrollTop = scrollHeight;
        }
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    scrollToBottom();
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        scrollToBottom();
    }
});

// Prevent form submission on Enter in inputs
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});

// Add some Easter eggs
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence)) {
        addSystemMessage('🎉 Konami Code activated! You found the secret! 🎉');
        konamiCode = [];
    }
});

// Handle connection simulation
function simulateConnection() {
    const connectionStates = ['connected', 'connecting', 'disconnected'];
    let currentState = 'connected';
    
    setInterval(() => {
        if (Math.random() > 0.95) { // 5% chance to change state
            const newState = connectionStates[Math.floor(Math.random() * connectionStates.length)];
            if (newState !== currentState) {
                currentState = newState;
                
                if (currentState === 'disconnected') {
                    showNotification('Connection lost. Attempting to reconnect...', 'error');
                } else if (currentState === 'connected') {
                    showNotification('Connected to chat server');
                }
            }
        }
    }, 5000);
}

// Start connection simulation
setTimeout(simulateConnection, 10000);