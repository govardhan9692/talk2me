// Initialize Firebase with configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4TGRGQdBMIjxM_IuvAcX31iPyoB1CmSw",
  authDomain: "talk2me-f2dd1.firebaseapp.com",
  projectId: "talk2me-f2dd1",
  storageBucket: "talk2me-f2dd1.firebasestorage.app",
  messagingSenderId: "302571088922",
  appId: "1:302571088922:web:a9ae916550442c8157b5a3",
  measurementId: "G-S1FL048C5L"
};

// Initialize Cloudinary configuration
const cloudinaryConfig = {
  cloudName: "djvh8hdql",
  uploadPreset: "talk2me"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

// DOM Elements
const elements = {
  authSection: document.getElementById('auth-section'),
  chatSection: document.getElementById('chat-section'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  authTabs: document.querySelectorAll('.auth-tab'),
  messageInput: document.getElementById('message-input'),
  messagesContainer: document.getElementById('messages-container'),
  chatList: document.getElementById('chat-list'),
  mediaModal: document.getElementById('media-modal'),
  mediaUpload: document.getElementById('media-upload'),
  themeToggle: document.getElementById('theme-toggle'),
};

// Global State
const state = {
  currentUser: null,
  currentChat: null,
  typing: false,
  typingTimeout: null,
  lastRead: {},
  offlineMessages: [],
};

// Authentication Handlers
class AuthHandler {
  static switchAuthTab(e) {
    const tab = e.target.getAttribute('data-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authTabs = document.querySelectorAll('.auth-tab');
  
    // Update active tab
    authTabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
  
    // Show/hide forms
    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  }
  
  static async handleSignup(e) {
    e.preventDefault();
    console.log('Signup handler called'); // Debug log
  
    try {
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
  
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }
  
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
  
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
  
      // Create user
      console.log('Creating user with:', email); // Debug log
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      console.log('User created:', userCredential); // Debug log
  
      // Set display name
      await userCredential.user.updateProfile({
        displayName: name
      });
  
      // Add user profile with more details
      const photoURL = await this.handleProfileUpdate(
        document.getElementById('signup-profile-pic').files[0]
      );

      await db.collection('users').doc(userCredential.user.uid).set({
        name,
        email,
        photoURL,
        status: 'online',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
  
      console.log('User profile created'); // Debug log
      alert('Account created successfully!');
  
    } catch (error) {
      console.error('Signup error:', error); // Debug log
      alert(error.message);
    }
  }
  
  static init() {
    // Auth state observer
    auth.onAuthStateChanged(user => {
      state.currentUser = user;
      if (user) {
        this.handleSignedIn(user);
      } else {
        this.handleSignedOut();
      }
    });
  
    // Bind event listeners
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authTabs = document.querySelectorAll('.auth-tab');
  
    if (loginForm) loginForm.addEventListener('submit', e => this.handleLogin(e));
    if (signupForm) signupForm.addEventListener('submit', e => this.handleSignup(e));
    authTabs.forEach(tab => {
      tab.addEventListener('click', e => this.switchAuthTab(e));
    });

    this.setupProfilePictureListeners();
  }

  static async handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      alert(error.message);
    }
  }

  static handleSignedIn(user) {
    elements.authSection.classList.add('hidden');
    elements.chatSection.classList.remove('hidden');
      
      // Reset chat area to welcome screen
    document.getElementById('user-name').textContent = user.displayName || 'Anonymous';
    document.getElementById('user-avatar').src = user.photoURL || '/api/placeholder/48/48';
    
    ChatHandler.init(user);
    this.updateUserStatus('online');
    this.setupProfilePictureListeners();
  }

  static handleSignedOut() {
    elements.chatSection.classList.add('hidden');
    elements.authSection.classList.remove('hidden');
    this.updateUserStatus('offline');
  }

  static async updateUserStatus(status) {
    if (state.currentUser) {
      await db.collection('users').doc(state.currentUser.uid).update({
        status,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  static async handleProfileUpdate(file) {
    try {
      if (!file) return;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      const photoURL = data.secure_url;

      // Update Firebase Auth profile
      await state.currentUser.updateProfile({
        photoURL: photoURL
      });

      // Update Firestore user document
      await db.collection('users').doc(state.currentUser.uid).update({
        photoURL: photoURL
      });

      // Update UI
      document.getElementById('user-avatar').src = photoURL;
      return photoURL;

    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Error updating profile picture. Please try again.');
    }
  }

  static setupProfilePictureListeners() {
    // Add click handler for profile picture
    const profilePic = document.getElementById('user-avatar');
    if (profilePic) {
      profilePic.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            this.handleProfileUpdate(file);
          }
        };
        input.click();
      });
    }
  }
}

// Chat Handler
class ChatHandler {
  // Update init method to maintain welcome screen
  static async init(user) {
    this.showWelcomeScreen();
    this.setupChatListeners();
    this.setupMessageInput();
    this.setupFileUpload();
    this.setupEmojiPicker();
    await this.loadChats();
    this.setupPushNotifications();
    this.setupOfflineSupport();
    
    // Remove any existing chat selection
    state.currentChat = null;
  }

  // Add welcome screen method
  static showWelcomeScreen() {
    elements.messagesContainer.innerHTML = `
      <div class="welcome-screen">
        <i class="fas fa-comments"></i>
        <h2>Welcome to Talk2Me</h2>
        <p>Select a chat to start messaging</p>
      </div>
    `;
    
    // Disable input field and buttons
    elements.messageInput.disabled = true;
    document.querySelectorAll('.input-action-btn, .emoji-btn, .send-btn').forEach(btn => {
      btn.disabled = true;
    });
  }

  // Modify setupChatListeners to fix double message issue
  static setupChatListeners() {
    if (this.messageListener) {
      this.messageListener();  // Unsubscribe from previous listener
    }

    // Listen for new messages
    this.messageListener = db.collection('messages')
      .where('participants', 'array-contains', state.currentUser.uid)
      .orderBy('timestamp')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' && change.doc.data().timestamp) {
            // Only render if message has a timestamp (not a local message)
            this.renderMessage(change.doc.data());
          }
        });
      });

    // Listen for typing indicators
    elements.messageInput.addEventListener('input', this.handleTyping);
  }

  static setupMessageInput() {
    elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(e.target.value);
        e.target.value = '';
      }
    });
  }

  static async sendMessage(content, type = 'text', file = null) {
    try {
      if (!state.currentChat) {
        alert('Please select a chat first');
        return;
      }

      let fileUrl = content;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
          { method: 'POST', body: formData }
        );
        
        const data = await response.json();
        fileUrl = data.secure_url;
      }

      const message = {
        content: fileUrl,
        type,
        sender: state.currentUser.uid,
        receiver: state.currentChat,
        participants: [state.currentUser.uid, state.currentChat],
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
      };

      const docRef = await db.collection('messages').add(message);
      this.renderMessage({ ...message, id: docRef.id });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  }

  static async handleMediaUpload(file) {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      await this.sendMessage(data.secure_url, file.type.split('/')[0]);
    } catch (error) {
      console.error('Error uploading media:', error);
    }
  }

  static renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(
      message.sender === state.currentUser.uid ? 'sent' : 'received'
    );
    messageElement.setAttribute('data-message-id', message.id);
  
    // Create message content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';

    // Handle different message types
    switch (message.type) {
      case 'image':
        contentContainer.innerHTML = `<img src="${message.content}" alt="Shared image">`;
        break;
      case 'video':
        contentContainer.innerHTML = `
          <video controls>
            <source src="${message.content}" type="video/mp4">
          </video>
        `;
        break;
      case 'audio':
        contentContainer.innerHTML = `
          <audio controls>
            <source src="${message.content}" type="audio/mpeg">
          </audio>
        `;
        break;
      case 'application':
        contentContainer.innerHTML = `
          <div class="file-message">
            <i class="fas fa-file-pdf"></i>
            <a href="${message.content}" target="_blank">View Document</a>
          </div>`;
        break;
      default:
        contentContainer.textContent = message.content;
    }
  
    // Add message info and options
    const messageInfo = document.createElement('div');
    messageInfo.className = 'message-info';
    
    const timestamp = message.timestamp?.toDate?.() || new Date();
    messageInfo.innerHTML = `
      <span class="time">${timestamp.toLocaleTimeString()}</span>
      ${message.sender === state.currentUser.uid ? `
        <div class="message-status">${message.read ? '✓✓' : '✓'}</div>
      ` : ''}
    `;

    // Add message options menu
    const optionsButton = document.createElement('button');
    optionsButton.className = 'message-options-btn';
    optionsButton.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    optionsButton.onclick = (e) => {
      e.stopPropagation();
      this.showMessageOptions(message, messageElement);
    };

    messageElement.appendChild(contentContainer);
    messageElement.appendChild(messageInfo);
    messageElement.appendChild(optionsButton);
    
    elements.messagesContainer.appendChild(messageElement);
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
  }

  static showMessageOptions(message, messageElement) {
    const menu = document.createElement('div');
    menu.className = 'message-options-menu';
    
    const isOwnMessage = message.sender === state.currentUser.uid;
    
    menu.innerHTML = `
      <div class="menu-header">
        <span>Message options</span>
        <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="menu-options">
        ${isOwnMessage ? `
          <button class="menu-option" onclick="ChatHandler.editMessage('${message.id}', '${message.content}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="menu-option delete" onclick="ChatHandler.deleteMessage('${message.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        ` : `
          <button class="menu-option" onclick="ChatHandler.reportMessage('${message.id}')">
            <i class="fas fa-flag"></i> Report
          </button>
        `}
        <button class="menu-option" onclick="ChatHandler.showMessageInfo('${message.id}')">
          <i class="fas fa-info-circle"></i> Info
        </button>
        <button class="menu-option" onclick="ChatHandler.replyToMessage('${message.id}')">
          <i class="fas fa-reply"></i> Reply
        </button>
      </div>
    `;

    // Remove existing menu if any
    const existingMenu = document.querySelector('.message-options-menu');
    if (existingMenu) existingMenu.remove();

    messageElement.appendChild(menu);
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !messageElement.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }

  // Modify editMessage for better reliability
  static async editMessage(messageId, currentContent) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const contentElement = messageElement.querySelector('.message-content');
    if (!contentElement) return;

    // Store original content securely
    const originalContent = contentElement.textContent || currentContent;

    // Create edit container with proper escaping
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.innerHTML = `
      <input type="text" class="edit-input" value="${originalContent.replace(/"/g, '&quot;')}">
      <div class="edit-buttons">
        <button class="save-edit"><i class="fas fa-check"></i></button>
        <button class="cancel-edit"><i class="fas fa-times"></i></button>
      </div>
    `;

    // Replace content with edit container
    contentElement.innerHTML = '';
    contentElement.appendChild(editContainer);

    const input = editContainer.querySelector('.edit-input');
    input.focus();
    input.select();

    // Save handler
    const saveEdit = async () => {
      const newContent = input.value.trim();
      if (!newContent || newContent === originalContent) {
        contentElement.textContent = originalContent;
        return;
      }

      try {
        await db.collection('messages').doc(messageId).update({
          content: newContent,
          edited: true,
          editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Let the message listener handle the update
        // Don't update UI directly here
      } catch (error) {
        console.error('Error editing message:', error);
        alert('Failed to edit message');
        contentElement.textContent = originalContent;
      }
    };

    // Event handlers
    editContainer.querySelector('.save-edit').onclick = saveEdit;
    editContainer.querySelector('.cancel-edit').onclick = () => {
      contentElement.textContent = originalContent;
    };

    input.onkeypress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        contentElement.textContent = originalContent;
      }
    };
  }

  static async deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await db.collection('messages').doc(messageId).delete();
        
        // Remove from UI
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
          messageElement.remove();
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  }

  static async showMessageInfo(messageId) {
    const messageRef = db.collection('messages').doc(messageId);
    const message = (await messageRef.get()).data();
    
    const info = document.createElement('div');
    info.className = 'message-info-modal';
    info.innerHTML = `
      <div class="modal-content">
        <h3>Message Info</h3>
        <p>Sent: ${message.timestamp.toDate().toLocaleString()}</p>
        <p>Status: ${message.read ? 'Read' : 'Delivered'}</p>
        ${message.edited ? `<p>Edited: ${message.editedAt.toDate().toLocaleString()}</p>` : ''}
        <button onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
    `;
    
    document.body.appendChild(info);
  }

  static addSwipeGesture(element) {
    let startX;
    element.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    });

    element.addEventListener('touchend', e => {
      const diffX = e.changedTouches[0].clientX - startX;
      if (diffX > 50) { // Right swipe
        this.handleReply(element);
      }
    });
  }

  static handleReply(messageElement) {
    const replyBox = document.createElement('div');
    replyBox.classList.add('reply-box');
    replyBox.textContent = 'Replying to: ' + messageElement.textContent;
    elements.messageInput.parentElement.insertBefore(replyBox, elements.messageInput);
  }

  static handleTyping() {
    if (!state.typing) {
      state.typing = true;
      db.collection('typing').doc(state.currentChat).set({
        user: state.currentUser.uid,
        typing: true
      });
    }

    clearTimeout(state.typingTimeout);
    state.typingTimeout = setTimeout(() => {
      state.typing = false;
      db.collection('typing').doc(state.currentChat).set({
        user: state.currentUser.uid,
        typing: false
      });
    }, 1000);
  }

  static async setupPushNotifications() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          // Only attempt to get token if permission is granted
          try {
            const token = await messaging.getToken();
            await db.collection('users').doc(state.currentUser.uid).update({
              pushToken: token
            });
          } catch (error) {
            console.log('Push notification setup failed:', error);
            // Continue without push notifications
          }
        }
      }
    } catch (error) {
      console.log('Notification API not supported');
      // Continue without push notifications
    }
  }

  static setupOfflineSupport() {
    // Enable offline persistence
    db.enablePersistence()
      .catch(err => {
        console.error('Error enabling offline persistence:', err);
      });

    // Sync offline messages when back online
    window.addEventListener('online', () => {
      state.offlineMessages.forEach(async message => {
        await db.collection('messages').add(message);
      });
      state.offlineMessages = [];
    });
  }

  // Update loadChats to not auto-select first chat
  static async loadChats() {
    try {
      const usersSnapshot = await db.collection('users')
        .where(firebase.firestore.FieldPath.documentId(), '!=', state.currentUser.uid)
        .get();

      const chatList = document.getElementById('chat-list');
      chatList.innerHTML = '';

      if (usersSnapshot.empty) {
        chatList.innerHTML = `
          <div class="no-chats">
            <p>No users found</p>
          </div>
        `;
        return;
      }

      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const userDiv = document.createElement('div');
        userDiv.className = 'chat-user';
        userDiv.innerHTML = `
          <div class="chat-user-avatar">
            <img src="${userData.photoURL || '/api/placeholder/40/40'}" alt="${userData.name}">
            <span class="status-dot ${userData.status === 'online' ? 'online' : 'offline'}"></span>
          </div>
          <div class="chat-user-info">
            <h4>${userData.name}</h4>
            <p>${userData.status}</p>
          </div>
        `;

        userDiv.addEventListener('click', () => this.startChat(doc.id, userData));
        chatList.appendChild(userDiv);
      });
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }

  // Update startChat to enable inputs
  static async startChat(userId, userData) {
    state.currentChat = userId;
    
    // Clear messages when switching chats
    elements.messagesContainer.innerHTML = '';
    
    // Update chat header with user info
    const chatHeader = document.querySelector('.chat-header');
    chatHeader.innerHTML = `
      <div class="chat-contact">
        <img src="${userData.photoURL || '/api/placeholder/40/40'}" alt="${userData.name}" class="contact-avatar">
        <div class="contact-info">
          <h3 id="contact-name">${userData.name}</h3>
          <span id="contact-status" class="status-text">${userData.status}</span>
        </div>
        <div class="chat-actions">
          <button class="action-btn" onclick="ChatHandler.clearChat('${userId}')">
            <i class="fas fa-trash"></i>
          </button>
          <button class="action-btn" onclick="ChatHandler.toggleContactInfo('${userId}')">
            <i class="fas fa-info-circle"></i>
          </button>
        </div>
      </div>
    `;

    // Enable input field and buttons
    elements.messageInput.disabled = false;
    document.querySelectorAll('.input-action-btn, .emoji-btn, .send-btn').forEach(btn => {
      btn.disabled = false;
    });

    // Show chat area
    document.querySelector('.messages-container').classList.remove('hidden');
    document.querySelector('.chat-input-area').classList.remove('hidden');

    // Load messages for this chat
    await this.loadMessages(userId);

    // Setup real-time message updates
    this.setupMessageListener(userId);
  }

  // Add real-time message updates
  static setupMessageListener(chatUserId) {
    if (this.messageListener) {
      this.messageListener();
    }

    this.messageListener = db.collection('messages')
      .where('participants', 'array-contains', chatUserId)
      .orderBy('timestamp')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          const message = { ...change.doc.data(), id: change.doc.id };
          const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
          
          if (change.type === 'added' && message.timestamp && !messageElement) {
            this.renderMessage(message);
          } else if (change.type === 'modified' && messageElement) {
            this.updateMessage(message);
          } else if (change.type === 'removed' && messageElement) {
            this.removeMessage(message.id);
          }
        });
      });
  }

  // Add message update method
  static updateMessage(message) {
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
      const contentElement = messageElement.querySelector('.message-content');
      if (contentElement) {
        contentElement.textContent = message.content;
        if (message.edited) {
          const infoElement = messageElement.querySelector('.message-info');
          if (!infoElement.querySelector('.edited')) {
            // infoElement.innerHTML += '<span class="edited">(edited)</span>';
          }
        }
      }
    }
  }

  // Add message remove method
  static removeMessage(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  }

  static async toggleContactInfo(userId) {
    try {
        const infoPanel = document.querySelector('.contact-info-panel');
        
        // If panel exists and is active, just remove it
        if (infoPanel?.classList.contains('active')) {
            infoPanel.classList.remove('active');
            setTimeout(() => infoPanel.remove(), 300);
            return;
        }

        // Get user data
        const userData = (await db.collection('users').doc(userId).get()).data();
        
        // Create new panel
        const newPanel = document.createElement('div');
        newPanel.className = 'contact-info-panel';
        newPanel.innerHTML = `
            <div class="info-header">
                <h3>Contact Info</h3>
                <button class="close-btn" onclick="ChatHandler.closeContactInfo(this)">×</button>
            </div>
            <div class="info-content">
                <div class="contact-profile">
                    <img src="${userData.photoURL || '/api/placeholder/100/100'}" alt="${userData.name}">
                    <h4>${userData.name}</h4>
                    <p>${userData.email}</p>
                    <p class="status ${userData.status}">${userData.status}</p>
                    <p>Last seen: ${userData.lastSeen?.toDate?.().toLocaleString() || 'N/A'}</p>
                </div>
            </div>
        `;

        document.body.appendChild(newPanel);
        // Small delay to trigger animation
        setTimeout(() => newPanel.classList.add('active'), 10);

    } catch (error) {
        console.error('Error showing contact info:', error);
    }
}

// Add new method for closing info panel
static closeContactInfo(button) {
    const panel = button.closest('.contact-info-panel');
    panel.classList.remove('active');
    setTimeout(() => panel.remove(), 300);
}

  static setupFileUpload() {
    // Image upload handler
    const imageBtn = document.querySelector('.input-action-btn:nth-child(2)');
    imageBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = this.handleImagePreview;
      input.click();
    };

    // Other file upload handler
    const fileBtn = document.querySelector('.input-action-btn:first-child');
    fileBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*,audio/*,.pdf';
      input.onchange = (e) => this.handleFileUpload(e.target.files[0]);
      input.click();
    };
  }

  static handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content image-preview">
        <h3>Send Image</h3>
        <img src="${URL.createObjectURL(file)}" alt="Preview">
        <div class="modal-buttons">
          <button onclick="this.closest('.modal').remove()">Cancel</button>
          <button onclick="ChatHandler.sendImage(this, '${URL.createObjectURL(file)}')">Send</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal._file = file; // Store file reference
  }

  static async sendImage(button, preview) {
    const modal = button.closest('.modal');
    const file = modal._file;
    
    button.disabled = true;
    button.textContent = 'Sending...';
    
    try {
      await this.sendMessage(null, 'image', file);
      modal.remove();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Send';
      alert('Failed to send image');
    }
  }

  // Update setupEmojiPicker for better reliability
  static setupEmojiPicker() {
    const emojiBtn = document.querySelector('.emoji-btn');
    const messageInput = document.getElementById('message-input');
    let picker = null;

    const commonEmojis = ['😊', '😂', '❤️', '👍', '😎', '🎉', '🔥', '💪', '🙏', '😭'];
    
    const createPicker = () => {
      if (picker) {
        picker.remove();
        picker = null;
        return;
      }

      picker = document.createElement('div');
      picker.className = 'emoji-picker';
      picker.innerHTML = commonEmojis.map(emoji => 
        `<button class="emoji-item" data-emoji="${emoji}">${emoji}</button>`
      ).join('');

      picker.style.position = 'absolute';
      picker.style.bottom = '100%';
      picker.style.right = '0';

      emojiBtn.parentElement.appendChild(picker);
    };

    emojiBtn.onclick = (e) => {
      e.stopPropagation();
      createPicker();
    };

    document.addEventListener('click', (e) => {
      if (picker && !picker.contains(e.target) && e.target !== emojiBtn) {
        picker.remove();
        picker = null;
      }
    });

    document.addEventListener('emoji-click', (e) => {
      if (messageInput && !messageInput.disabled) {
        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        messageInput.value = messageInput.value.substring(0, start) + 
                           e.detail.emoji + 
                           messageInput.value.substring(end);
        messageInput.focus();
        messageInput.selectionStart = messageInput.selectionEnd = start + 1;
      }
    });
  }

  static async loadMessages(chatUserId) {
    try {
      elements.messagesContainer.innerHTML = '';
      
      const messagesSnapshot = await db.collection('messages')
        .where('participants', 'array-contains', state.currentUser.uid)
        .orderBy('timestamp')
        .get();

      const messages = messagesSnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(message => message.participants.includes(chatUserId));

      // Render messages only once
      messages.forEach(message => {
        if (!document.querySelector(`[data-message-id="${message.id}"]`)) {
          this.renderMessage(message);
        }
      });

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  // Add clear chat method
  static async clearChat(userId) {
    if (!confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
      return;
    }

    try {
      // Get all messages between current user and selected user
      const messages = await db.collection('messages')
        .where('participants', 'array-contains', state.currentUser.uid)
        .get();

      // Delete messages that belong to this chat
      const batch = db.batch();
      messages.docs.forEach(doc => {
        const message = doc.data();
        if (message.participants.includes(userId)) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
      elements.messagesContainer.innerHTML = ''; // Clear UI
      
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat');
    }
  }
}

// Theme Handler
class ThemeHandler {
  static init() {
    elements.themeToggle.addEventListener('click', this.toggleTheme);
    this.loadTheme();
  }

  static toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    elements.themeToggle.textContent = isDark ? '🌙' : '☀️';
  }

  static loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', theme);
    elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  AuthHandler.init();
  ThemeHandler.init();
});

// Handle page visibility for online/offline status
document.addEventListener('visibilitychange', () => {
  if (state.currentUser) {
    AuthHandler.updateUserStatus(
      document.visibilityState === 'visible' ? 'online' : 'away'
    );
  }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', () => {
  if (state.currentUser) {
    AuthHandler.updateUserStatus('offline');
  }
});

// Create Firebase messaging service worker
if ('serviceWorker' in navigator) {
window.addEventListener('load', async () => {
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope'
    });
  } catch (error) {
    console.log('Service worker registration failed:', error);
  }
});
}