// Форматирование времени
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Плавная прокрутка
function smoothScrollTo(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Дебаунс для оптимизации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Проверка, первый ли раз пользователь
function isFirstVisit() {
    return !localStorage.getItem('omu_visited');
}

function markVisited() {
    localStorage.setItem('omu_visited', 'true');
}

// Экспорт
window.utils = {
    formatTime,
    smoothScrollTo,
    debounce,
    isFirstVisit,
    markVisited
};