// Ініціалізація значень гри
let score = 0;
let energy = 1000;

// Функція для симуляції завантаження
function simulateLoading() {
    let progress = 0;
    const progressBar = document.getElementById('progressBar');
    const loadingScreen = document.getElementById('loadingScreen');
    const mainPage = document.getElementById('mainPage');

    const loadingInterval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(loadingInterval);
            loadingScreen.style.display = 'none'; // Приховати екран завантаження
            mainPage.style.display = 'flex'; // Показати головну сторінку
        } else {
            progress += 10; // Збільшення прогресу
            progressBar.style.width = progress + '%'; // Оновлення ширини прогрес-бару
        }
    }, 500); // Оновлювати кожні 500 мс (0.5 секунди)
}

// Запуск симуляції завантаження при завантаженні сторінки
document.addEventListener('DOMContentLoaded', simulateLoading);

// Функція для перемикання сторінок
function showPage(pageId) {
    document.querySelectorAll('.container').forEach(page => {
        page.style.display = 'none'; // Приховуємо всі сторінки
    });
    document.getElementById(pageId).style.display = 'flex'; // Показуємо обрану сторінку

    // Встановлюємо кнопку "Назад" замість "Menu" для всіх сторінок, крім головної
    if (pageId !== 'mainPage') {
        window.Telegram.WebApp.BackButton.show();
    } else {
        window.Telegram.WebApp.BackButton.hide();
    }
}

// Функція для повернення на головну сторінку
function goBack() {
    showPage('mainPage');
}

// Встановлення дії кнопки "Назад" Telegram Web App
window.Telegram.WebApp.BackButton.onClick(goBack);

// Отримання інформації про користувача з Telegram
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
const nickname = user.username || `${user.first_name} ${user.last_name}`;
document.getElementById('nickname').innerText = `Player: ${nickname}`;

// Логіка гри
document.getElementById('tapImage').onclick = function() {
    if (energy > 0) {
        score += 1;
        energy -= 1;
        updateStats();
        
        // Додавання ефекту легкого блюру при натисканні
        this.classList.add('blur');
        setTimeout(() => this.classList.remove('blur'), 100);
    } else {
        alert('No energy left! Come back tomorrow.');
    }
};

// Обробники для кнопок перемикання сторінок
document.getElementById('friendButton').onclick = function() {
    showPage('friendPage');
};
document.getElementById('boostButton').onclick = function() {
    showPage('boostPage');
};
document.getElementById('shopButton').onclick = function() {
    showPage('shopPage');
};
document.getElementById('claimButton').onclick = function() {
    showPage('claimPage');
};

// Функція для оновлення статистики на екрані
function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}

// Встановлення колірної схеми відповідно до налаштувань Telegram
tg.expand();
document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
