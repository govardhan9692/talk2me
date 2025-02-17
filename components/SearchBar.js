class SearchBar {
    constructor() {
        this.searchInput = document.querySelector('.user-search input');
        this.clearButton = null;
        this.init();
    }

    init() {
        if (!this.searchInput) return;

        // Add clear button
        this.clearButton = document.createElement('button');
        this.clearButton.className = 'clear-search';
        this.clearButton.innerHTML = '×';
        this.clearButton.style.display = 'none';
        this.searchInput.parentElement.appendChild(this.clearButton);

        // Event listeners
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.clearButton.addEventListener('click', () => this.clearSearch());

        // Initial search in case there's a value
        this.handleSearch();
    }

    handleSearch() {
        const query = this.searchInput.value.toLowerCase().trim();
        const chatUsers = document.querySelectorAll('.chat-user');
        let hasResults = false;

        this.clearButton.style.display = query ? 'block' : 'none';

        chatUsers.forEach(user => {
            const nameEl = user.querySelector('h4');
            if (!nameEl) return;

            const name = nameEl.textContent.toLowerCase();
            const match = name.includes(query);
            user.style.display = match ? 'flex' : 'none';
            if (match) hasResults = true;
        });

        // Show/hide no results message
        this.showNoResults(!hasResults && query.length > 0);
    }

    clearSearch() {
        this.searchInput.value = '';
        this.handleSearch();
        this.searchInput.focus();
    }

    showNoResults(show) {
        let noResultsEl = document.querySelector('.no-results-message');
        
        if (show) {
            if (!noResultsEl) {
                noResultsEl = document.createElement('div');
                noResultsEl.className = 'no-results-message';
                noResultsEl.textContent = 'No users found';
                const chatList = document.getElementById('chat-list');
                if (chatList) {
                    chatList.appendChild(noResultsEl);
                }
            }
        } else if (noResultsEl) {
            noResultsEl.remove();
        }
    }
}

// Initialize the search bar
document.addEventListener('DOMContentLoaded', () => {
    new SearchBar();
});

export default SearchBar;
