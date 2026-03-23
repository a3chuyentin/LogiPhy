class HomePage {
    constructor() {
        this.userData = null;
        this.shopData = [];
        this.rankingData = [];
        this.itemMap = {};
        this.currentPurchaseItem = null;
        this.init();
    }

    async init() {
        await this.loadShopItems();
        await Promise.all([this.loadUserData(), this.loadRankings()]);
        
        this.displayUserInfo();
        this.displaySelectedItem();
        this.renderInventory();
        this.renderShop();
        this.renderRankings();
    }

    async loadShopItems() {
        try {
            const response = await fetch('/static/json/shop.json');
            const data = await response.json();
            if (data.items) {
                this.shopData = data.items;
                this.shopData.forEach(item => {
                    this.itemMap[item.id] = item.name;
                });
            }
        } catch (error) {
            console.error('Lỗi tải shop.json:', error);
        }
    }

    async loadUserData() {
        try {
            const response = await fetch('/api/inventory');
            const data = await response.json();
            if (data.success) {
                this.userData = data;
            }
        } catch (error) {
            console.error('Lỗi tải user data:', error);
        }
    }

    async loadRankings() {
        try {
            const response = await fetch('/api/rankings');
            const data = await response.json();
            this.rankingData = data.success ? (data.rankings || []) : [];
        } catch (error) {
            console.error('Lỗi tải rankings:', error);
        }
    }

    getTitleName(itemId) {
        if (!itemId || itemId === 'none' || itemId === 'null') return 'Chưa có danh hiệu';
        return this.itemMap[itemId] || 'Danh hiệu ẩn';
    }

    displayUserInfo() {
        if (!this.userData) return;

        const total = this.userData.total_points ?? this.userData.totalpoint ?? 0;
        const current = this.userData.current_points ?? this.userData.currentpoint ?? 0;

        this.updateElementText('total-points', total);
        this.updateElementText('current-points', current);
        this.updateElementText('shop-points', current);
    }

    updateElementText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    displaySelectedItem() {
        const display = document.getElementById('selected-item-display');
        if (!display) return;

        if (!this.userData || !this.userData.inventory) {
            display.innerHTML = `<div class="no-item">Loading...</div>`;
            return;
        }

        const selected = this.userData.inventory.find(item => item.selected === true || item.selected === 1);

        if (selected) {
            const realName = this.getTitleName(selected.id);
            display.innerHTML = `
                <div class="active-item">
                    <div>✨ <span class="item-badge-inline">${realName}</span></div>
                    <div class="item-desc">Danh hiệu đang sử dụng</div>
                </div>
            `;
        } else {
            display.innerHTML = `<div class="no-item">Chưa đeo danh hiệu</div>`;
        }
    }

    renderInventory() {
        const grid = document.getElementById('inventory-grid');
        const empty = document.getElementById('empty-inventory');
        const count = document.getElementById('inv-count');

        const inventory = this.userData?.inventory || [];

        if (inventory.length === 0) {
            if (grid) grid.innerHTML = '';
            if (empty) empty.style.display = 'flex';
            if (count) count.textContent = '0 danh hiệu';
            return;
        }

        if (empty) empty.style.display = 'none';
        if (count) count.textContent = `${inventory.length} danh hiệu`;

        if (grid) {
            grid.innerHTML = inventory.map(item => {
                const displayName = this.getTitleName(item.id);
                const isSelected = item.selected === true || item.selected === 1;
                return `
                    <div class="item-card inventory-item ${isSelected ? 'selected' : ''}" 
                        onclick="homePage.selectItem('${item.id}')">
                        <div class="item-icon">👑</div>
                        <div class="item-name">${displayName}</div>
                        ${isSelected ? '<div class="item-badge-small">✓</div>' : ''}
                    </div>
                `;
            }).join('');
        }
    }

    renderShop() {
        const grid = document.getElementById('items-grid');
        if (!grid || !this.shopData) return;

        const userPoints = this.userData?.current_points ?? 0;
        const inventoryIds = (this.userData?.inventory || []).map(i => i.id);

        grid.innerHTML = this.shopData.map(item => {
            const isOwned = inventoryIds.includes(item.id);
            const canBuy = userPoints >= item.price && !isOwned;

            let statusClass = isOwned ? 'owned-status' : (canBuy ? 'available-status' : 'disabled-status');
            let statusText = isOwned ? '✓ Đã sở hữu' : (canBuy ? '💰 Mua ngay' : '✗ Thiếu điểm');

            return `
                <div class="item-card shop-item" onclick="homePage.handleBuyClick('${item.id}', '${item.name}', ${item.price}, ${isOwned})">
                    <div class="item-icon">🛍️</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.price} điểm</div>
                    <span class="buy-status ${statusClass}">${statusText}</span>
                </div>
            `;
        }).join('');
    }

    async renderRankings() {
        const rankList = document.getElementById('rankList');
        if (!rankList || !this.rankingData) return;

        rankList.style.opacity = '0.5';
        
        rankList.innerHTML = this.rankingData.map((item, index) => {
            let medalClass = '';
            let medal = '';
            if (index === 0) { medalClass = 'rank-first'; medal = '🥇'; }
            else if (index === 1) { medalClass = 'rank-second'; medal = '🥈'; }
            else if (index === 2) { medalClass = 'rank-third'; medal = '🥉'; }

            const rankNum = index + 1;
            const point = item.totalpoint !== undefined ? item.totalpoint : (item.points || 0);
            const itemId = item.selecteditem || item.title_id || 'none';
            const titleName = this.getTitleName(itemId);

            return `
                <div class="rank-row ${medalClass}">
                    <span class="rank-col rank-number">${medal || '#' + rankNum}</span>
                    <span class="rank-col rank-name">${item.username}</span>
                    <span class="rank-col rank-title">
                        <span class="title-badge ${itemId}">${titleName}</span>
                    </span>
                    <span class="rank-col rank-points">${point}</span>
                </div>
            `;
        }).join('');
        
        setTimeout(() => {
            rankList.style.opacity = '1';
        }, 100);

        this.updateUserFixedRank();
    }

    updateUserFixedRank() {
        const userRankBox = document.getElementById('user-rank-box');
        if (!userRankBox) return;

        let currentUsername = this.userData?.username;
        if (!currentUsername) {
            const nameEl = document.querySelector('.username-text');
            if (nameEl) currentUsername = nameEl.innerText.trim();
        }

        if (!currentUsername) {
            return;
        }

        const myIndex = this.rankingData.findIndex(r => r.username === currentUsername);
        let rankDisplay = '-';
        let pointsDisplay = 0;
        let titleId = 'none';

        if (myIndex !== -1) {
            const rankData = this.rankingData[myIndex];
            rankDisplay = '#' + (myIndex + 1);
            pointsDisplay = rankData.totalpoint ?? rankData.points ?? 0;
            titleId = rankData.selecteditem ?? rankData.title_id ?? 'none';
        } else {
            rankDisplay = 'Bạn';
            pointsDisplay = this.userData?.total_points ?? 0;
            const selectedItem = this.userData?.inventory?.find(i => i.selected === true || i.selected === 1);
            titleId = selectedItem ? selectedItem.id : 'none';
        }

        const titleName = this.getTitleName(titleId);
        userRankBox.innerHTML = `
            <div class="rank-row user-rank">
                <span class="rank-col rank-number">${rankDisplay}</span>
                <span class="rank-col rank-name">Bạn (${currentUsername})</span>
                <span class="rank-col rank-title">
                    <span class="title-badge ${titleId}">${titleName}</span>
                </span>
                <span class="rank-col rank-points">${pointsDisplay}</span>
            </div>
        `;
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.add('hidden');
            pane.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const pane = document.getElementById(tabName);
        const btn = document.querySelector(`[onclick*="switchTab('${tabName}')"]`);
        
        if (pane) {
            pane.classList.remove('hidden');
            pane.classList.add('active');
        }
        if (btn) btn.classList.add('active');
    }

    handleBuyClick(itemId, itemName, itemPrice, isOwned) {
        if (isOwned) {
            this.showPopup('Bạn đã sở hữu danh hiệu này rồi!', 'error');
            return;
        }

        const userPoints = parseInt(document.getElementById('current-points').textContent) || 0;
        if (userPoints < itemPrice) {
            this.showPopup('Bạn không đủ điểm để mua danh hiệu này!', 'error');
            return;
        }

        this.currentPurchaseItem = { id: itemId, name: itemName, price: itemPrice };
        this.showConfirmModal();
    }

    showConfirmModal() {
        if (!this.currentPurchaseItem) return;
        
        const modal = document.getElementById('confirm-modal');
        if (!modal) return;
        
        const itemName = modal.querySelector('.modal-item-name');
        const itemPrice = modal.querySelector('.modal-item-price');
        
        if (itemName && itemPrice) {
            itemName.textContent = this.currentPurchaseItem.name;
            itemPrice.textContent = `💰 ${this.currentPurchaseItem.price} điểm`;
            
            modal.classList.remove('hidden');
            modal.offsetHeight;
            modal.classList.add('show');
        }
    }

    closeConfirmModal() {
        const modal = document.getElementById('confirm-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    confirmPurchase() {
        if (!this.currentPurchaseItem) return;
        
        this.buyItem(this.currentPurchaseItem.id, this.currentPurchaseItem.name);
        this.closeConfirmModal();
    }

    async buyItem(itemId, itemName) {
        try {
            const response = await fetch('/api/shop/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            const data = await response.json();
            
            if (data.success) {
                const currentPointsSpan = document.getElementById('current-points');
                const shopPointsSpan = document.getElementById('shop-points');
                const newPoints = data.new_balance;
                
                if (currentPointsSpan) currentPointsSpan.textContent = newPoints;
                if (shopPointsSpan) shopPointsSpan.textContent = newPoints;
                
                if (this.userData) {
                    if (!this.userData.inventory) this.userData.inventory = [];
                    this.userData.inventory.push({
                        id: itemId,
                        name: itemName,
                        price: this.currentPurchaseItem.price,
                        selected: false
                    });
                    this.userData.current_points = newPoints;
                }
                
                this.renderInventory();
                
                this.renderShop();
                
                this.displaySelectedItem();
                
                this.showPopup(`Mua thành công "${itemName}"!`, 'success');
                
                this.currentPurchaseItem = null;
            } else {
                this.showPopup(data.error || data.message || 'Mua thất bại', 'error');
            }
        } catch (err) {
            console.error('Buy error:', err);
            this.showPopup('Lỗi kết nối', 'error');
        }
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
                if (this.userData && this.userData.inventory) {
                    this.userData.inventory.forEach(item => {
                        item.selected = false;
                    });
                    const selectedItem = this.userData.inventory.find(item => item.id === itemId);
                    if (selectedItem) {
                        selectedItem.selected = true;
                    }
                    this.userData.selecteditem = itemId;
                }
                
                this.renderInventory();
                
                this.displaySelectedItem();
                
                await this.loadRankings();
                this.renderRankings();
                
                this.showPopup('Đổi danh hiệu thành công!', 'success');
            } else {
                this.showPopup(data.error || data.message || 'Đổi thất bại', 'error');
            }
        } catch (err) {
            console.error('Select error:', err);
            this.showPopup('Lỗi kết nối', 'error');
        }
    }

    showPopup(message, type = 'success') {
        const modal = document.getElementById('notification-modal');
        if (!modal) {
            alert(message);
            return;
        }
        
        const modalIcon = modal.querySelector('.modal-icon');
        const modalMessage = modal.querySelector('.modal-message');
        const modalContent = modal.querySelector('.modal-content') || modal;
        
        if (modalIcon && modalMessage) {
            modalIcon.textContent = type === 'success' ? '✅' : '❌';
            modalMessage.textContent = message;
            
            modal.classList.remove('error', 'show');
            modal.offsetHeight;
            
            if (type === 'error') {
                modal.classList.add('error');
            }
            
            modal.classList.add('show');
            
            if (modalContent) {
                modalContent.style.animation = 'popupZoomIn 0.3s ease forwards';
            }
            
            setTimeout(() => {
                if (modalContent) {
                    modalContent.style.animation = 'popupZoomOut 0.3s ease forwards';
                }
                setTimeout(() => {
                    modal.classList.remove('show');
                    if (modalContent) {
                        modalContent.style.animation = '';
                    }
                }, 300);
            }, 2500);
        } else {
            alert(message);
        }
    }

    async SubmitAccountChanges() {
        const NewPassword = document.getElementById('NewPassword').value;
        const RepeatPassword = document.getElementById('RepeatPassword').value;
        const CurrentPassword = document.getElementById('CurrentPassword').value;
        
        if (!NewPassword || !RepeatPassword || !CurrentPassword) {
            this.showPopup('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }
        
        if (RepeatPassword !== NewPassword) {
            this.showPopup('Mật khẩu lặp lại không khớp', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/change_account_information', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "newpassword": NewPassword,
                    "repeatpassword": RepeatPassword,
                    "currentpassword": CurrentPassword
                })
            });
            const data = await response.json();
            
            if (data.success) {
                this.showPopup('Đã cập nhật thông tin thành công!', 'success');
                document.getElementById('NewPassword').value = '';
                document.getElementById('RepeatPassword').value = '';
                document.getElementById('CurrentPassword').value = '';
            } else {
                this.showPopup(data.error || 'Cập nhật thông tin thất bại', 'error');
            }
        } catch (err) {
            console.error('Change account information:', err);
            this.showPopup('Lỗi kết nối', 'error');
        }
    }
}

function switchTab(tabName) {
    if (window.homePage && typeof window.homePage.switchTab === 'function') {
        window.homePage.switchTab(tabName);
    } else {
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.add('hidden');
            pane.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const pane = document.getElementById(tabName);
        const btn = document.querySelector(`[onclick*="switchTab('${tabName}')"]`);
        
        if (pane) {
            pane.classList.remove('hidden');
            pane.classList.add('active');
        }
        if (btn) btn.classList.add('active');
    }
}

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
    showConfirmLogout();
}

function showConfirmLogout() {
    if (!document.querySelector('#logout-popup-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'logout-popup-styles';
        styleSheet.textContent = `
            @keyframes popupZoomIn {
                0% {
                    opacity: 0;
                    transform: scale(0.7);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                }
                100% {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes popupZoomOut {
                0% {
                    opacity: 1;
                    transform: scale(1);
                }
                100% {
                    opacity: 0;
                    transform: scale(0.7);
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    const modal = document.createElement('div');
    modal.id = 'confirm-logout-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 20000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, rgba(66, 132, 219, 0.98) 0%, rgba(41, 234, 196, 0.98) 100%);
        border: 2px solid rgba(240, 228, 145, 0.6);
        backdrop-filter: blur(20px);
        border-radius: 1.5rem;
        padding: 2rem;
        min-width: 320px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        transform: scale(0.7);
        opacity: 0;
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <p style="color: white; font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600;">Bạn có chắc muốn đăng xuất?</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="logout-confirm-yes" style="background: linear-gradient(135deg, #4caf50, #81c784); border: none; padding: 10px 24px; border-radius: 40px; color: white; font-weight: 600; cursor: pointer; font-size: 1rem;">Đăng xuất</button>
            <button id="logout-confirm-no" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); padding: 10px 24px; border-radius: 40px; color: white; font-weight: 600; cursor: pointer; font-size: 1rem;">Hủy</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.style.opacity = '1';
        modalContent.style.animation = 'popupZoomIn 0.3s ease forwards';
    }, 10);
    
    const yesBtn = modalContent.querySelector('#logout-confirm-yes');
    const noBtn = modalContent.querySelector('#logout-confirm-no');
    
    const closeModal = () => {
        modalContent.style.animation = 'popupZoomOut 0.3s ease forwards';
        setTimeout(() => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }, 300);
    };
    
    yesBtn.onclick = () => {
        closeModal();
        setTimeout(() => {
            window.location.href = '/logout';
        }, 300);
    };
    
    noBtn.onclick = closeModal;
    
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function closeConfirmModal() {
    homePage.closeConfirmModal();
}

function confirmPurchase() {
    homePage.confirmPurchase();
}

function SubmitAccountChanges() {
    homePage.SubmitAccountChanges();
}

let homePage;
document.addEventListener('DOMContentLoaded', () => {
    homePage = new HomePage();
});