class BreathingAnimation {
    constructor(options) {
        this.canvas = document.getElementById(options.canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.phaseHint = document.getElementById(options.phaseHintId);
        this.onPhaseChange = options.onPhaseChange || (() => {});
        
        // Параметры дыхательного цикла (в миллисекундах)
        this.phases = [
            { name: 'Вдох', duration: 4000, action: 'expand' },
            { name: 'Задержка', duration: 2000, action: 'hold' },
            { name: 'Выдох', duration: 6000, action: 'contract' },
            { name: 'Пауза', duration: 2000, action: 'hold' }
        ];
        
        this.currentPhase = 0;
        this.phaseStartTime = 0;
        this.animationId = null;
        this.isRunning = false;
        
        // Размеры круга (min/max радиус)
        this.minRadius = 40;
        this.maxRadius = 100;
        this.currentRadius = this.minRadius;
        
        // Центр canvas
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }
    
    start() {
        this.isRunning = true;
        this.currentPhase = 0;
        this.phaseStartTime = performance.now();
        this.updatePhaseDisplay();
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if(this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    updatePhaseDisplay() {
        const phase = this.phases[this.currentPhase];
        this.phaseHint.textContent = phase.name;
        this.onPhaseChange(phase.name);
        
        // Лёгкая вибрация на смену фазы
        if(window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    }
    
    animate() {
        if(!this.isRunning) return;
        
        const now = performance.now();
        const elapsed = now - this.phaseStartTime;
        const phase = this.phases[this.currentPhase];
        const phaseProgress = Math.min(1, elapsed / phase.duration);
        
        // Обновляем радиус в зависимости от фазы
        if(phase.action === 'expand') {
            this.currentRadius = this.minRadius + (this.maxRadius - this.minRadius) * phaseProgress;
        } else if(phase.action === 'contract') {
            this.currentRadius = this.maxRadius - (this.maxRadius - this.minRadius) * phaseProgress;
        } else {
            // hold — радиус не меняется
        }
        
        // Рисуем круг
        this.drawCircle();
        
        // Переход к следующей фазе
        if(phaseProgress >= 1) {
            this.currentPhase = (this.currentPhase + 1) % this.phases.length;
            this.phaseStartTime = now;
            this.updatePhaseDisplay();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawCircle() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем полупрозрачный круг с размытием (эффект как на скрине)
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(180, 150, 120, 0.15)';
        this.ctx.fill();
        
        // Основной круг
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.currentRadius * 0.85, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(160, 130, 100, 0.4)';
        this.ctx.fill();
        
        // Центральная точка (маленький круг)
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(120, 90, 60, 0.6)';
        this.ctx.fill();
    }
}