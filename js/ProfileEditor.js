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
        const newAvatar = userAvatar.cloneNode(true);
        
        previewImage.parentNode.replaceChild(newPreview, previewImage);
        userAvatar.parentNode.replaceChild(newAvatar, userAvatar);

        // Setup Cloudinary widget
        this.widget = window.cloudinary.createUploadWidget({
            cloudName: 'djvh8hdql',
            uploadPreset: 'talk2me',
            sources: ['local', 'camera', 'url', 'facebook', 'instagram', 'google_drive'],
            cropping: true,
            croppingAspectRatio: 1,
            croppingShowDimensions: true,
            showSkipCropButton: false,
            multiple: false,
            maxFiles: 1,
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
                
                // Update the appropriate image based on current target
                if (this.currentTarget === 'signup') {
                    document.getElementById('signup-preview').src = imageUrl;
                    // Store the URL for later use during signup
                    document.getElementById('signup-preview').setAttribute('data-url', imageUrl);
                } else if (this.currentTarget === 'profile') {
                    document.getElementById('user-avatar').src = imageUrl;
                    // Update user profile in database
                    if (window.AuthHandler) {
                        window.AuthHandler.handleProfileUpdate(imageUrl);
                    }
                }
            }
            if (error) {
                console.error('Cloudinary Upload Error:', error);
            }
        });

        // Add click handlers
        newPreview.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.currentTarget = 'signup';
            this.widget.open();
        });

        newAvatar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.currentTarget = 'profile';
            this.widget.open();
        });
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ProfileEditor.init();
});

export default ProfileEditor;
