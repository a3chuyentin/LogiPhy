class AdminPanel {
    constructor() {
        this.currentTab = 'users';
        this.users = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadUsers();
        this.loadStats();
    }

    showPopup(message, type = 'success') {
        let popup = document.getElementById('admin-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'admin-popup';
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
            
            if (!document.querySelector('#admin-popup-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'admin-popup-styles';
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
                    
                    .admin-popup-zoom-out {
                        animation: popupZoomOut 0.3s ease forwards !important;
                    }
                `;
                document.head.appendChild(styleSheet);
            }
            
            document.body.appendChild(popup);
        }
        
        const icon = popup.querySelector('div:first-child');
        const msg = popup.querySelector('p');
        
        icon.textContent = type === 'success' ? '✅' : '❌';
        msg.textContent = message;
        popup.style.borderColor = type === 'success' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
        
        if (popup.classList.contains('admin-popup-zoom-out')) {
            popup.classList.remove('admin-popup-zoom-out');
            popup.style.animation = 'popupZoomIn 0.3s ease forwards';
        }
        
        popup.style.pointerEvents = 'auto';
        
        clearTimeout(popup.timeoutId);
        popup.timeoutId = setTimeout(() => {
            popup.classList.add('admin-popup-zoom-out');
            setTimeout(() => {
                popup.style.pointerEvents = 'none';
            }, 300);
        }, 2500);
    }

    async deleteUser() {
        const username = document.getElementById('edit-username').value;
        
        if (username === 'admin') {
            this.showPopup('Không thể xóa tài khoản admin', 'error');
            return;
        }

        const confirmed = await this.showConfirmPopup(`Bạn có chắc muốn xóa user "${username}"?`);
        if (!confirmed) return;

        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username })
            });

            if (response.ok) {
                this.showPopup('Xóa user thành công', 'success');
                this.closeModal();
                this.loadUsers();
                this.loadStats();
            } else {
                this.showPopup('Không thể xóa user', 'error');
            }
        } catch (error) {
            this.showPopup('Lỗi kết nối đến server', 'error');
        }
    }

    showConfirmPopup(message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: linear-gradient(135deg, rgba(66, 132, 219, 0.98) 0%, rgba(41, 234, 196, 0.98) 100%);
                border: 2px solid rgba(240, 228, 145, 0.6);
                backdrop-filter: blur(20px);
                border-radius: 1.5rem;
                padding: 2rem;
                z-index: 10001;
                min-width: 320px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                opacity: 0;
                transition: all 0.3s ease;
            `;
            modal.innerHTML = `
                <div style="font-size: 2.5rem; margin-bottom: 1rem;">⚠️</div>
                <p style="color: white; margin-bottom: 1.5rem; font-size: 1rem;">${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="confirm-yes" style="background: linear-gradient(135deg, #4caf50, #81c784); border: none; padding: 10px 24px; border-radius: 40px; color: white; font-weight: 600; cursor: pointer;">Có</button>
                    <button id="confirm-no" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); padding: 10px 24px; border-radius: 40px; color: white; font-weight: 600; cursor: pointer;">Không</button>
                </div>
            `;
            document.body.appendChild(modal);
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 10);
            
            const yesBtn = modal.querySelector('#confirm-yes');
            const noBtn = modal.querySelector('#confirm-no');
            
            const close = (result) => {
                modal.style.opacity = '0';
                modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
                setTimeout(() => {
                    modal.remove();
                    resolve(result);
                }, 300);
            };
            
            yesBtn.onclick = () => close(true);
            noBtn.onclick = () => close(false);
        });
    }

    showSuccess(message) {
        this.showPopup(message, 'success');
    }

    showError(message) {
        this.showPopup(message, 'error');
    }

    // Các phương thức khác giữ nguyên
    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.getElementById('search-users')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });

        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.changeOwnPassword();
        });

        document.getElementById('change-user-password-btn')?.addEventListener('click', () => {
            this.changeUserPassword();
        });

        document.querySelector('.close')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('save-user-btn')?.addEventListener('click', () => {
            this.saveUserChanges();
        });

        document.getElementById('delete-user-btn')?.addEventListener('click', () => {
            this.deleteUser();
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('edit-user-modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;

        if (tabName === 'stats') {
            this.loadStats();
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                this.users = data.users;
                this.renderUsers(this.users);
            } else {
                this.showError('Không thể tải danh sách users');
            }
        } catch (error) {
            this.showError('Lỗi kết nối đến server');
        }
    }

    renderUsers(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            
            const items = [];
            for (let i = 1; i <= 5; i++) {
                if (user[`item${i}`]) items.push(i);
            }
            const itemsText = items.length > 0 ? items.join(', ') : 'Không có';

            row.innerHTML = `
                <td>${this.escapeHtml(user.username)}</td>
                <td>${user.totalpoint || 0}</td>
                <td>${user.currentpoint || 0}</td>
                <td>${this.escapeHtml(itemsText)}</td>
                <td>${this.escapeHtml(user.selecteditem || 'Không có')}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-btn" data-username="${this.escapeHtml(user.username)}">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.closest('.edit-btn').dataset.username;
                this.openEditModal(username);
            });
        });
    }

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderUsers(filteredUsers);
    }

    openEditModal(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return;

        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-total-points').value = user.totalpoint || 0;
        document.getElementById('edit-current-points').value = user.currentpoint || 0;

        document.getElementById('edit-user-modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('edit-user-modal').style.display = 'none';
    }

    async saveUserChanges() {
        const username = document.getElementById('edit-username').value;
        const totalPoints = parseInt(document.getElementById('edit-total-points').value) || 0;
        const currentPoints = parseInt(document.getElementById('edit-current-points').value) || 0;

        try {
            const response = await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    total_point: totalPoints,
                    current_point: currentPoints
                })
            });

            if (response.ok) {
                this.showSuccess('Cập nhật user thành công');
                this.closeModal();
                this.loadUsers();
                this.loadStats();
            } else {
                this.showError('Không thể cập nhật user');
            }
        } catch (error) {
            this.showError('Lỗi kết nối đến server');
        }
    }

    async changeOwnPassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showError('Mật khẩu mới không khớp');
            return;
        }

        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Đổi mật khẩu thành công');
                document.getElementById('current-password').value = '';
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
            } else {
                this.showError(data.message || 'Không thể đổi mật khẩu');
            }
        } catch (error) {
            this.showError('Lỗi kết nối đến server');
        }
    }

    async changeUserPassword() {
        const username = document.getElementById('target-username').value;
        const newPassword = document.getElementById('target-new-password').value;

        if (!username || !newPassword) {
            this.showError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const response = await fetch('/api/admin/change-user-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess(`Đổi mật khẩu cho ${username} thành công`);
                document.getElementById('target-username').value = '';
                document.getElementById('target-new-password').value = '';
            } else {
                this.showError(data.message || 'Không thể đổi mật khẩu');
            }
        } catch (error) {
            this.showError('Lỗi kết nối đến server');
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                this.renderStats(data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    renderStats(stats) {
        const totalUsers = document.getElementById('total-users');
        const totalPoints = document.getElementById('total-points');
        const topUser = document.getElementById('top-user');

        if (totalUsers) totalUsers.textContent = stats.total_users || 0;
        if (totalPoints) totalPoints.textContent = stats.total_points || 0;
        if (topUser) topUser.textContent = stats.top_user || '-';

        if (stats.top_users) {
            this.renderTopUsersChart(stats.top_users);
        }
    }

    renderTopUsersChart(topUsers) {
        const chart = document.getElementById('top-users-chart');
        if (!chart) return;

        chart.innerHTML = '';

        const maxPoints = Math.max(...topUsers.map(user => user.totalpoint || 0));
        if (maxPoints <= 0) return;
        
        topUsers.forEach(user => {
            const barHeight = ((user.totalpoint || 0) / maxPoints) * 150;
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${barHeight}px`;
            bar.style.flex = '1';
            
            const label = document.createElement('div');
            label.className = 'bar-label';
            label.textContent = user.username;
            
            const points = document.createElement('div');
            points.textContent = user.totalpoint || 0;
            points.className = 'text-xs text-slate-300 mt-1';
            
            bar.appendChild(label);
            bar.appendChild(points);
            chart.appendChild(bar);
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});