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
        }, 2500);
    }

    showResultPopup(isCorrect, explain, onClose) {
        if (this.resultPopupElement) {
            this.resultPopupElement.remove();
            this.resultPopupElement = null;
        }

        this.resultPopupElement = document.createElement('div');
        this.resultPopupElement.className = 'result-popup';
        this.resultPopupElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: linear-gradient(135deg, rgba(66, 132, 219, 0.98) 0%, rgba(41, 234, 196, 0.98) 100%);
            border: 2px solid ${isCorrect ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'};
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 2rem;
            min-width: 320px;
            max-width: 400px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px ${isCorrect ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'};
            opacity: 0;
            transition: all 0.3s ease;
            cursor: pointer;
            animation: popupZoomIn 0.3s ease forwards;
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
            
            .result-popup-zoom-out {
                animation: popupZoomOut 0.3s ease forwards !important;
            }
        `;
        document.head.appendChild(styleSheet);
        
        this.resultPopupElement.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 1rem;">${isCorrect ? '🎉' : '❌'}</div>
            <h2 style="color: white; font-size: 1.8rem; margin-bottom: 0.5rem; font-weight: 800;">${isCorrect ? 'CHÍNH XÁC!' : 'CHƯA ĐÚNG'}</h2>
            <p style="color: rgba(255,255,255,0.8); margin-bottom: 1rem; font-size: 0.9rem;">${isCorrect ? 'Bạn đã trả lời đúng!' : 'Hãy xem giải thích bên dưới'}</p>
            <button id="close-result-popup" style="
                background: linear-gradient(135deg, #4284DB, #29EAC4);
                border: none;
                padding: 10px 24px;
                border-radius: 40px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 0.5rem;
            ">Xem giải thích</button>
        `;
        
        document.body.appendChild(this.resultPopupElement);
        
        const closeBtn = this.resultPopupElement.querySelector('#close-result-popup');
        closeBtn.addEventListener('click', () => {
            this.resultPopupElement.classList.add('result-popup-zoom-out');
            
            setTimeout(() => {
                this.resultPopupElement.remove();
                this.resultPopupElement = null;
                if (onClose) onClose();
            }, 300);
        });
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

    showLoading(message = 'Đang phân tích bài toán...') {
        if (this.loadingElement) {
            this.hideLoading();
        }

        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading-toast';
        this.loadingElement.innerHTML = `
            <div class="spinner-icon"></div>
            <span class="loading-text">${message}</span>
        `;
        document.body.appendChild(this.loadingElement);
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.animation = 'slideInToast 0.3s ease reverse';
            setTimeout(() => {
                if (this.loadingElement && this.loadingElement.parentNode) {
                    this.loadingElement.remove();
                }
                this.loadingElement = null;
            }, 300);
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

        submitBtn.disabled = true;
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Đang xử lý...';
        this.showLoading('AI đang giải bài toán...');

        try {
            const response = await fetch('/process-question', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ 
                    lop: lop.trim(),
                    question: question.trim()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.hideLoading();

            if (data.error) {
                this.showPopup('Có lỗi xảy ra: ' + data.error, 'error');
            } else {
                questionDiv.classList.add('hidden');
                hiddenSection.classList.remove('hidden');
                this.processAndDisplayData(data);
            }
        } catch (error) {
            console.error('Error:', error);
            this.hideLoading();
            this.showPopup('Có lỗi kết nối xảy ra. Vui lòng thử lại!', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }

    async submitAnswer() {
        const userAnswer = document.getElementById('user-answer')?.value || '';
        const submitBtn = document.querySelector('.submit-answer-btn') || document.querySelector('button[onclick="submitAnswer()"]');
        const answerContainer = document.getElementById('answer-input-container') || document.querySelector('.answer-input-section');
        const finalAnswerLink = document.getElementById('final-answer-link');
        
        const lop = document.getElementById('lop')?.value;
        const questionField = document.getElementById('question');
        const question = questionField?.getValue?.() || questionField?.value || '';

        if (!userAnswer.trim()) {
            this.showPopup('Vui lòng nhập câu trả lời!', 'error');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        this.showLoading('Đang kiểm tra câu trả lời...');

        if (answerContainer) {
            answerContainer.style.display = 'none';
        }
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        if (finalAnswerLink) {
            finalAnswerLink.style.display = 'none';
        }

        try {
            const response = await fetch('/process-answer', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    lop: lop.trim(),
                    question: question.trim(),
                    user_answer: userAnswer.trim()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.hideLoading();
            
            const data = Array.isArray(result) ? result[0] : result;
            const isCorrect = data?.acstatus === 'true';
            let explain = data?.explain || '';
            
            if (!explain || explain === 'null') {
                explain = 'Không có giải thích chi tiết.';
            } else {
                explain = this.fixLaTeX(explain);
                explain = this.normalizeContent(explain);
            }
            
            this.showResultPopup(isCorrect, explain, () => {
                this.showExplanationResult(explain);
            });
            
            if (submitBtn) submitBtn.disabled = false;
        } catch (error) {
            console.error('Error:', error);
            this.hideLoading();
            this.showPopup('Có lỗi xảy ra khi kiểm tra đáp án!', 'error');
            if (submitBtn) submitBtn.disabled = false;
            
            if (answerContainer) {
                answerContainer.style.display = '';
            }
            if (submitBtn) {
                submitBtn.style.display = '';
            }
            if (finalAnswerLink) {
                finalAnswerLink.style.display = '';
            }
        }
    }

    showExplanationResult(explain) {
        const container = document.getElementById('answer-result-container') || document.getElementById('hiddenSection');
        const oldResult = document.getElementById('answer-result');
        if (oldResult) oldResult.remove();

        const resultDiv = document.createElement('div');
        resultDiv.id = 'answer-result';
        resultDiv.className = 'result explanation';
        resultDiv.style.animation = 'slideUp 0.3s ease';
        
        let formattedExplain = explain;
        
        try {
            const parsed = JSON.parse(explain);
            if (Array.isArray(parsed)) {
                formattedExplain = parsed.map((item, idx) => {
                    return `<div class="step-item">
                                <div class="step-header">📌 Bước ${idx + 1}</div>
                                <div class="step-detail">${item}</div>
                            </div>`;
                }).join('');
            }
        } catch(e) {
            if (explain && (explain.includes('Bước') || explain.includes('bước'))) {
                const steps = explain.split(/(?=Bước\s+\d+:)|(?=bước\s+\d+:)/);
                if (steps.length > 1) {
                    let stepsHTML = '';
                    steps.forEach((step, index) => {
                        if (step.trim()) {
                            const stepMatch = step.match(/(Bước|bước)\s+(\d+):/);
                            const stepNumber = stepMatch ? stepMatch[2] : (index + 1);
                            const stepContent = step.replace(/(Bước|bước)\s+\d+:/, '').trim();
                            stepsHTML += `
                                <div class="step-item">
                                    <div class="step-header">📌 Bước ${stepNumber}</div>
                                    <div class="step-detail">${stepContent}</div>
                                </div>
                            `;
                        }
                    });
                    if (stepsHTML) formattedExplain = stepsHTML;
                }
            }
        }
        
        resultDiv.innerHTML = `
            <h3>📖 Giải thích chi tiết</h3>
            <div class="explanation-content">
                ${formattedExplain}
            </div>
        `;
        
        if (!document.querySelector('#explanation-step-style')) {
            const style = document.createElement('style');
            style.id = 'explanation-step-style';
            style.textContent = `
                .explanation-content {
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                .step-item {
                    margin-bottom: 1rem;
                    padding: 0.75rem;
                    border-left: 3px solid #4284DB;
                    background: rgba(255,255,255,0.05);
                    border-radius: 0 8px 8px 0;
                    transition: all 0.3s ease;
                }
                .step-item:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateX(5px);
                }
                .step-header {
                    font-weight: bold;
                    color: #ffd700;
                    margin-bottom: 0.5rem;
                    font-size: 1rem;
                }
                .step-detail {
                    line-height: 1.6;
                    color: rgba(255,255,255,0.9);
                    word-wrap: break-word;
                }
                #answer-result {
                    margin-top: 1rem;
                    background: linear-gradient(135deg, rgba(66, 132, 219, 0.2), rgba(41, 234, 196, 0.2));
                    border-radius: 12px;
                    padding: 1rem;
                    backdrop-filter: blur(10px);
                }
                #answer-result h3 {
                    color: white;
                    margin-bottom: 1rem;
                    font-size: 1.2rem;
                }
            `;
            document.head.appendChild(style);
        }
        
        if (document.getElementById('answer-result-container')) {
            document.getElementById('answer-result-container').appendChild(resultDiv);
        } else {
            container.appendChild(resultDiv);
        }

        setTimeout(() => {
            this.renderMathAggressive([resultDiv]);
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
        
        const footerDiv = document.getElementById('action-footer');
        if (footerDiv && !footerDiv.querySelector('.btn-continue')) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn-continue';
            continueBtn.innerHTML = '🔄 Tiếp tục bài toán khác';
            continueBtn.onclick = () => {
                window.location.reload();
            };
            footerDiv.appendChild(continueBtn);
        }
    }

    fixLaTeX(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .replace(/\\x0crac/g, '\\frac')
            .replace(/\x0c/g, '\\')
            .replace(/\\\\/g, '\\')
            .replace(/\$\s+/g, '$')
            .replace(/\s+\$/g, '$')
            .trim();
    }

    normalizeContent(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s*\$\s*/g, '$')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/\\n/g, ' ')
            .trim();
    }

    processAndDisplayData(data) {
        const problemDiv = document.getElementById('problem');
        const solveDiv = document.getElementById('solve');
        const footerDiv = document.getElementById('action-footer');

        if (!problemDiv || !solveDiv) {
            console.error('Required DOM elements not found');
            return;
        }

        problemDiv.innerHTML = '';
        solveDiv.innerHTML = '';
        if (footerDiv) footerDiv.innerHTML = '';

        const questionField = document.getElementById('question');
        const questionContent = questionField?.getValue?.() || questionField?.value || '';
        if (questionContent) {
            problemDiv.innerHTML = `\\[${questionContent}\\]`;
        }

        let questionData = null;
        if (Array.isArray(data) && data.length > 0) {
            questionData = data[0];
        } else if (data && typeof data === 'object') {
            questionData = data;
        }

        if (!questionData || !questionData.loigiai || !Array.isArray(questionData.loigiai)) {
            solveDiv.innerHTML = '<div class="step"><div class="step-content"><p class="text-center">Không có dữ liệu giải bài tập.</p></div></div>';
            return;
        }

        let stepsHTML = '';
        
        questionData.loigiai.forEach((step, index) => {
            const stepNumber = step.buoc || (index + 1).toString();
            let stepDetail = step.chitiet || step.noi_dung || `Bước ${stepNumber}`;

            stepDetail = this.fixLaTeX(stepDetail);
            stepDetail = this.normalizeContent(stepDetail);

            stepsHTML += `
                <div class="step">
                    <h4>Bước ${stepNumber}</h4>
                    <div class="step-content" style="display: block; line-height: 1.6;">
                        ${stepDetail}
                    </div>
                </div>
            `;
        });
        
        solveDiv.innerHTML = stepsHTML;

        if (questionData.dapan) {
            let finalAnswer = this.fixLaTeX(questionData.dapan);
            finalAnswer = this.normalizeContent(finalAnswer);
            solveDiv.innerHTML += `
                <div class="answer-section">
                    <h3>📝 Đáp án:</h3>
                    <div class="answer-content" style="display: block;">
                        ${finalAnswer}
                    </div>
                </div>
            `;
        }

        if (footerDiv && !footerDiv.querySelector('.btn-continue')) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn-continue';
            continueBtn.innerHTML = '🔄 Tiếp tục bài toán khác';
            continueBtn.onclick = () => {
                window.location.reload();
            };
            footerDiv.appendChild(continueBtn);
        }

        this.renderMathAggressive([problemDiv, solveDiv]);
    }

    renderMathAggressive(elements) {
        const validElements = elements.filter(el => el && el instanceof HTMLElement);
        if (validElements.length === 0) return;

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise(validElements)
                .catch(err => console.warn('MathJax render failed:', err));
        }
    }
}

function submitMathQuestion() {
    if (!window.mathLearning) {
        window.mathLearning = new MathLearning();
    }
    window.mathLearning.submitMathQuestion();
}

function submitAnswer() {
    if (!window.mathLearning) {
        window.mathLearning = new MathLearning();
    }
    window.mathLearning.submitAnswer();
}

function navigateToHome() {
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', function() {
    window.mathLearning = new MathLearning();
    
    if (!document.querySelector('#dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
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
            .result-popup-zoom-out {
                animation: popupZoomOut 0.3s ease forwards !important;
            }
        `;
        document.head.appendChild(style);
    }
});