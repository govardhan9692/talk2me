class MobileNavigation {
  constructor() {
    this.currentView = 'chatList'; // chatList or conversation
    this.initialize();
  }

  initialize() {
    // Set initial state
    this.updateView();
    this.setupEventListeners();
  }

  updateView() {
    const chatSection = document.querySelector('.chat-section');
    const sidebar = document.querySelector('.sidebar');
    const chatArea = document.querySelector('.chat-area');

    if (this.currentView === 'chatList') {
      sidebar.style.display = 'flex';
      chatArea.style.display = 'none';
      chatSection.classList.remove('show-conversation');
    } else {
      sidebar.style.display = 'none';
      chatArea.style.display = 'flex';
      chatSection.classList.add('show-conversation');
    }
  }

  showConversation() {
    this.currentView = 'conversation';
    this.updateView();
  }

  showChatList() {
    this.currentView = 'chatList';
    this.updateView();
  }

  setupEventListeners() {
    // Back button handler
    document.querySelector('.mobile-back-btn')?.addEventListener('click', () => {
      this.showChatList();
    });

    // Handle chat selection
    document.querySelectorAll('.chat-user').forEach(chat => {
      chat.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          this.showConversation();
        }
      });
    });
  }
}

export default MobileNavigation;
