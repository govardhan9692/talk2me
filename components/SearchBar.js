class SearchBar {
    constructor() {
        this.searchInput = document.querySelector('.user-search input');
        this.setupSearch();
    }

    setupSearch() {
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const chatUsers = document.querySelectorAll('.chat-user');

            chatUsers.forEach(user => {
                const userName = user.querySelector('h4').textContent.toLowerCase();
                if (userName.includes(searchTerm)) {
                    user.style.display = 'flex';
                } else {
                    user.style.display = 'none';
                }
            });
        });
    }
}

// Initialize the search bar
document.addEventListener('DOMContentLoaded', () => {
    new SearchBar();
});

export default SearchBar;
