class ProfileEditor {
    static init() {
        this.modal = document.getElementById('profile-editor');
        this.preview = document.getElementById('editor-image');
        this.signupPreview = document.getElementById('signup-preview');
        this.fileInput = document.getElementById('signup-profile-pic');
        this.rotation = 0;
        this.brightness = 100;
        this.filters = new Set();
        
        // Fix duplicate file manager opening
        this.setupFileInput();
    }

    static setupFileInput() {
        const previewImage = document.getElementById('signup-preview');
        const fileInput = document.getElementById('signup-profile-pic');

        // Remove old listeners
        previewImage.replaceWith(previewImage.cloneNode(true));
        const newPreview = document.getElementById('signup-preview');

        // Add new click handler
        newPreview.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.openEditor(file);
            }
        });
    }

    static openEditor(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.preview.src = e.target.result;
            this.originalImage = e.target.result;
            this.modal.classList.remove('hidden');
            this.resetEdits();
        };
        reader.readAsDataURL(file);
    }

    static resetEdits() {
        this.rotation = 0;
        this.brightness = 100;
        this.filters.clear();
        this.applyEdits();
    }

    static rotate() {
        this.rotation = (this.rotation + 90) % 360;
        this.applyEdits();
    }

    static adjustBrightness(delta) {
        this.brightness = Math.max(50, Math.min(150, this.brightness + delta));
        this.applyEdits();
    }

    static toggleFilter(filter) {
        if (this.filters.has(filter)) {
            this.filters.delete(filter);
        } else {
            this.filters.add(filter);
        }
        this.applyEdits();
    }

    static applyEdits() {
        const filterStr = [...this.filters].join(' ');
        this.preview.style.transform = `rotate(${this.rotation}deg)`;
        this.preview.style.filter = `brightness(${this.brightness}%) ${filterStr}`;
    }

    static async save() {
        try {
            // Create a canvas to apply the edits
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;

                // Apply rotation
                if (this.rotation) {
                    ctx.translate(canvas.width/2, canvas.height/2);
                    ctx.rotate(this.rotation * Math.PI/180);
                    ctx.translate(-canvas.width/2, -canvas.height/2);
                }

                // Draw image
                ctx.drawImage(img, 0, 0);

                // Apply filters
                if (this.filters.size || this.brightness !== 100) {
                    ctx.filter = `brightness(${this.brightness}%) ${[...this.filters].join(' ')}`;
                    ctx.drawImage(canvas, 0, 0);
                }

                // Update preview
                this.signupPreview.src = canvas.toDataURL('image/jpeg', 0.8);
                this.modal.classList.add('hidden');
            };

            img.src = this.originalImage;
        } catch (error) {
            console.error('Error saving edits:', error);
        }
    }

    static cancel() {
        this.modal.classList.add('hidden');
        this.resetEdits();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ProfileEditor.init();
});

export default ProfileEditor;
