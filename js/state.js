class AppState {
    constructor() {
        this.storageKey = 'omu_state';
        this.load();
    }
    
    load() {
        const saved = localStorage.getItem(this.storageKey);
        if(saved) {
            const data = JSON.parse(saved);
            this.days = data.days || 0;
            this.minutes = data.minutes || 0;
            this.lastPracticeDate = data.lastPracticeDate || null;
        } else {
            this.days = 0;
            this.minutes = 0;
            this.lastPracticeDate = null;
        }
    }
    
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify({
            days: this.days,
            minutes: this.minutes,
            lastPracticeDate: this.lastPracticeDate
        }));
    }
    
    addPractice(minutes) {
        const today = new Date().toDateString();
        
        // Проверяем, была ли уже практика сегодня
        if(this.lastPracticeDate !== today) {
            this.days++;
            this.lastPracticeDate = today;
        }
        
        this.minutes += minutes;
        this.save();
        
        // Отправляем аналитику
        this.sendAnalytics('practice_complete', { minutes, totalDays: this.days });
    }
    
    getStats() {
        return {
            days: this.days,
            minutes: this.minutes
        };
    }
    
    sendAnalytics(event, data = {}) {
        // Минимальная аналитика для команды
        const analyticsData = {
            event,
            timestamp: Date.now(),
            userId: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'anonymous',
            ...data
        };
        
        console.log('[Analytics]', analyticsData);
        
        // TODO: Отправка на ваш backend
        // fetch('https://your-api.com/analytics', {
        //     method: 'POST',
        //     body: JSON.stringify(analyticsData)
        // });
    }
}

// Глобальный экземпляр
window.appState = new AppState();