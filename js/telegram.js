const tg = window.Telegram.WebApp;

// Расширение на весь экран
tg.expand();

// Настройка главной кнопки (если нужно)
tg.MainButton.setText('Готово');
tg.MainButton.onClick(() => {
    // Действие
});

// Цветовая тема (берём из Telegram)
document.documentElement.style.setProperty('--bg', tg.themeParams.bg_color || '#f5f0e8');
document.documentElement.style.setProperty('--text', tg.themeParams.text_color || '#2c2c2c');

// Убираем кнопку "Назад" по умолчанию, если нужно
tg.BackButton.hide();