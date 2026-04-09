// transitions.js — мягкие переходы между экранами
// Soft Presence UI: crossfade 300-500ms, никаких slide и bounce

class PageTransition {
    constructor() {
        this.isTransitioning = false;
        this.transitionDuration = 400; // ms
    }
    
    // Плавный переход на новую страницу
    navigateTo(url, options = {}) {
        if (this.isTransitioning) return;
        
        const { onBeforeTransition, onAfterTransition } = options;
        this.isTransitioning = true;
        
        // Вызываем колбэк перед переходом
        if (onBeforeTransition) onBeforeTransition();
        
        // Создаём эффект fade-out для текущей страницы
        document.body.style.transition = `opacity ${this.transitionDuration}ms cubic-bezier(0.2, 0.9, 0.4, 1.1)`;
        document.body.style.opacity = '0';
        
        // Небольшая задержка для плавности
        setTimeout(() => {
            window.location.href = url;
        }, this.transitionDuration);
    }
    
    // Мягкий клик по кнопке (scale + fade)
    softClick(button, callback) {
        if (!button) return;
        
        // Запрещаем повторные клики во время анимации
        if (button.hasAttribute('data-clicking')) return;
        button.setAttribute('data-clicking', 'true');
        
        // Анимация нажатия
        button.style.transition = 'transform 0.15s cubic-bezier(0.2, 0.9, 0.4, 1.1), opacity 0.15s ease';
        button.style.transform = 'scale(0.96)';
        button.style.opacity = '0.7';
        
        // Лёгкая вибрация
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.opacity = '';
            button.removeAttribute('data-clicking');
            if (callback) callback();
        }, 150);
    }
    
    // Эффект появления элемента (fade-in + gentle shift)
    fadeIn(element, duration = 400) {
        if (!element) return;
        element.style.opacity = '0';
        element.style.transform = 'translateY(6px)';
        element.style.transition = `opacity ${duration}ms cubic-bezier(0.2, 0.9, 0.4, 1.1), transform ${duration}ms ease`;
        
        // Запускаем рефлоу
        element.offsetHeight;
        
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }
    
    // Эффект исчезновения элемента
    fadeOut(element, duration = 300, callback) {
        if (!element) return;
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            if (callback) callback();
        }, duration);
    }
}

// Глобальный экземпляр
window.pageTransition = new PageTransition();

// Автоматическое применение fade-in к body при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Мягкое появление контента
    document.body.style.opacity = '0';
    document.body.style.transition = 'none';
    
    // Запускаем рефлоу
    document.body.offsetHeight;
    
    document.body.style.transition = 'opacity 500ms cubic-bezier(0.2, 0.9, 0.4, 1.1)';
    document.body.style.opacity = '1';
    
    // Активируем все soft-кнопки на странице
    document.querySelectorAll('[data-soft-click]').forEach(btn => {
        const targetUrl = btn.getAttribute('data-href');
        if (targetUrl) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.pageTransition.softClick(btn, () => {
                    window.pageTransition.navigateTo(targetUrl);
                });
            });
        }
    });
});

// Предотвращаем резкие переходы при нажатии на обычные ссылки
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.target !== '_blank') {
        e.preventDefault();
        const url = link.getAttribute('href');
        if (url && !url.startsWith('http')) {
            window.pageTransition.navigateTo(url);
        }
    }
});