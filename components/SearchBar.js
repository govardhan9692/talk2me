class SearchBar {
  constructor() {
    this.searchInput = document.querySelector('.user-search input');
    this.init();
  }

  init() {
    this.searchInput.addEventListener('input', this.handleSearch.bind(this));
    // Add clear button
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-search';
    clearButton.innerHTML = '×';
    clearButton.onclick = () => {
      this.searchInput.value = '';
      this.handleSearch();
    };
    this.searchInput.parentElement.appendChild(clearButton);
  }

  handleSearch() {
    const query = this.searchInput.value.toLowerCase();
    const chatUsers = document.querySelectorAll('.chat-user');
    
    chatUsers.forEach(user => {
      const name = user.querySelector('h4').textContent.toLowerCase();
      user.style.display = name.includes(query) ? 'flex' : 'none';
    });
  }
}

export default SearchBar;
