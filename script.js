// Ініціалізація значень гри
let score = 0;
let energy = 1000;

// Функція для симуляції завантаження
function simulateLoading() {
    let progress = 0;
    const progressBar = document.getElementById('progressBar');
    const loadingScreen = document.getElementById('loadingScreen');
    const gameContainer = document.getElementById('gameContainer');

    const loadingInterval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(loadingInterval);
            loadingScreen.style.display = 'none'; // Приховати завантажувальний екран
            gameContainer.style.display = 'flex'; // Показати гру
        } else {
            progress += 10; // Збільшення прогресу
            progressBar.style.width = progress + '%'; // Оновлення ширини прогрес-бару
        }
    }, 500); // Оновлювати кожні 500 мс (0.5 секунди)
}

// Запуск симуляції завантаження при завантаженні сторінки
document.addEventListener('DOMContentLoaded', simulateLoading);

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

// Обробники для інших кнопок (поки що не реалізовано)
document.getElementById('shopButton').onclick = function() {
    alert('Shop is not implemented yet.');
};
document.getElementById('claimButton').onclick = function() {
    alert('Claim is not implemented yet.');
};
document.getElementById('boostButton').onclick = function() {
    alert('Boost is not implemented yet.');
};
document.getElementById('friendButton').onclick = function() {
    alert('Friend is not implemented yet.');
};

// Функція для оновлення статистики на екрані
function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}

// Встановлення колірної схеми відповідно до налаштувань Telegram
tg.expand();
document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
