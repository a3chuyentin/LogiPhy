class AuthHandler {
    constructor() {
        this.init();
    }

    init() {}

    showPopup(message, type = 'error') {
        let popup = document.getElementById('auth-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'auth-popup';
            popup.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.7);
                background: linear-gradient(135deg, rgba(66, 132, 219, 0.98) 0%, rgba(41, 234, 196, 0.98) 100%);
                border: 2px solid ${type === 'success' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'};
                backdrop-filter: blur(20px);
                border-radius: 1.5rem;
                padding: 2rem 2.5rem;
                box-shadow: 0 0 80px rgba(240, 228, 145, 0.4);
                z-index: 10000;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
                min-width: 300px;
                text-align: center;
                animation: popupZoomIn 0.3s ease forwards;
            `;
            popup.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 0.75rem;">${type === 'success' ? '✅' : '❌'}</div>
                <p style="color: white; font-size: 1.125rem; font-weight: 700; margin: 0;"></p>
            `;
            
            const styleSheet = document.createElement("style");
            styleSheet.textContent = `
                @keyframes popupZoomIn {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.7);
                    }
                    50% {
                        opacity: 0.8;
                        transform: translate(-50%, -50%) scale(1.05);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                @keyframes popupZoomOut {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.7);
                    }
                }
                
                .auth-popup-zoom-out {
                    animation: popupZoomOut 0.3s ease forwards !important;
                }
            `;
            document.head.appendChild(styleSheet);
            
            document.body.appendChild(popup);
        }
        
        const icon = popup.querySelector('div:first-child');
        const msg = popup.querySelector('p');
        
        icon.textContent = type === 'success' ? '✅' : '❌';
        msg.textContent = message;
        popup.style.borderColor = type === 'success' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
        
        if (popup.classList.contains('auth-popup-zoom-out')) {
            popup.classList.remove('auth-popup-zoom-out');
            popup.style.animation = 'popupZoomIn 0.3s ease forwards';
        }
        
        popup.style.pointerEvents = 'auto';
        
        clearTimeout(popup.timeoutId);
        popup.timeoutId = setTimeout(() => {
            popup.classList.add('auth-popup-zoom-out');
            setTimeout(() => {
                popup.style.pointerEvents = 'none';
            }, 300);
        }, 2500);
    }

    async handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showPopup(data.message, 'success');
                setTimeout(() => this.navigateToHome(), 1500);
            } else {
                this.showPopup(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showPopup('Có lỗi xảy ra khi đăng nhập!', 'error');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            this.showPopup('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showPopup('Mật khẩu phải có ít nhất 8 ký tự!', 'error');
            return;
        }
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showPopup(data.message, 'success');
                setTimeout(() => this.navigateToLogin(), 1500);
            } else {
                this.showPopup(data.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showPopup('Có lỗi xảy ra khi đăng ký!', 'error');
        }
    }

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const button = input.nextElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    navigateToHome() {
        window.location.href = '/';
    }

    navigateToLogin() {
        window.location.href = '/login';
    }
}

const auth = new AuthHandler();

window.handleLogin = (event) => auth.handleLogin(event);
window.handleRegister = (event) => auth.handleRegister(event);
window.togglePassword = (inputId) => auth.togglePassword(inputId);