let loadingElement = null;
let resultPopupElement = null;
const practiceState = {
    sessionId: null,
    numberOfSteps: 0,
    currentScore: 100,
    viewedSteps: new Set(),
    pendingExplain: null
};

const API_CONFIG = {
    baseURL: '',
    endpoints: {
        newSession: '/api/new_session_id',
        zeroOut: '/api/zero_out_temporary_score',
        updateScore: '/api/update_temporary_score',
        processQuestion: '/process-question',
        processAnswer: '/process-answer'
    },
    headers: {
        'Content-Type': 'application/json'
    }
};

const DomUtils = {
    getElement: (id) => document.getElementById(id),
    getValue: (element) => element?.getValue?.() || element?.value || '',
    toggleVisibility: (element, show) => {
        if(!element) return;
        element.classList.toggle('hidden', !show);
    },
    disableElement: (element, disabled) => element && (element.disabled = disabled),
    setButtonLoading: (button, loading, text = 'Đang xử lý...') => {
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<span class="btn-spinner"></span> ${text}`;
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || 'Gửi';
            button.disabled = false;
        }
    }
};

function showLoading(message = 'Đang xử lý...') {
    if (loadingElement) {
        const textEl = loadingElement.querySelector('.loading-text');
        if(textEl) textEl.textContent = message;
        return;
    }

    loadingElement = document.createElement('div');
    loadingElement.className = 'loading-toast';
    loadingElement.innerHTML = `
        <div class="spinner-icon"></div>
        <span class="loading-text">${message}</span>
    `;
    document.body.appendChild(loadingElement);
}

function hideLoading() {
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        loadingElement.style.transform = 'translateY(10px)';
        loadingElement.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            loadingElement?.remove();
            loadingElement = null;
        }, 300);
    }
}

function showResultPopup(isCorrect, explain, onClose) {
    if (resultPopupElement) {
        resultPopupElement.remove();
        resultPopupElement = null;
    }

    resultPopupElement = document.createElement('div');
    resultPopupElement.className = 'result-popup';
    resultPopupElement.style.cssText = `
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
    
    resultPopupElement.innerHTML = `
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
    
    document.body.appendChild(resultPopupElement);
    
    const closeBtn = resultPopupElement.querySelector('#close-result-popup');
    closeBtn.addEventListener('click', () => {
        resultPopupElement.classList.add('result-popup-zoom-out');
        
        setTimeout(() => {
            resultPopupElement.remove();
            resultPopupElement = null;
            if (onClose) onClose();
        }, 300);
    });
}

function showAlert(message, type = 'error') {
    let popup = document.getElementById('practice-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'practice-popup';
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

class ApiService {
    static async request(endpoint, data = null, method = 'POST') {
        const config = {
            method,
            headers: API_CONFIG.headers,
            credentials: 'include'
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(endpoint, config);
            if (!response.ok) {
                if (response.status === 404) throw new Error(`Endpoint không tồn tại: ${endpoint}`);
                if (response.status === 403) throw new Error('Bạn cần đăng nhập để thực hiện hành động này');
                if (response.status === 500) throw new Error('Lỗi server nội bộ. Vui lòng thử lại sau.');
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
}

class SessionManager {
    static async newSession() {
        try {
            const data = await ApiService.request(API_CONFIG.endpoints.newSession);
            if (!data.success) throw new Error(data.comment || 'Không thể tạo phiên mới');
            practiceState.sessionId = data.id;
            practiceState.currentScore = data.grade;
            this.updateGradeDisplay(data.grade);
            return true;
        } catch (error) {
            this.handleError(error, 'Tạo phiên làm bài');
            return false;
        }
    }

    static async zeroOutPoints() {
        if (!this.validateSession()) return false;
        try {
            const data = await ApiService.request(API_CONFIG.endpoints.zeroOut, { id: practiceState.sessionId });
            if (!data.success) throw new Error(data.comment || 'Không thể thiết lập điểm về 0');
            practiceState.currentScore = data.grade;
            this.updateGradeDisplay(data.grade);
            return true;
        } catch (error) {
            this.handleError(error, 'Thiết lập điểm');
            return false;
        }
    }

    static async processPoints(changes) {
        if (!this.validateSession()) return false;
        try {
            const data = await ApiService.request(API_CONFIG.endpoints.updateScore, {
                id: practiceState.sessionId,
                change: Math.floor(changes).toString()
            });
            if (!data.success) throw new Error(data.comment || 'Không thể cập nhật điểm');
            practiceState.currentScore = data.grade;
            this.updateGradeDisplay(data.grade);
            return true;
        } catch (error) {
            this.handleError(error, 'Cập nhật điểm');
            return false;
        }
    }

    static updateGradeDisplay(grade) {
        const gradeElement = DomUtils.getElement('grade');
        if (gradeElement) gradeElement.textContent = `Điểm hiện tại: ${grade}`;
    }

    static validateSession() {
        if (!practiceState.sessionId) {
            showAlert('Phiên làm bài không hợp lệ! Vui lòng bắt đầu bài tập mới.');
            return false;
        }
        return true;
    }

    static handleError(error, context) {
        console.error(`${context} Error:`, error);
        let userMessage = error.message;
        if (error.message.includes('cần đăng nhập')) setTimeout(() => window.location.href = '/login', 2000);
        showAlert(userMessage);
    }
}

class QuestionManager {
    static normalizeContent(text) {
        if (!text) return '';
       
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s*\$\s*/g, '$')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/\\n/g, ' ')
            .trim();
    }

    static fixLaTeX(text) {
        if (!text || typeof text !== 'string') return '';
       
        return text
            .replace(/\\x0crac/g, '\\frac')
            .replace(/\x0c/g, '\\')
            .replace(/\\\\/g, '\\')
            .replace(/\$\s+/g, '$')
            .replace(/\s+\$/g, '$')
            .trim();
    }

    static async submitMathQuestion() {
        const lop = DomUtils.getValue(DomUtils.getElement('lop'));
        const question = DomUtils.getValue(DomUtils.getElement('question'));
        const submitBtn = DomUtils.getElement('submitBtn');
        const hiddenSection = DomUtils.getElement('hiddenSection');
        const questionDiv = DomUtils.getElement('question_div');

        if (!lop || !question) return showAlert('Vui lòng nhập đầy đủ lớp và câu hỏi!');
        if (question.length < 2) return showAlert('Câu hỏi quá ngắn.');

        DomUtils.setButtonLoading(submitBtn, true);
        showLoading('Đang suy nghĩ...');

        try {
            const data = await ApiService.request(API_CONFIG.endpoints.processQuestion, { lop, question });
            hideLoading();

            if (data.error) throw new Error(data.error);

            practiceState.viewedSteps.clear();
            practiceState.numberOfSteps = 0;

            this.processAndDisplayData(data);
            
            DomUtils.toggleVisibility(questionDiv, false);
            DomUtils.toggleVisibility(hiddenSection, true);

            await SessionManager.newSession();
        } catch (error) {
            hideLoading(); 
            this.handleError(error, 'Xử lý câu hỏi');
        } finally {
            DomUtils.setButtonLoading(submitBtn, false);
        }
    }

    static processAndDisplayData(data) {
        const problemDiv = DomUtils.getElement('problem');
        const solveDiv = DomUtils.getElement('solve');
        const resultContainer = DomUtils.getElement('answer-result-container');
        if(resultContainer) resultContainer.innerHTML = '';

        if (!problemDiv || !solveDiv) return;

        problemDiv.innerHTML = '';
        solveDiv.innerHTML = '';

        const questionContent = DomUtils.getValue(DomUtils.getElement('question'));
        if (questionContent) problemDiv.innerHTML = `\\[${questionContent}\\]`;

        const questionData = this.extractQuestionData(data);
        if (!questionData) {
            solveDiv.innerHTML = '<p class="text-white text-center">Không có dữ liệu giải bài tập.</p>';
            this.renderMathAggressive([problemDiv, solveDiv]);
            return;
        }

        this.displaySolutionSteps(solveDiv, questionData);
        this.displayFinalAnswer(solveDiv, questionData);
        this.renderMathAggressive([problemDiv, solveDiv]);
    }

    static extractQuestionData(data) {
        return Array.isArray(data) && data.length > 0 ? data[0] : data && typeof data === 'object' ? data : null;
    }

    static displaySolutionSteps(container, questionData) {
        if (!questionData.loigiai || !Array.isArray(questionData.loigiai)) {
            container.innerHTML = '<p class="text-white text-center">Không có lời giải chi tiết.</p>';
            return;
        }
        practiceState.numberOfSteps = questionData.loigiai.length;

        const stepsHTML = questionData.loigiai.map((step, index) => {
            const stepNumber = step.buoc || index + 1;
            let stepDetail = step.chitiet || step.noi_dung || `Bước ${stepNumber}`;
           
            stepDetail = this.fixLaTeX(stepDetail);
            stepDetail = this.normalizeContent(stepDetail);
           
            return `
                <div id="step-${index + 1}" class="step">
                    <a href="javascript:void(0);" class="step-link" data-step="${index}">
                        Mở gợi ý Bước ${stepNumber}
                    </a>
                    <div class="step-content hidden" data-step="${index}">
                        ${stepDetail}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = stepsHTML;
       
        container.querySelectorAll('.step-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleStepClick(e));
        });
    }

    static displayFinalAnswer(container, questionData) {
        if (!questionData.dapan) return;
       
        let finalAnswer = questionData.dapan;
        finalAnswer = this.fixLaTeX(finalAnswer);
        finalAnswer = this.normalizeContent(finalAnswer);
       
        const answerHTML = `
            <div class="answer-section">
                <a href="javascript:void(0);" id="final-answer-link">
                   Tôi bỏ cuộc - Xem đáp án cuối cùng (0 điểm)
                </a>
                <div id="final-answer-content" class="hidden">
                    Đáp án: ${finalAnswer}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', answerHTML);
       
        const link = DomUtils.getElement('final-answer-link');
        if(link) link.addEventListener('click', this.handleFinalAnswerClick, { once: true });
    }

    static handleStepClick = (e) => {
        const link = e.target.closest('.step-link');
        if (!link || practiceState.viewedSteps.has(link.dataset.step)) return;

        const stepContent = link.nextElementSibling;
        if (!stepContent) return;

        stepContent.classList.remove('hidden');
        link.style.display = 'none';
        
        practiceState.viewedSteps.add(link.dataset.step);
        this.renderMathAggressive([stepContent]);

        if (practiceState.sessionId && practiceState.numberOfSteps > 0) {
            const deduction = -100 / practiceState.numberOfSteps;
            SessionManager.processPoints(deduction);
        }
    }

    static appendContinueButton(container) {
        if (container.querySelector('.btn-continue')) return;

        const btn = document.createElement('button');
        btn.className = 'btn-continue';
        btn.innerHTML = 'Tiếp tục bài toán khác';
        btn.onclick = () => window.location.reload();
        container.appendChild(btn);
    }

    static handleFinalAnswerClick = () => {
        const content = DomUtils.getElement('final-answer-content');
        const link = DomUtils.getElement('final-answer-link');
        
        DomUtils.toggleVisibility(content, true);
        DomUtils.toggleVisibility(link, false);
        
        let answerContent = content.innerHTML;
        if (answerContent && !answerContent.includes('<br>')) {
            answerContent = answerContent
                .replace(/(Bước\s+\d+:)/g, '<br><strong>$1</strong>')
                .replace(/^<br>/, '');
            content.innerHTML = answerContent;
        }
        
        this.renderMathAggressive([content]);
        if(practiceState.sessionId) SessionManager.zeroOutPoints();

        const container = document.querySelector('.answer-section');
        this.appendContinueButton(container);
    }

    static showExplanationResult(explain) {
        const container = DomUtils.getElement('answer-result-container') || DomUtils.getElement('hiddenSection');
        const oldResult = document.getElementById('answer-result');
        if(oldResult) oldResult.remove();

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
        
        if(DomUtils.getElement('answer-result-container')) {
            DomUtils.getElement('answer-result-container').appendChild(resultDiv);
        } else {
            container.appendChild(resultDiv);
        }

        setTimeout(() => {
            this.renderMathAggressive([resultDiv]);
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 50);
        
        this.appendContinueButton(resultDiv);
    }

    static async submitAnswer() {
        const userAnswer = DomUtils.getValue(DomUtils.getElement('user-answer'));
        const submitBtn = document.querySelector('.submit-answer-btn') || document.querySelector('button[onclick="submitAnswer()"]');
        const answerContainer = DomUtils.getElement('answer-input-container') || document.querySelector('.answer-input-section');
        const stepContainer = document.querySelector('.steps-container');
        
        const lop = DomUtils.getValue(DomUtils.getElement('lop'));
        const question = DomUtils.getValue(DomUtils.getElement('question'));

        if (!userAnswer) return showAlert('Vui lòng nhập câu trả lời!');
        if (!SessionManager.validateSession()) return;

        if(submitBtn) submitBtn.disabled = true;
        showLoading('Đang kiểm tra câu trả lời...');

        if (answerContainer) {
            answerContainer.style.display = 'none';
        }

        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        
        if (stepContainer) {
            stepContainer.style.display = 'none';
        }

        const finalAnswerLink = DomUtils.getElement('final-answer-link');
        if (finalAnswerLink) {
            finalAnswerLink.style.display = 'none';
        }

        try {
            const result = await ApiService.request(API_CONFIG.endpoints.processAnswer, {
                lop, question, user_answer: userAnswer, id: practiceState.sessionId
            });
            
            hideLoading();
            
            const data = Array.isArray(result) ? result[0] : result;
            const isCorrect = data?.acstatus === 'true';
            let explain = data?.explain || '';
            
            if (!explain || explain === 'null') {
                explain = 'Không có giải thích chi tiết.';
            } else {
                explain = this.fixLaTeX(explain);
                explain = this.normalizeContent(explain);
            }
            
            practiceState.pendingExplain = explain;
            
            showResultPopup(isCorrect, explain, () => {
                QuestionManager.showExplanationResult.call(QuestionManager, explain);
            });
            
            if(submitBtn) submitBtn.disabled = false;
        } catch (error) {
            hideLoading(); 
            this.handleError(error, 'Kiểm tra đáp án');
            if(submitBtn) submitBtn.disabled = false;
        }
    }

    static handleFinalAnswerClick = () => {
        const content = DomUtils.getElement('final-answer-content');
        const link = DomUtils.getElement('final-answer-link');
        
        DomUtils.toggleVisibility(content, true);
        DomUtils.toggleVisibility(link, false);
        
        let answerContent = content.innerHTML;
        if (answerContent && !answerContent.includes('<br>')) {
            answerContent = answerContent
                .replace(/(Bước\s+\d+:)/g, '<br><strong>$1</strong>')
                .replace(/^<br>/, '');
            content.innerHTML = answerContent;
        }
        
        this.renderMathAggressive([content]);
        if(practiceState.sessionId) SessionManager.zeroOutPoints();

        const container = document.querySelector('.answer-section');
        this.appendContinueButton(container);
    }

    static renderMathAggressive(elements) {
        const validElements = elements.filter(el => el && el instanceof HTMLElement);
        if (validElements.length === 0) return;

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise(validElements)
                .catch(err => console.warn('MathJax render failed:', err));
        }
    }

    static renderMathJax(elements) {
        this.renderMathAggressive(elements);
    }

    static renderMathJax(elements) {
        this.renderMathAggressive(elements);
    }

    static handleError(error, context) {
        console.error(`${context} Error:`, error);
        showAlert(`${context} thất bại: ${error.message}`);
    }
}

function navigateToHome() {
    window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
});

window.submitMathQuestion = QuestionManager.submitMathQuestion.bind(QuestionManager);
window.submitAnswer = QuestionManager.submitAnswer.bind(QuestionManager);
window.navigateToHome = navigateToHome;