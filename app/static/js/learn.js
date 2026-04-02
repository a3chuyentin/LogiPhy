let overlayBlocker = null;

function showBlocker() {
    if (overlayBlocker) return;
    overlayBlocker = document.createElement('div');
    overlayBlocker.id = 'click-blocker';
    overlayBlocker.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.3);
        z-index: 9999;
        cursor: not-allowed;
    `;
    document.body.appendChild(overlayBlocker);
}

function hideBlocker() {
    if (overlayBlocker) {
        overlayBlocker.remove();
        overlayBlocker = null;
    }
}

class MathLearning {
    constructor() {
        this.loadingElement = null;
        this.resultPopupElement = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    showPopup(message, type = 'error') {
        let popup = document.getElementById('learn-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'learn-popup';
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
            `;
            popup.innerHTML = `
                <div style="font-size: 3rem; margin-bottom: 0.75rem;">${type === 'success' ? '✅' : '❌'}</div>
                <p style="color: white; font-size: 1.125rem; font-weight: 700; margin: 0;"></p>
            `;
            document.body.appendChild(popup);
        }
        
        const icon = popup.querySelector('div:first-child');
        const msg = popup.querySelector('p');
        
        icon.textContent = type === 'success' ? '✅' : '❌';
        msg.textContent = message;
        popup.style.borderColor = type === 'success' ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)';
        
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -50%) scale(1)';
        popup.style.pointerEvents = 'auto';
        
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -50%) scale(0.7)';
            popup.style.pointerEvents = 'none';
            hideBlocker();
        }, 2500);
    }

    showLoading(message = 'Đang phân tích bài toán...') {
        if (this.loadingElement) this.hideLoading();
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading-toast';
        this.loadingElement.innerHTML = `<div class="spinner-icon"></div><span class="loading-text">${message}</span>`;
        document.body.appendChild(this.loadingElement);
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }

    setupEventListeners() {
        const mathField = document.getElementById('question');
        if (mathField) {
            mathField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitMathQuestion();
                }
            });
        }
    }

    async submitMathQuestion() {
        const lop = document.getElementById('lop')?.value;
        const questionField = document.getElementById('question');
        const question = questionField?.getValue?.() || questionField?.value || '';
        const submitBtn = document.getElementById('submitBtn');
        const hiddenSection = document.getElementById('hiddenSection');
        const questionDiv = document.getElementById('question_div');

        if (!lop || !question.trim()) {
            this.showPopup('Vui lòng nhập đầy đủ lớp và câu hỏi!', 'error');
            return;
        }

        showBlocker();

        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Đang xử lý...';
        this.showLoading('AI đang giải bài toán...');

        try {
            const response = await fetch('/process-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ lop: lop.trim(), question: question.trim() })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            this.hideLoading();

            if (data.error) {
                this.showPopup('Có lỗi xảy ra: ' + data.error, 'error');
            } else {
                hideBlocker();
                questionDiv.classList.add('hidden');
                hiddenSection.classList.remove('hidden');
                this.processAndDisplayData(data);
            }
        } catch (error) {
            this.hideLoading();
            this.showPopup('Có lỗi kết nối xảy ra. Vui lòng thử lại!', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Gửi câu hỏi';
        }
    }

    processAndDisplayData(data) {
        const problemDiv = document.getElementById('problem');
        const solveDiv = document.getElementById('solve');
        const footerDiv = document.getElementById('action-footer');

        problemDiv.innerHTML = '';
        solveDiv.innerHTML = '';
        if (footerDiv) footerDiv.innerHTML = '';

        const questionField = document.getElementById('question');
        const questionContent = questionField?.getValue?.() || questionField?.value || '';
        
        if (questionContent) {
            problemDiv.innerHTML = question;
        }

        const questionData = Array.isArray(data) ? data[0] : data;

        if (!questionData?.loigiai) {
            solveDiv.innerHTML = '<div class="step"><div class="step-content"><p>Không có dữ liệu giải bài tập.</p></div></div>';
            return;
        }

        let stepsHTML = '';
        questionData.loigiai.forEach((step, index) => {
            const stepNumber = step.buoc || (index + 1);
            stepsHTML += `
                <div class="step">
                    <h4>Bước ${stepNumber}</h4>
                    <div class="step-content">${step.chitiet || ''}</div>
                </div>
            `;
        });
        solveDiv.innerHTML = stepsHTML;

        if (questionData.dapan) {
            solveDiv.innerHTML += `<div class="answer-section"><h3>📝 Đáp án:</h3><div class="answer-content">${questionData.dapan}</div></div>`;
        }

        if (footerDiv && !footerDiv.querySelector('.btn-continue')) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn-continue';
            continueBtn.innerHTML = '🔄 Tiếp tục bài toán khác';
            continueBtn.onclick = () => window.location.reload();
            footerDiv.appendChild(continueBtn);
        }

        this.renderMath();
    }

    renderMath() {
        if (window.MathJax) window.MathJax.typesetPromise();
    }
}

function submitMathQuestion() {
    if (!window.mathLearning) window.mathLearning = new MathLearning();
    window.mathLearning.submitMathQuestion();
}

function navigateToHome() {
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    window.mathLearning = new MathLearning();
});

customElements.whenDefined('math-field').then(() => {
    const mf = document.getElementById('question');
    if (mf) {
        mf.defaultMode = 'text';
        mf.mode = 'text';
        mf.smartMode = true;
    }
});