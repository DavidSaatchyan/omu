class Timer {
    constructor(durationSeconds, callbacks) {
        this.remaining = durationSeconds;
        this.totalDuration = durationSeconds;
        this.callbacks = callbacks;
        this.interval = null;
        this.isRunning = true;
        
        this.start();
    }
    
    start() {
        this.updateDisplay();
        
        this.interval = setInterval(() => {
            if(!this.isRunning) return;
            
            if(this.remaining <= 0) {
                clearInterval(this.interval);
                
                // Сохраняем минуты практики
                const minutesPracticed = Math.ceil(this.totalDuration / 60);
                if(window.appState) {
                    window.appState.addPractice(minutesPracticed);
                }
                
                // Воспроизводим звук
                this.playCompleteSound();
                
                if(this.callbacks.onComplete) this.callbacks.onComplete();
            } else {
                this.remaining--;
                this.updateDisplay();
                if(this.callbacks.onTick) this.callbacks.onTick(this.remaining);
            }
        }, 1000);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        const timerElement = document.getElementById('timer');
        if(timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Обновление прогресс-бара
        const progressFill = document.getElementById('progressFill');
        if(progressFill) {
            const percent = ((this.totalDuration - this.remaining) / this.totalDuration) * 100;
            progressFill.style.width = `${percent}%`;
        }
    }
    
    playCompleteSound() {
        const audio = new Audio('assets/sounds/complete.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        this.isRunning = true;
    }
}