class ProfileEditor {
    static init() {
        this.widget = null;
        this.setupFileInput();
    }

    static setupFileInput() {
        const previewImage = document.getElementById('signup-preview');
        const userAvatar = document.getElementById('user-avatar');

        // Remove old listeners and clone elements
        const newPreview = previewImage.cloneNode(true);
        previewImage.parentNode.replaceChild(newPreview, previewImage);

        // Setup Cloudinary widget once
        this.widget = window.cloudinary.createUploadWidget({
            cloudName: 'djvh8hdql',
            uploadPreset: 'talk2me',
            sources: [ // Enable multiple upload sources
                'local',
                'camera',
                'url',
                'facebook',
                'instagram',
                'google_drive'
            ],
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            showSkipCropButton: false,
            multiple: false,
            maxFiles: 1,
            // Enable built-in image editor
            showAdvancedOptions: true,
            styles: {
                palette: {
                    window: "#FFFFFF",
                    windowBorder: "#90A0B3",
                    tabIcon: "#0078FF",
                    menuIcons: "#5A616A",
                    textDark: "#000000",
                    textLight: "#FFFFFF",
                    link: "#0078FF",
                    action: "#FF620C",
                    inactiveTabIcon: "#0E2F5A",
                    error: "#F44235",
                    inProgress: "#0078FF",
                    complete: "#20B832",
                    sourceBg: "#E4EBF1"
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === "success") {
                const imageUrl = result.info.secure_url;
                if (this.currentTarget === 'signup') {
                    newPreview.src = imageUrl;
                } else if (this.currentTarget === 'profile') {
                    userAvatar.src = imageUrl;
                    // Update user profile in database
                    if (window.AuthHandler) {
                        window.AuthHandler.handleProfileUpdate(imageUrl);
                    }
                }
            }
        });

        // Add click handlers
        newPreview.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.currentTarget = 'signup';
            this.widget.open();
        });

        if (userAvatar) {
            const newAvatar = userAvatar.cloneNode(true);
            userAvatar.parentNode.replaceChild(newAvatar, userAvatar);
            
            newAvatar.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.currentTarget = 'profile';
                this.widget.open();
            });
        }
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
