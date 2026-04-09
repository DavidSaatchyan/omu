class BreathingPractice {
    constructor(options) {
        this.shape = document.getElementById(options.shapeElement);
        this.phaseText = document.getElementById(options.phaseTextElement);
        this.instruction = document.getElementById(options.instructionElement);
        this.timerElement = document.getElementById(options.timerElement);
        this.duration = options.duration;
        this.onComplete = options.onComplete;
        
        this.remaining = this.duration;
        this.isPlaying = true;
        this.animationId = null;
        this.cycleStartTime = null;
        
        // Фазы дыхательного цикла (в секундах)
        this.phases = [
            { name: 'Вдох', instruction: 'почувствуй тело', duration: 4, action: 'expand' },
            { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' },
            { name: 'Выдох', instruction: 'отпусти ум', duration: 6, action: 'contract' },
            { name: 'Пауза', instruction: 'будь здесь', duration: 2, action: 'hold' }
        ];
        
        this.totalCycleTime = 14; // 4+2+6+2 = 14 сек
        this.currentPhaseIndex = 0;
        this.currentPhase = this.phases[0];
        
        // Размеры фигуры
        this.minSize = 100;
        this.maxSize = 220;
        this.currentSize = this.minSize;
        
        // Таймер обратного отсчёта
        this.timerInterval = null;
        
        this.start();
    }
    
    start() {
        // Запускаем таймер практики
        this.timerInterval = setInterval(() => {
            if (!this.isPlaying) return;
            
            this.remaining--;
            this.updateTimerDisplay();
            
            if (this.remaining <= 0) {
                clearInterval(this.timerInterval);
                cancelAnimationFrame(this.animationId);
                this.onComplete();
            }
        }, 1000);
        
        // Запускаем анимацию дыхания
        this.cycleStartTime = performance.now();
        this.animate();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    animate() {
        if (!this.isPlaying) {
            this.animationId = requestAnimationFrame(() => this.animate());
            return;
        }
        
        const now = performance.now();
        const elapsed = (now - this.cycleStartTime) / 1000; // в секундах
        const cycleProgress = elapsed % this.totalCycleTime;
        
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
            // Обновляем текст фазы и инструкцию
            if (this.phaseText.textContent !== currentPhase.name) {
                this.phaseText.textContent = currentPhase.name;
                this.instruction.textContent = currentPhase.instruction;
                this.animateText();
            }
            
            // Обновляем размер фигуры
            let targetSize = this.currentSize;
            if (currentPhase.action === 'expand') {
                targetSize = this.minSize + (this.maxSize - this.minSize) * this.easeInOutCubic(phaseProgress);
            } else if (currentPhase.action === 'contract') {
                targetSize = this.maxSize - (this.maxSize - this.minSize) * this.easeInOutCubic(phaseProgress);
            } else {
                // hold — сохраняем размер
                targetSize = currentPhase.name === 'Вдох' ? this.maxSize : this.minSize;
            }
            
            this.currentSize = targetSize;
            this.updateShape();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateShape() {
        // Размер
        this.shape.style.width = `${this.currentSize}px`;
        this.shape.style.height = `${this.currentSize}px`;
        
        // Прозрачность
        const opacity = 0.3 + (this.currentSize - this.minSize) / (this.maxSize - this.minSize) * 0.4;
        this.shape.style.opacity = opacity;
    }
    
    animateText() {
        // Анимация смены текста
        this.phaseText.style.animation = 'none';
        this.instruction.style.animation = 'none';
        this.phaseText.offsetHeight; // рефлоу
        this.instruction.offsetHeight;
        this.phaseText.style.animation = 'phaseFadeIn 0.4s ease';
        this.instruction.style.animation = 'phaseFadeIn 0.4s ease 0.1s backwards';
    }
    
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    
    pause() {
        this.isPlaying = false;
    }
    
    resume() {
        this.isPlaying = true;
        this.cycleStartTime = performance.now() - (this.getCurrentCycleProgress() * 1000);
    }
    
    getCurrentCycleProgress() {
        // Возвращает текущий прогресс цикла в секундах
        if (!this.cycleStartTime) return 0;
        return (performance.now() - this.cycleStartTime) / 1000;
    }
    
    stop() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        cancelAnimationFrame(this.animationId);
    }
}