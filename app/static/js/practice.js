let loadingElement = null;
let resultPopupElement = null;
const practiceState = { sessionId: null, numberOfSteps: 0, currentScore: 100, viewedSteps: new Set() };

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

const DomUtils = {
    getElement: (id) => document.getElementById(id),
    getValue: (element) => element?.getValue?.() || element?.value || '',
    toggleVisibility: (element, show) => element?.classList.toggle('hidden', !show),
    setButtonLoading: (btn, loading, text = 'Đang xử lý...') => {
        if (!btn) return;
        if (loading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<span class="btn-spinner"></span> ${text}`;
            btn.disabled = true;
        } else {
            btn.innerHTML = btn.dataset.originalText || 'Gửi';
            btn.disabled = false;
        }
    }
};

function navigateToHome() {
    window.location.href = '/';
}

function showLoading(msg = 'Đang xử lý...') {
    if (loadingElement) loadingElement.remove();
    loadingElement = document.createElement('div');
    loadingElement.className = 'loading-toast';
    loadingElement.innerHTML = `<div class="spinner-icon"></div><span class="loading-text">${msg}</span>`;
    document.body.appendChild(loadingElement);
}

function hideLoading() {
    loadingElement?.remove();
    loadingElement = null;
}

function showAlert(message, type = 'error') {
    let popup = document.getElementById('practice-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'practice-popup';
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.7);
            background: linear-gradient(135deg, rgba(66,132,219,0.98), rgba(41,234,196,0.98));
            border: 2px solid ${type === 'success' ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)'};
            backdrop-filter: blur(20px); border-radius: 1.5rem; padding: 2rem 2.5rem;
            z-index: 10001; opacity: 0; transition: all 0.3s ease;
            min-width: 300px; text-align: center; box-shadow: 0 0 80px rgba(0,0,0,0.3);
        `;
        popup.innerHTML = `
            <div style="font-size:3rem; margin-bottom:0.75rem;">${type === 'success' ? '✅' : '❌'}</div>
            <p style="color:white;font-weight:700; margin-bottom:1rem;"></p>
            <div style="display:flex; gap:10px; justify-content:center;">
                <button id="popup-view-solution" style="background:#fff; border:none; padding:8px 20px; border-radius:40px; font-weight:600; cursor:pointer;">Xem lời giải</button>
                <button id="popup-continue" style="background:#ffd700; border:none; padding:8px 20px; border-radius:40px; font-weight:600; cursor:pointer;">🔄 Tiếp tục</button>
            </div>
        `;
        document.body.appendChild(popup);
    }
    popup.querySelector('p').textContent = message;
    popup.style.borderColor = type === 'success' ? 'rgba(76,175,80,0.8)' : 'rgba(244,67,54,0.8)';
    popup.querySelector('#popup-view-solution').onclick = () => {
        popup.remove();
        hideBlocker();
        QuestionManager.showFullSolution();
    };
    popup.querySelector('#popup-continue').onclick = () => {
        window.location.reload();
    };
    popup.style.opacity = '1';
    popup.style.transform = 'translate(-50%, -50%) scale(1)';
    setTimeout(() => {
        if (popup.parentNode) {
            popup.remove();
            hideBlocker();
        }
    }, 5000);
}

class ApiService {
    static async request(endpoint, data = null) {
        const config = { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
        if (data) config.body = JSON.stringify(data);
        const res = await fetch(endpoint, config);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
}

class SessionManager {
    static async newSession() {
        const data = await ApiService.request('/api/new_session_id');
        if (!data.success) throw new Error(data.comment);
        practiceState.sessionId = data.id;
        practiceState.currentScore = data.grade;
        this.updateGrade(data.grade);
        return true;
    }

    static async zeroOut() {
        if (!practiceState.sessionId) return;
        const data = await ApiService.request('/api/zero_out_temporary_score', { id: practiceState.sessionId });
        practiceState.currentScore = data.grade;
        this.updateGrade(data.grade);
    }

    static async updatePoints(change) {
        if (!practiceState.sessionId) return;
        const data = await ApiService.request('/api/update_temporary_score', { id: practiceState.sessionId, change: Math.floor(change).toString() });
        practiceState.currentScore = data.grade;
        this.updateGrade(data.grade);
    }

    static updateGrade(grade) {
        const el = DomUtils.getElement('grade');
        if (el) el.textContent = `Điểm hiện tại: ${grade}`;
    }
}

class QuestionManager {
    static solutionData = null;

    static async submitMathQuestion() {
        const lop = DomUtils.getValue(DomUtils.getElement('lop'));
        const question = DomUtils.getValue(DomUtils.getElement('question'));
        const submitBtn = DomUtils.getElement('submitBtn');

        if (!lop || !question) return showAlert('Vui lòng nhập đầy đủ lớp và câu hỏi!');

        DomUtils.setButtonLoading(submitBtn, true);
        showLoading('Đang suy nghĩ...');

        try {
            const data = await ApiService.request('/process-question', { lop, question });
            hideLoading();

            practiceState.viewedSteps.clear();
            practiceState.numberOfSteps = 0;

            this.displayData(data);

            DomUtils.toggleVisibility(DomUtils.getElement('question_div'), false);
            DomUtils.toggleVisibility(DomUtils.getElement('hiddenSection'), true);

            await SessionManager.newSession();
        } catch (err) {
            hideLoading();
            showAlert(err.message);
        } finally {
            DomUtils.setButtonLoading(submitBtn, false);
        }
    }

    static displayData(data) {
        const problemDiv = DomUtils.getElement('problem');
        const solveDiv = DomUtils.getElement('solve');
        const resultContainer = DomUtils.getElement('answer-result-container');
        if (resultContainer) resultContainer.innerHTML = '';

        problemDiv.innerHTML = '';
        solveDiv.innerHTML = '';

        const question = DomUtils.getValue(DomUtils.getElement('question'));
        if (question) problemDiv.innerHTML = `\\[${question}\\]`;

        const qData = Array.isArray(data) ? data[0] : data;
        this.solutionData = qData;

        if (!qData?.loigiai) {
            solveDiv.innerHTML = '<p>Không có lời giải.</p>';
            this.renderMath();
            return;
        }

        practiceState.numberOfSteps = qData.loigiai.length;

        const stepsHtml = qData.loigiai.map((step, i) => {
            const stepNum = step.buoc || i + 1;
            return `
                <div id="step-${i + 1}" class="step">
                    <a href="#" class="step-link" data-step="${i}">📘 Mở gợi ý Bước ${stepNum}</a>
                    <div class="step-content hidden">${step.chitiet || ''}</div>
                </div>
            `;
        }).join('');

        solveDiv.innerHTML = stepsHtml;

        if (qData.dapan) {
            solveDiv.innerHTML += `
                <div class="answer-section">
                    <a href="#" id="final-answer-link">🏆 Xem đáp án cuối cùng</a>
                    <div id="final-answer-content" class="hidden">Đáp án: ${qData.dapan}</div>
                </div>
            `;
        }

        document.querySelectorAll('.step-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const stepIdx = parseInt(link.dataset.step);
                if (practiceState.viewedSteps.has(stepIdx)) return;
                const content = link.nextElementSibling;
                content.classList.remove('hidden');
                link.style.display = 'none';
                practiceState.viewedSteps.add(stepIdx);
                QuestionManager.renderMath();
                if (practiceState.sessionId && practiceState.numberOfSteps) {
                    SessionManager.updatePoints(-100 / practiceState.numberOfSteps);
                }
                if (practiceState.viewedSteps.size === practiceState.numberOfSteps) {
                    QuestionManager.showFullSolution();
                }
            });
        });

        const finalLink = DomUtils.getElement('final-answer-link');
        if (finalLink) {
            finalLink.addEventListener('click', (e) => {
                e.preventDefault();
                QuestionManager.showFullSolution();
                finalLink.style.display = 'none';
                SessionManager.zeroOut();
            });
        }

        this.renderMath();
    }

    static showFullSolution() {
        if (!this.solutionData?.loigiai) return;

        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('hidden');
        });
        
        document.querySelectorAll('.step-link').forEach(link => {
            link.style.display = 'none';
        });

        const finalAnswerContent = DomUtils.getElement('final-answer-content');
        const finalAnswerLink = DomUtils.getElement('final-answer-link');
        if (finalAnswerContent && finalAnswerLink) {
            finalAnswerContent.classList.remove('hidden');
            finalAnswerLink.style.display = 'none';
        }

        for (let i = 0; i < practiceState.numberOfSteps; i++) {
            practiceState.viewedSteps.add(i.toString());
        }

        this.renderMath();
        this.hideAnswerInput();

        const footer = document.querySelector('.answer-section') || document.getElementById('solve');
        if (footer && !document.querySelector('.continue-btn')) {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'btn-continue';
            continueBtn.innerHTML = '🔄 Tiếp tục bài toán khác';
            continueBtn.onclick = () => window.location.reload();
            footer.appendChild(continueBtn);
        }
    }

    static hideAnswerInput() {
        const answerSection = document.querySelector('.answer-input-section');
        const submitBtn = document.querySelector('.submit-answer-btn');
        if (answerSection) answerSection.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
    }

    static async submitAnswer() {
        const userAnswer = DomUtils.getValue(DomUtils.getElement('user-answer'));
        const lop = DomUtils.getValue(DomUtils.getElement('lop'));
        const question = DomUtils.getValue(DomUtils.getElement('question'));

        if (!userAnswer) return showAlert('Vui lòng nhập câu trả lời!');
        if (!practiceState.sessionId) return showAlert('Phiên không hợp lệ!');

        showBlocker();

        const submitBtn = document.querySelector('.submit-answer-btn');
        DomUtils.setButtonLoading(submitBtn, true);
        showLoading('Đang kiểm tra...');

        try {
            const result = await ApiService.request('/process-answer', { lop, question, user_answer: userAnswer, id: practiceState.sessionId });
            hideLoading();

            const data = Array.isArray(result) ? result[0] : result;
            const isCorrect = data?.acstatus === 'true';

            if (isCorrect) {
                showAlert('🎉 Chính xác!', 'success');
            } else {
                showAlert('❌ Chưa đúng!', 'error');
            }
        } catch (err) {
            hideLoading();
            showAlert(err.message);
        } finally {
            DomUtils.setButtonLoading(submitBtn, false);
        }
    }

    static renderMath() {
        if (window.MathJax) window.MathJax.typesetPromise();
    }
}

window.submitMathQuestion = () => QuestionManager.submitMathQuestion();
window.submitAnswer = () => QuestionManager.submitAnswer();

customElements.whenDefined('math-field').then(() => {
    const mf = document.getElementById('question');
    if (mf) {
        mf.defaultMode = 'text';
        mf.mode = 'text';
        mf.smartMode = true;
    }
});

customElements.whenDefined('math-field').then(() => {
    const mf = document.getElementById('user-answer');
    if (mf) {
        mf.defaultMode = 'text';
        mf.mode = 'text';
        mf.smartMode = true;
    }
});