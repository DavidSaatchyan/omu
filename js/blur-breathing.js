class BlurBreathing {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.isRunning = false;
        this.animationId = null;
        
        // Параметры (очень мягкие, почти незаметные)
        this.minSize = 120;
        this.maxSize = 160;
        this.currentSize = this.minSize;
        
        // Длительность полного цикла (вдох+выдох) = 8 секунд
        this.cycleDuration = 8000; // 8 сек
        this.startTime = 0;
    }
    
    start() {
        this.isRunning = true;
        this.startTime = performance.now();
        this.element.style.opacity = '0.6';
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if(this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.element.style.opacity = '0';
    }
    
    animate() {
        if(!this.isRunning) return;
        
        const now = performance.now();
        const elapsed = (now - this.startTime) % this.cycleDuration;
        const progress = elapsed / this.cycleDuration; // 0..1
        
        // Плавное изменение размера: sin от 0 до 1 и обратно
        // sin(pi * progress) даёт плавное увеличение и уменьшение
        const t = Math.sin(Math.PI * progress);
        this.currentSize = this.minSize + (this.maxSize - this.minSize) * t;
        
        // Применяем стили
        this.element.style.width = `${this.currentSize}px`;
        this.element.style.height = `${this.currentSize}px`;
        
        // Лёгкое изменение прозрачности (ещё мягче)
        const opacity = 0.4 + t * 0.3;
        this.element.style.opacity = opacity;
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}