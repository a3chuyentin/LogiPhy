class MathLearning {
    constructor() {
        this.loadingElement = null;
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

        if (footerDiv) {
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
            if (window.MathJax.config && window.MathJax.config.tex) {
                window.MathJax.config.tex.inlineMath = [['$', '$'], ['\\(', '\\)']];
                window.MathJax.config.tex.displayMath = [];
            }
            
            window.MathJax.typesetPromise(validElements)
                .then(() => {
                    this.forceAggressiveInline();
                })
                .catch(err => {
                    console.warn('MathJax aggressive rendering failed:', err);
                    this.forceAggressiveInline();
                });
        } else {
            this.forceAggressiveInline();
        }
    }

    forceAggressiveInline() {
        setTimeout(() => {
            const allMathElements = document.querySelectorAll(
                'mjx-container, .MathJax, .MathJax_Display, .MathJax_Preview, [class*="math"]'
            );
            
            allMathElements.forEach(mathEl => {
                mathEl.style.cssText = `
                    display: inline !important;
                    margin: 0 !important;
                    padding: 0 1px !important;
                    line-height: 1 !important;
                    vertical-align: middle !important;
                    width: auto !important;
                    height: auto !important;
                    float: none !important;
                    clear: none !important;
                    white-space: nowrap !important;
                `;
                
                const children = mathEl.querySelectorAll('*');
                children.forEach(child => {
                    child.style.display = 'inline !important';
                    child.style.margin = '0 !important';
                    child.style.padding = '0 !important';
                });
            });

            const stepContents = document.querySelectorAll('.step-content');
            stepContents.forEach(content => {
                content.style.whiteSpace = 'normal';
                content.style.wordWrap = 'break-word';
                
                const children = Array.from(content.childNodes);
                children.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        child.textContent = child.textContent.replace(/\s+/g, ' ');
                    }
                });
            });

        }, 150);
    }
}

function submitMathQuestion() {
    if (!window.mathLearning) {
        window.mathLearning = new MathLearning();
    }
    window.mathLearning.submitMathQuestion();
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
        `;
        document.head.appendChild(style);
    }
});

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && window.mathLearning) {
        window.mathLearning.forceAggressiveInline();
    }
});