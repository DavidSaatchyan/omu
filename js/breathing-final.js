// breathing-final.js — супер-плавная анимация дыхания

class BreathingPractice {
    constructor() {
        // Элементы DOM
        this.figure = document.getElementById('breathingFigure');
        this.playBtn = document.getElementById('playPauseBtn');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.phaseName = document.getElementById('phaseName');
        this.phaseInstruction = document.getElementById('phaseInstruction');
        this.actionButtons = document.getElementById('actionButtons');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.finishActionBtn = document.getElementById('finishActionBtn');
        
        // Состояние
        this.isActive = false;
        this.isPaused = false;
        this.remainingSeconds = 0;
        this.totalSeconds = 0;
        this.timerInterval = null;
        this.animationId = null;
        this.cycleStartTime = null;
        
        // Типы практик (по кругу)
        this.practiceTypes = [
            { name: 'Квадратное дыхание', phases: [
                { name: 'Вдох', instruction: 'почувствуй тело', duration: 4, action: 'expand' },
                { name: 'Задержка', instruction: 'будь здесь', duration: 4, action: 'hold' },
                { name: 'Выдох', instruction: 'отпусти ум', duration: 4, action: 'contract' },
                { name: 'Задержка', instruction: 'будь здесь', duration: 4, action: 'hold' }
            ], totalCycle: 16 },
            { name: '4-7-8', phases: [
                { name: 'Вдох', instruction: 'медленный вдох носом', duration: 4, action: 'expand' },
                { name: 'Задержка', instruction: 'задержи дыхание', duration: 7, action: 'hold' },
                { name: 'Выдох', instruction: 'шумный выдох ртом', duration: 8, action: 'contract' },
                { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' }
            ], totalCycle: 21 },
            { name: '4-6 спокойствие', phases: [
                { name: 'Вдох', instruction: 'мягкий вдох', duration: 4, action: 'expand' },
                { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' },
                { name: 'Выдох', instruction: 'плавный выдох', duration: 6, action: 'contract' },
                { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' }
            ], totalCycle: 14 }
        ];
        
        this.currentPracticeIndex = 0;
        this.currentPhases = this.practiceTypes[0].phases;
        this.cycleDuration = this.practiceTypes[0].totalCycle;
        
        // Параметры фигуры
        this.minScale = 0.55;
        this.maxScale = 1.0;
        this.currentScale = this.minScale;
        
        this.init();
    }
    
    init() {
        // Загружаем последнюю практику из localStorage
        const saved = localStorage.getItem('omu_last_practice');
        if (saved !== null) {
            this.currentPracticeIndex = parseInt(saved);
            this.setPractice(this.currentPracticeIndex);
        }
        
        this.setupEventListeners();
        this.resetUI();
    }
    
    setPractice(index) {
        this.currentPracticeIndex = index % this.practiceTypes.length;
        const practice = this.practiceTypes[this.currentPracticeIndex];
        this.currentPhases = practice.phases;
        this.cycleDuration = practice.totalCycle;
        localStorage.setItem('omu_last_practice', this.currentPracticeIndex);
    }
    
    nextPractice() {
        this.setPractice(this.currentPracticeIndex + 1);
        if (!this.isActive) {
            this.resetUI();
        }
    }
    
    setupEventListeners() {
        this.playBtn.addEventListener('click', () => {
            if (!this.isActive) {
                this.startPractice();
            } else if (this.isPaused) {
                this.resumePractice();
            } else {
                this.pausePractice();
            }
        });
        
        this.cancelBtn.addEventListener('click', () => {
            if (confirm('Прервать практику?')) {
                this.stopPractice();
                window.location.href = 'index.html';
            }
        });
        
        this.finishActionBtn.addEventListener('click', () => {
            if (confirm('Завершить практику?')) {
                this.stopPractice();
                const elapsed = this.totalSeconds - this.remainingSeconds;
                if (window.appState) {
                    window.appState.addPractice(elapsed / 60);
                }
                window.location.href = 'reflection.html';
            }
        });
    }
    
    resetUI() {
        this.isActive = false;
        this.isPaused = false;
        this.playBtn.textContent = '▶';
        this.timerDisplay.textContent = '0:00';
        this.phaseName.textContent = 'Вдох';
        this.phaseInstruction.textContent = 'почувствуй тело';
        this.actionButtons.classList.add('hidden');
        
        // Сброс видимости текста
        this.phaseName.style.opacity = '1';
        this.phaseInstruction.style.opacity = '1';
        
        this.currentScale = this.minScale;
        this.updateFigure();
        this.figure.style.opacity = '0.5';
    }
    
    startPractice() {
        this.totalSeconds = 240; // 4 минуты
        this.remainingSeconds = this.totalSeconds;
        
        this.isActive = true;
        this.isPaused = false;
        this.playBtn.textContent = '⏸';
        this.actionButtons.classList.add('hidden');
        
        // Возвращаем видимость текста
        this.phaseName.style.opacity = '1';
        this.phaseInstruction.style.opacity = '1';
        
        this.updateTimerDisplay();
        this.startBreathingAnimation();
        this.startTimer();
        
        this.figure.style.opacity = '0.8';
        
        if (window.appState) {
            window.appState.sendAnalytics('practice_start', {
                type: this.practiceTypes[this.currentPracticeIndex].name,
                duration: this.totalSeconds
            });
        }
    }
    
    pausePractice() {
        this.isPaused = true;
        this.playBtn.textContent = '▶';
        this.stopBreathingAnimation();
        this.stopTimer();
        this.actionButtons.classList.remove('hidden');
        
        // Текст подсказок исчезает
        this.phaseName.style.transition = 'opacity 0.2s ease';
        this.phaseInstruction.style.transition = 'opacity 0.2s ease';
        this.phaseName.style.opacity = '0';
        this.phaseInstruction.style.opacity = '0';
    }
    
    resumePractice() {
        this.isPaused = false;
        this.playBtn.textContent = '⏸';
        this.startBreathingAnimation();
        this.startTimer();
        this.actionButtons.classList.add('hidden');
        
        // Текст подсказок возвращается
        this.phaseName.style.opacity = '1';
        this.phaseInstruction.style.opacity = '1';
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
            
            if (this.remainingSeconds <= 1) {
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
            window.appState.addPractice(this.totalSeconds / 60);
            window.appState.sendAnalytics('practice_complete', {
                type: this.practiceTypes[this.currentPracticeIndex].name,
                duration: this.totalSeconds
            });
        }
        
        this.nextPractice();
        window.location.href = 'reflection.html';
    }
    
    startBreathingAnimation() {
        this.cycleStartTime = performance.now();
        this.animate();
    }
    
    stopBreathingAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    // СУПЕР-ПЛАВНАЯ АНИМАЦИЯ
    animate() {
        if (!this.isActive || this.isPaused) return;
        
        const now = performance.now();
        const elapsed = (now - this.cycleStartTime) / 1000;
        const cycleProgress = elapsed % this.cycleDuration;
        
        let accumulated = 0;
        let currentPhase = null;
        let phaseProgress = 0;
        
        for (const phase of this.currentPhases) {
            if (cycleProgress < accumulated + phase.duration) {
                currentPhase = phase;
                phaseProgress = (cycleProgress - accumulated) / phase.duration;
                break;
            }
            accumulated += phase.duration;
        }
        
        if (currentPhase) {
            // Плавная смена текста
            this.updatePhaseText(currentPhase.name, currentPhase.instruction);
            
            // СУПЕР ПЛАВНАЯ КРИВАЯ — smoothstep
            let smoothProgress = phaseProgress;
            if (currentPhase.action === 'expand') {
                // easeOutCubic — плавное замедление в конце
                const t = 1 - phaseProgress;
                smoothProgress = 1 - t * t * t;
            } else if (currentPhase.action === 'contract') {
                // easeInCubic — плавное ускорение в начале
                smoothProgress = phaseProgress * phaseProgress * phaseProgress;
            }
            
            let targetScale;
            if (currentPhase.action === 'expand') {
                targetScale = this.minScale + (this.maxScale - this.minScale) * smoothProgress;
            } else if (currentPhase.action === 'contract') {
                targetScale = this.maxScale - (this.maxScale - this.minScale) * smoothProgress;
            } else {
                targetScale = currentPhase.name === 'Вдох' ? this.maxScale : this.minScale;
            }
            
            // Сглаживание (low-pass filter) — убирает рывки
            this.currentScale = this.currentScale * 0.92 + targetScale * 0.08;
            
            this.updateFigure();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateFigure() {
        // Вертикальный овал
        const scaleX = this.currentScale * 0.75;
        const scaleY = this.currentScale * 1.25;
        this.figure.style.transform = `scale(${scaleX}, ${scaleY})`;
        
        // Плавное изменение прозрачности
        const opacity = 0.45 + (this.currentScale - this.minScale) / (this.maxScale - this.minScale) * 0.4;
        this.figure.style.opacity = opacity;
        
        // Изменение размытия
        const blurAmount = 22 + (1 - this.currentScale) * 18;
        this.figure.style.filter = `blur(${blurAmount}px)`;
    }
    
    updatePhaseText(name, instruction) {
        if (this.phaseName.textContent !== name) {
            this.phaseName.style.transition = 'opacity 0.2s ease, transform 0.25s ease';
            this.phaseInstruction.style.transition = 'opacity 0.2s ease 0.05s, transform 0.25s ease';
            
            this.phaseName.style.opacity = '0';
            this.phaseInstruction.style.opacity = '0';
            this.phaseName.style.transform = 'translateY(4px)';
            this.phaseInstruction.style.transform = 'translateY(4px)';
            
            setTimeout(() => {
                this.phaseName.textContent = name;
                this.phaseInstruction.textContent = instruction;
                
                this.phaseName.style.opacity = '1';
                this.phaseInstruction.style.opacity = '1';
                this.phaseName.style.transform = 'translateY(0)';
                this.phaseInstruction.style.transform = 'translateY(0)';
            }, 150);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.breathingPractice = new BreathingPractice();
});