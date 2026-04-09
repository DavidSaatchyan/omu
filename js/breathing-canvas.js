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
        this.lastFrameTime = null;
        
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
        this.centerX = 0;
        this.centerY = 0;
        
        // Glow эффект
        this.glowIntensity = 0.3;

        this.figureImg = null;
        this.figureReady = false;
        this.figureNaturalSize = 346;
        this.figureObjectUrl = null;

        this.phaseNameAnim = null;
        this.phaseInstructionAnim = null;

        this.init();
    }
    
    init() {
        const saved = localStorage.getItem('omu_last_practice');
        if (saved !== null) {
            this.currentPracticeIndex = parseInt(saved);
            this.setPractice(this.currentPracticeIndex);
        }
        
        this.loadFigure();
        this.setupEventListeners();
        this.setupCanvas();
        this.resetUI();
        this.draw(); // начальная отрисовка

        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
            if (this.isActive) {
                this.stopAnimation();
                this.startAnimation();
            }
        });
    }

    setupCanvas() {
        if (!this.canvas || !this.ctx) return;

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const rect = this.canvas.getBoundingClientRect();
        const cssW = Math.max(1, Math.round(rect.width));
        const cssH = Math.max(1, Math.round(rect.height));

        const targetW = Math.round(cssW * dpr);
        const targetH = Math.round(cssH * dpr);
        if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
            this.canvas.width = targetW;
            this.canvas.height = targetH;
        }

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.centerX = cssW / 2;
        this.centerY = cssH / 2;
    }
    
    loadFigure() {
        this.figureReady = false;
        if (this.figureObjectUrl) {
            URL.revokeObjectURL(this.figureObjectUrl);
            this.figureObjectUrl = null;
        }

        const src = 'assets/figures/breathing-figure 3.svg';
        fetch(src)
            .then((r) => {
                if (!r.ok) throw new Error(`Failed to load figure: ${r.status}`);
                return r.blob();
            })
            .then((blob) => {
                this.figureObjectUrl = URL.createObjectURL(blob);
                this.figureImg = new Image();
                this.figureImg.decoding = 'async';
                this.figureImg.onload = () => {
                    this.figureReady = true;
                    const w = this.figureImg?.naturalWidth;
                    const h = this.figureImg?.naturalHeight;
                    if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
                        this.figureNaturalSize = Math.max(w, h);
                    }
                    this.draw();
                };
                this.figureImg.onerror = () => {
                    this.figureReady = false;
                    this.draw();
                };
                this.figureImg.src = this.figureObjectUrl;
            })
            .catch(() => {
                this.figureReady = false;
                this.draw();
            });
    }

    drawProcedural(size, alphaK) {
        const base = size * 0.5;
        const offset = base * 0.26;
        const petalX = base * 0.36;
        const petalY = base * 0.52;

        const aOuter = (0.16 + this.glowIntensity * 0.16) * alphaK;
        const aMid = (0.10 + this.glowIntensity * 0.10) * alphaK;
        const aCore = (0.08 + this.glowIntensity * 0.10) * alphaK;

        const g = (cx, cy, r) => {
            const gg = this.ctx.createRadialGradient(cx - r * 0.12, cy - r * 0.12, r * 0.06, cx, cy, r);
            gg.addColorStop(0, `rgba(255, 252, 246, ${aOuter})`);
            gg.addColorStop(0.55, `rgba(214, 197, 170, ${aMid})`);
            gg.addColorStop(1, 'rgba(214, 197, 170, 0)');
            return gg;
        };

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.filter = `blur(${10 + this.glowIntensity * 6}px)`;

        const petals = [
            { x: this.centerX, y: this.centerY - offset, rx: petalX, ry: petalY },
            { x: this.centerX, y: this.centerY + offset, rx: petalX, ry: petalY },
            { x: this.centerX - offset, y: this.centerY, rx: petalY, ry: petalX },
            { x: this.centerX + offset, y: this.centerY, rx: petalY, ry: petalX }
        ];

        for (const p of petals) {
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = g(p.x, p.y, Math.max(p.rx, p.ry));
            this.ctx.fill();
        }

        this.ctx.filter = `blur(${5 + this.glowIntensity * 3}px)`;
        this.ctx.globalCompositeOperation = 'screen';

        const coreR = base * 0.32;
        const coreG = this.ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, coreR);
        coreG.addColorStop(0, `rgba(255, 255, 255, ${aCore})`);
        coreG.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = coreG;
        this.ctx.beginPath();
        this.ctx.ellipse(this.centerX, this.centerY, coreR, coreR, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
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
        this.startAnimation();
    }
    
    stopPractice() {
        this.isActive = false;
        this.isPaused = false;
        this.stopTimer();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.lastFrameTime = null;
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
        if (this.animationId) return;
        this.setupCanvas();
        this.lastFrameTime = null;
        this.cycleStartTime = performance.now();
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.lastFrameTime = null;
    }
    
    getCurrentCycleProgress() {
        if (!this.cycleStartTime) return 0;
        return ((performance.now() - this.cycleStartTime) / 1000) % this.cycleDuration;
    }
    
    animate(now) {
        if (!this.isActive || this.isPaused) {
            this.animationId = null;
            this.draw();
            return;
        }

        if (!this.lastFrameTime) this.lastFrameTime = now;
        const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
        this.lastFrameTime = now;

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
            
            // Супер-плавная кривая (единая для вдоха/выдоха)
            const easeInOut = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);
            const smoothProgress = easeInOut(Math.min(1, Math.max(0, phaseProgress)));
            
            let targetRadius;
            if (currentPhase.action === 'expand') {
                targetRadius = this.minRadius + (this.maxRadius - this.minRadius) * smoothProgress;
            } else if (currentPhase.action === 'contract') {
                targetRadius = this.maxRadius - (this.maxRadius - this.minRadius) * smoothProgress;
            } else {
                // hold: фиксируем на границе (после вдоха держим max, после выдоха держим min)
                targetRadius = cycleProgress < this.currentPhases[0].duration ? this.minRadius : this.currentRadius;
                if (cycleProgress >= this.currentPhases[0].duration && cycleProgress < this.currentPhases[0].duration + this.currentPhases[1].duration) {
                    targetRadius = this.maxRadius;
                }
            }
            
            // Сглаживание, независимое от FPS
            const tau = 0.18;
            const a = 1 - Math.exp(-dt / tau);
            this.currentRadius = this.currentRadius + (targetRadius - this.currentRadius) * a;
            this.glowIntensity = 0.25 + (this.currentRadius - this.minRadius) / (this.maxRadius - this.minRadius) * 0.35;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }
    
    draw() {
        if (!this.ctx) return;

        this.setupCanvas();
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const minScale = 0.62;
        const maxScale = 0.98;
        const p = (this.currentRadius - this.minRadius) / (this.maxRadius - this.minRadius);
        const k = minScale + (maxScale - minScale) * Math.min(1, Math.max(0, p));

        const blurOuter = 12 + this.glowIntensity * 6;
        const pad = Math.max(24, Math.ceil(blurOuter * 2.4));
        const baseSize = Math.min(this.centerX, this.centerY) * 2;
        const safeSize = Math.max(1, baseSize - pad * 2);
        const targetSize = safeSize * k;
        const drawW = targetSize;
        const drawH = targetSize;
        const x = this.centerX - drawW / 2;
        const y = this.centerY - drawH / 2;

        if (!this.figureReady || !this.figureImg) {
            this.drawProcedural(targetSize, 1);
            return;
        }

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.globalAlpha = 0.26 + this.glowIntensity * 0.18;
        this.ctx.filter = `blur(${blurOuter}px)`;
        this.ctx.drawImage(this.figureImg, x, y, drawW, drawH);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 0.14 + this.glowIntensity * 0.12;
        this.ctx.filter = `blur(${6 + this.glowIntensity * 2}px)`;
        this.ctx.drawImage(this.figureImg, x, y, drawW, drawH);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.10 + this.glowIntensity * 0.08;
        this.ctx.filter = 'blur(0.8px)';
        this.ctx.drawImage(this.figureImg, x, y, drawW, drawH);
        this.ctx.restore();
    }
    
    updatePhaseText(name, instruction) {
        if (this.phaseName.textContent !== name) {
            if (this.phaseNameAnim) this.phaseNameAnim.cancel();
            if (this.phaseInstructionAnim) this.phaseInstructionAnim.cancel();

            this.phaseName.textContent = name;
            this.phaseInstruction.textContent = instruction;

            this.phaseNameAnim = this.phaseName.animate(
                [
                    { opacity: 0, transform: 'translateY(6px)' },
                    { opacity: 1, transform: 'translateY(0px)' }
                ],
                { duration: 520, easing: 'cubic-bezier(0.2, 0.9, 0.4, 1.1)', fill: 'forwards' }
            );

            this.phaseInstructionAnim = this.phaseInstruction.animate(
                [
                    { opacity: 0, transform: 'translateY(6px)' },
                    { opacity: 1, transform: 'translateY(0px)' }
                ],
                { duration: 620, easing: 'cubic-bezier(0.2, 0.9, 0.4, 1.1)', fill: 'forwards', delay: 90 }
            );
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.breathingPractice = new BreathingPractice();
});