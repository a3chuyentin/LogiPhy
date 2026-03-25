class HomePage {
    constructor() {
        this.currentTab = 'learning';
        this.pendingPurchase = null;
        this.init();
    }

    async init() {
        await this.loadUserPoints();
        await this.loadSelectedItem();
        await this.loadShopItems();
        await this.loadInventory();
        await this.loadRankings();
        this.switchTab('learning');
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            pane.classList.add('hidden');
        });
        
        const targetPane = document.getElementById(tabName);
        if (targetPane) {
            targetPane.classList.remove('hidden');
            targetPane.classList.add('active');
        }
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => {
            const onclickAttr = btn.getAttribute('onclick');
            return onclickAttr && onclickAttr.includes(tabName);
        });
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        if (tabName === 'shop') {
            this.loadShopItems();
        } else if (tabName === 'inventory') {
            this.loadInventory();
        } else if (tabName === 'ranking') {
            this.loadRankings();
        }
    }

    async loadUserPoints() {
        try {
            const response = await fetch('/api/user/points');
            const data = await response.json();
            if (data.success) {
                const totalPointsElem = document.getElementById('total-points');
                const currentPointsElem = document.getElementById('current-points');
                const shopPointsElem = document.getElementById('shop-points');
                
                if (totalPointsElem) totalPointsElem.textContent = data.total_points;
                if (currentPointsElem) currentPointsElem.textContent = data.current_points;
                if (shopPointsElem) shopPointsElem.textContent = data.current_points;
            }
        } catch (error) {
            console.error('Lỗi tải điểm:', error);
        }
    }

    async loadSelectedItem() {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            if (data.success && data.inventory) {
                const selected = data.inventory.find(item => item.selected);
                const display = document.getElementById('selected-item-display');
                if (display) {
                    if (selected) {
                        display.innerHTML = `
                            <div class="selected-item">
                                <span class="selected-icon">👑</span>
                                <span class="selected-text">Danh hiệu đang sử dụng: ${this.escapeHtml(selected.name)}</span>
                            </div>
                        `;
                    } else {
                        display.innerHTML = `
                            <div class="selected-item">
                                <span class="selected-icon">✨</span>
                                <span class="selected-text">Chưa có danh hiệu nào được chọn</span>
                            </div>
                        `;
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi tải danh hiệu đang chọn:', error);
        }
    }

    async loadShopItems() {
        try {
            const response = await fetch('/api/shop/items');
            const data = await response.json();
            if (data.success) {
                this.renderShopItems(data.items);
            } else {
                console.error('Lỗi tải shop items:', data.error);
            }
        } catch (error) {
            console.error('Lỗi tải shop items:', error);
        }
    }

    renderShopItems(items) {
        const container = document.getElementById('items-grid');
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>📦 Chưa có danh hiệu nào trong cửa hàng</p></div>';
            return;
        }
        
        container.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-icon">👑</div>
                <div class="item-name">${this.escapeHtml(item.name)}</div>
                <div class="item-price">💰 ${item.price} điểm</div>
                <button class="buy-btn" onclick="homePage.promptPurchase('${item.id}', '${this.escapeHtml(item.name)}', ${item.price})">
                    Mua ngay
                </button>
            `;
            container.appendChild(card);
        });
    }

    async loadInventory() {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            if (data.success) {
                this.renderInventory(data.inventory);
                const countSpan = document.getElementById('inv-count');
                if (countSpan) {
                    countSpan.textContent = `${data.inventory.length} danh hiệu`;
                }
            }
        } catch (error) {
            console.error('Lỗi tải inventory:', error);
        }
    }

    renderInventory(inventory) {
        const container = document.getElementById('inventory-grid');
        const emptyDiv = document.getElementById('empty-inventory');
        
        if (!container) return;
        
        if (!inventory || inventory.length === 0) {
            container.innerHTML = '';
            if (emptyDiv) emptyDiv.classList.remove('hidden');
            return;
        }
        
        if (emptyDiv) emptyDiv.classList.add('hidden');
        
        container.innerHTML = '';
        inventory.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card inventory-item';
            if (item.selected) {
                card.classList.add('selected');
            }
            card.innerHTML = `
                <div class="item-icon">👑</div>
                <div class="item-name">${this.escapeHtml(item.name)}</div>
                <div class="item-price">💰 ${item.price} điểm</div>
                <button class="select-btn" onclick="homePage.selectItem('${item.id}')" ${item.selected ? 'disabled' : ''}>
                    ${item.selected ? 'Đang sử dụng' : 'Sử dụng'}
                </button>
            `;
            container.appendChild(card);
        });
    }

    async selectItem(itemId) {
        try {
            const response = await fetch('/api/inventory/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showNotification(data.message);
                await this.loadInventory();
                await this.loadSelectedItem();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Lỗi chọn item:', error);
            this.showNotification('Có lỗi xảy ra', 'error');
        }
    }

    async loadRankings() {
        try {
            const response = await fetch('/api/rankings');
            const data = await response.json();
            if (data.success) {
                this.renderRankings(data.rankings);
                this.renderUserRank(data.rankings);
            }
        } catch (error) {
            console.error('Lỗi tải rankings:', error);
        }
    }

    renderRankings(rankings) {
        const container = document.getElementById('rankList');
        if (!container) return;
        
        if (!rankings || rankings.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>🏆 Chưa có dữ liệu xếp hạng</p></div>';
            return;
        }
        
        container.innerHTML = '';
        rankings.forEach(rank => {
            const item = document.createElement('div');
            
            let medal = '';
            let rankClass = '';
            if (rank.rank === 1) {
                medal = '🥇';
                rankClass = 'rank-first';
            } else if (rank.rank === 2) {
                medal = '🥈';
                rankClass = 'rank-second';
            } else if (rank.rank === 3) {
                medal = '🥉';
                rankClass = 'rank-third';
            } else {
                medal = `${rank.rank}`;
                rankClass = '';
            }
            
            item.className = `rank-item ${rankClass}`;
            
            let titleHtml = '';
            if (rank.item_name) {
                titleHtml = `<span class="rank-title-badge">👑 ${this.escapeHtml(rank.item_name)}</span>`;
            }
            
            item.innerHTML = `
                <div class="rank-number">${medal}</div>
                <div class="rank-username">${this.escapeHtml(rank.username)}</div>
                ${titleHtml}
                <div class="rank-points">⭐ ${rank.totalpoint} điểm</div>
            `;
            container.appendChild(item);
        });
    }

    async renderUserRank(rankings) {
        try {
            const userResponse = await fetch('/api/user/points');
            const userData = await userResponse.json();
            if (!userData.success) return;
            
            const currentPoints = userData.current_points;
            let rankNumber = null;
            
            for (let i = 0; i < rankings.length; i++) {
                if (rankings[i].totalpoint === currentPoints) {
                    rankNumber = i + 1;
                    break;
                }
            }
            
            const container = document.getElementById('user-rank-box');
            if (!container) return;
            
            if (rankNumber) {
                let medal = '';
                if (rankNumber === 1) medal = '🥇';
                else if (rankNumber === 2) medal = '🥈';
                else if (rankNumber === 3) medal = '🥉';
                else medal = `#${rankNumber}`;
                
                container.innerHTML = `
                    <div class="user-rank-card">
                        <div class="user-rank-title">🌟 Xếp hạng của bạn</div>
                        <div class="user-rank-info">
                            <div class="user-rank-medal">${medal}</div>
                            <div class="user-rank-points">⭐ ${currentPoints} điểm</div>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="user-rank-card">
                        <div class="user-rank-title">🌟 Xếp hạng của bạn</div>
                        <div class="user-rank-info">
                            <div class="user-rank-medal">📊</div>
                            <div class="user-rank-points">⭐ ${currentPoints} điểm</div>
                        </div>
                        <div class="user-rank-message">Tiếp tục luyện tập để có mặt trên bảng xếp hạng!</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Lỗi hiển thị rank user:', error);
        }
    }

    promptPurchase(itemId, itemName, itemPrice) {
        this.pendingPurchase = { itemId, itemName, itemPrice };
        
        const modal = document.getElementById('confirm-modal');
        const itemNameSpan = document.querySelector('.modal-item-name');
        const itemPriceSpan = document.querySelector('.modal-item-price');
        
        if (itemNameSpan) itemNameSpan.textContent = itemName;
        if (itemPriceSpan) itemPriceSpan.textContent = `${itemPrice} điểm`;
        
        if (modal) modal.classList.add('show');
    }

    async confirmPurchase() {
        if (!this.pendingPurchase) return;
        
        const { itemId } = this.pendingPurchase;
        
        try {
            const response = await fetch('/api/shop/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message);
                await this.loadUserPoints();
                await this.loadInventory();
                await this.loadShopItems();
                await this.loadRankings();
            } else {
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Lỗi mua item:', error);
            this.showNotification('Có lỗi xảy ra khi mua item', 'error');
        }
        
        this.closeConfirmModal();
        this.pendingPurchase = null;
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.classList.remove('show');
        this.pendingPurchase = null;
    }

    showNotification(message, type = 'success') {
        const modal = document.getElementById('notification-modal');
        if (!modal) return;
        
        const messageSpan = modal.querySelector('.modal-message');
        const iconSpan = modal.querySelector('.modal-icon');
        
        if (messageSpan) messageSpan.textContent = message;
        if (iconSpan) iconSpan.textContent = type === 'success' ? '✅' : '❌';
        
        modal.classList.add('show');
        
        setTimeout(() => {
            modal.classList.remove('show');
        }, 2500);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

let homePage;

function navigateToStudy() {
    window.location.href = '/learn';
}

function navigateToPractice() {
    window.location.href = '/practice';
}

function navigateToAdmin() {
    window.location.href = '/admin';
}

function logout() {
    window.location.href = '/logout';
}

async function SubmitAccountChanges() {
    const newPassword = document.getElementById('NewPassword').value;
    const repeatPassword = document.getElementById('RepeatPassword').value;
    const currentPassword = document.getElementById('CurrentPassword').value;
    
    if (!currentPassword) {
        if (homePage) homePage.showNotification('Vui lòng nhập mật khẩu hiện tại', 'error');
        return;
    }
    
    if (newPassword !== repeatPassword) {
        if (homePage) homePage.showNotification('Mật khẩu mới không khớp', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/change_account_information', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                newpassword: newPassword,
                repeatpassword: repeatPassword,
                currentpassword: currentPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (homePage) homePage.showNotification('Đổi mật khẩu thành công');
            document.getElementById('NewPassword').value = '';
            document.getElementById('RepeatPassword').value = '';
            document.getElementById('CurrentPassword').value = '';
        } else {
            if (homePage) homePage.showNotification(data.error || 'Đổi mật khẩu thất bại', 'error');
        }
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        if (homePage) homePage.showNotification('Có lỗi xảy ra', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    homePage = new HomePage();
    window.homePage = homePage;
    window.closeConfirmModal = () => homePage && homePage.closeConfirmModal();
    window.confirmPurchase = () => homePage && homePage.confirmPurchase();
});