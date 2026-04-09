// breathing-canvas.js — плавная анимация через Canvas

class BreathingPractice {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('breathingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Элементы UI
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
        
        // Практики
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
            ], totalCycle: 21 }
        ];
        
        this.currentPracticeIndex = 0;
        this.currentPhases = this.practiceTypes[0].phases;
        this.cycleDuration = this.practiceTypes[0].totalCycle;
        
        // Параметры анимации
        this.minRadius = 40;
        this.maxRadius = 120;
        this.currentRadius = this.minRadius;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Glow эффект
        this.glowIntensity = 0.3;
        
        this.init();
    }
    
    init() {
        const saved = localStorage.getItem('omu_last_practice');
        if (saved !== null) {
            this.currentPracticeIndex = parseInt(saved);
            this.setPractice(this.currentPracticeIndex);
        }
        
        this.setupEventListeners();
        this.resetUI();
        this.draw(); // начальная отрисовка
    }
    
    setPractice(index) {
        this.currentPracticeIndex = index % this.practiceTypes.length;
        const practice = this.practiceTypes[this.currentPracticeIndex];
        this.currentPhases = practice.phases;
        this.cycleDuration = practice.totalCycle;
        localStorage.setItem('omu_last_practice', this.currentPracticeIndex);
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
        this.currentRadius = this.minRadius;
    }
    
    startPractice() {
        this.totalSeconds = 240;
        this.remainingSeconds = this.totalSeconds;
        this.isActive = true;
        this.isPaused = false;
        this.playBtn.textContent = '⏸';
        this.actionButtons.classList.add('hidden');
        
        this.updateTimerDisplay();
        this.startTimer();
        this.startAnimation();
        
        if (window.appState) {
            window.appState.sendAnalytics('practice_start', {
                type: this.practiceTypes[this.currentPracticeIndex].name
            });
        }
    }
    
    pausePractice() {
        this.isPaused = true;
        this.playBtn.textContent = '▶';
        this.stopTimer();
        this.actionButtons.classList.remove('hidden');
        this.phaseName.style.opacity = '0';
        this.phaseInstruction.style.opacity = '0';
    }
    
    resumePractice() {
        this.isPaused = false;
        this.playBtn.textContent = '⏸';
        this.startTimer();
        this.actionButtons.classList.add('hidden');
        this.phaseName.style.opacity = '1';
        this.phaseInstruction.style.opacity = '1';
        this.cycleStartTime = performance.now() - this.getCurrentCycleProgress() * 1000;
    }
    
    stopPractice() {
        this.isActive = false;
        this.isPaused = false;
        this.stopTimer();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
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
        }
        window.location.href = 'reflection.html';
    }
    
    startAnimation() {
        this.cycleStartTime = performance.now();
        this.animate();
    }
    
    getCurrentCycleProgress() {
        if (!this.cycleStartTime) return 0;
        return ((performance.now() - this.cycleStartTime) / 1000) % this.cycleDuration;
    }
    
    animate() {
        if (!this.isActive || this.isPaused) {
            this.draw();
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
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
            this.updatePhaseText(currentPhase.name, currentPhase.instruction);
            
            // Супер-плавная кривая
            let smoothProgress = phaseProgress;
            if (currentPhase.action === 'expand') {
                smoothProgress = 1 - Math.pow(1 - phaseProgress, 2.5);
            } else if (currentPhase.action === 'contract') {
                smoothProgress = Math.pow(phaseProgress, 2);
            }
            
            let targetRadius;
            if (currentPhase.action === 'expand') {
                targetRadius = this.minRadius + (this.maxRadius - this.minRadius) * smoothProgress;
            } else if (currentPhase.action === 'contract') {
                targetRadius = this.maxRadius - (this.maxRadius - this.minRadius) * smoothProgress;
            } else {
                targetRadius = currentPhase.name === 'Вдох' ? this.maxRadius : this.minRadius;
            }
            
            // Сглаживание
            this.currentRadius = this.currentRadius * 0.94 + targetRadius * 0.06;
            this.glowIntensity = 0.25 + (this.currentRadius - this.minRadius) / (this.maxRadius - this.minRadius) * 0.35;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        if (!this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Внешнее свечение
        this.ctx.shadowBlur = 40;
        this.ctx.shadowColor = `rgba(210, 190, 160, ${this.glowIntensity * 0.6})`;
        
        // Основная фигура (вертикальный овал)
        const radiusX = this.currentRadius;
        const radiusY = this.currentRadius * 1.35;
        
        // Градиент для объёма
        const gradient = this.ctx.createRadialGradient(
            this.centerX - 10, this.centerY - 10, 10,
            this.centerX, this.centerY, this.currentRadius
        );
        gradient.addColorStop(0, `rgba(230, 210, 180, ${0.3 + this.glowIntensity * 0.3})`);
        gradient.addColorStop(0.5, `rgba(200, 175, 145, ${0.15 + this.glowIntensity * 0.15})`);
        gradient.addColorStop(1, `rgba(170, 145, 115, 0)`);
        
        this.ctx.beginPath();
        this.ctx.ellipse(this.centerX, this.centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Внутреннее свечение
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.ellipse(this.centerX, this.centerY, radiusX * 0.6, radiusY * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(245, 230, 200, ${0.1 + this.glowIntensity * 0.15})`;
        this.ctx.fill();
        
        // Сброс тени
        this.ctx.shadowBlur = 0;
    }
    
    updatePhaseText(name, instruction) {
        if (this.phaseName.textContent !== name) {
            this.phaseName.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            this.phaseInstruction.style.transition = 'opacity 0.2s ease 0.05s, transform 0.2s ease';
            
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

document.addEventListener('DOMContentLoaded', () => {
    window.breathingPractice = new BreathingPractice();
});