// breathing-core.js — точная реализация практики

class BreathingPractice {
    constructor() {
        this.figure = document.getElementById('breathingFigure');
        this.playBtn = document.getElementById('playPauseBtn');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.hintText = document.getElementById('hintText');
        this.hintSubtext = document.getElementById('hintSubtext');
        this.controlButtons = document.getElementById('controlButtons');
        this.cancelBtn = document.getElementById('cancelCircle');
        this.finishBtn = document.getElementById('finishCircle');
        
        this.isActive = false;      // практика активна
        this.isPaused = false;      // на паузе
        this.remainingSeconds = 0;   // оставшиеся секунды
        this.timerInterval = null;
        this.animationId = null;
        this.currentCycleStart = null;
        
        // Фазы дыхания
        this.phases = [
            { name: 'Вдох', instruction: 'почувствуй тело', duration: 4, action: 'expand' },
            { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' },
            { name: 'Выдох', instruction: 'отпусти ум', duration: 6, action: 'contract' },
            { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' }
        ];
        
        this.cycleDuration = 14; // 4+2+6+2
        this.minScale = 0.6;
        this.maxScale = 1.0;
        this.currentScale = this.minScale;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Кнопка Play/Pause
        this.playBtn.addEventListener('click', () => {
            if (!this.isActive) {
                this.startPractice();
            } else if (this.isPaused) {
                this.resumePractice();
            } else {
                this.pausePractice();
            }
        });
        
        // Отмена
        this.cancelBtn.addEventListener('click', () => {
            if (confirm('Прервать практику?')) {
                this.stopPractice();
                window.location.href = 'index.html';
            }
        });
        
        // Финиш
        this.finishBtn.addEventListener('click', () => {
            if (confirm('Завершить практику?')) {
                this.stopPractice();
                if (window.appState) {
                    const totalDuration = 44; // TODO: брать из выбранной практики
                    const elapsed = totalDuration - this.remainingSeconds;
                    window.appState.addPractice(elapsed / 60);
                }
                window.location.href = 'reflection.html';
            }
        });
    }
    
    startPractice(durationSeconds = 44) {
        this.isActive = true;
        this.isPaused = false;
        this.remainingSeconds = durationSeconds;
        
        // Обновляем UI
        this.playBtn.textContent = '⏸';
        this.updateTimerDisplay();
        this.startBreathingAnimation();
        this.startTimer();
    }
    
    pausePractice() {
        this.isPaused = true;
        this.playBtn.textContent = '▶';
        this.stopBreathingAnimation();
        this.stopTimer();
        
        // Показываем кнопки управления
        this.controlButtons.classList.remove('hidden');
    }
    
    resumePractice() {
        this.isPaused = false;
        this.playBtn.textContent = '⏸';
        this.startBreathingAnimation();
        this.startTimer();
        
        // Скрываем кнопки управления
        this.controlButtons.classList.add('hidden');
    }
    
    stopPractice() {
        this.isActive = false;
        this.isPaused = false;
        this.stopBreathingAnimation();
        this.stopTimer();
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.isActive || this.isPaused) return;
            
            if (this.remainingSeconds <= 0) {
                this.completePractice();
            } else {
                this.remainingSeconds--;
                this.updateTimerDisplay();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimerDisplay() {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        this.timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    completePractice() {
        this.stopPractice();
        if (window.appState) {
            window.appState.addPractice(44 / 60);
        }
        window.location.href = 'reflection.html';
    }
    
    startBreathingAnimation() {
        this.currentCycleStart = performance.now();
        this.animate();
    }
    
    stopBreathingAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        if (!this.isActive || this.isPaused) return;
        
        const now = performance.now();
        const elapsed = (now - this.currentCycleStart) / 1000;
        const cycleProgress = elapsed % this.cycleDuration;
        
        // Определяем текущую фазу
        let accumulated = 0;
        let currentPhase = null;
        let phaseProgress = 0;
        
        for (const phase of this.phases) {
            if (cycleProgress < accumulated + phase.duration) {
                currentPhase = phase;
                phaseProgress = (cycleProgress - accumulated) / phase.duration;
                break;
            }
            accumulated += phase.duration;
        }
        
        if (currentPhase) {
            // Обновляем тексты подсказок
            this.updateHintText(currentPhase.name, currentPhase.instruction);
            
            // Обновляем масштаб фигуры
            let targetScale = this.currentScale;
            if (currentPhase.action === 'expand') {
                targetScale = this.minScale + (this.maxScale - this.minScale) * this.easeInOutCubic(phaseProgress);
            } else if (currentPhase.action === 'contract') {
                targetScale = this.maxScale - (this.maxScale - this.minScale) * this.easeInOutCubic(phaseProgress);
            } else {
                // hold
                targetScale = currentPhase.name === 'Вдох' ? this.maxScale : this.minScale;
            }
            
            this.currentScale = targetScale;
            this.updateFigure();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateFigure() {
        // Вертикальный овал: scaleX меньше, scaleY больше
        const scaleX = this.currentScale * 0.8;
        const scaleY = this.currentScale * 1.2;
        this.figure.style.transform = `scale(${scaleX}, ${scaleY})`;
        
        // Меняем прозрачность в зависимости от масштаба
        const opacity = 0.35 + (this.currentScale - this.minScale) / (this.maxScale - this.minScale) * 0.3;
        this.figure.style.opacity = opacity;
    }
    
    updateHintText(phaseName, instruction) {
        // Плавная смена текста
        if (this.hintText.textContent !== phaseName) {
            this.hintText.style.animation = 'none';
            this.hintSubtext.style.animation = 'none';
            this.hintText.offsetHeight; // рефлоу
            
            this.hintText.textContent = phaseName;
            this.hintSubtext.textContent = instruction;
            
            this.hintText.style.animation = 'hintFadeIn 0.4s ease';
            this.hintSubtext.style.animation = 'hintFadeIn 0.4s ease 0.1s backwards';
        }
    }
    
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.breathingPractice = new BreathingPractice();
});