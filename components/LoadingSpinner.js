export default class LoadingSpinner {
    static show(container = document.body, message = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner-container';
        spinner.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-text">${message}</p>
            </div>
        `;
        container.appendChild(spinner);
        return spinner;
    }

    static hide(spinner) {
        spinner?.remove();
    }
}
