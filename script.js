// Ініціалізація значень гри
let score = 0;
let energy = 1000;

// Telegram WebApp об'єкт
const tg = window.Telegram.WebApp;

// Отримання початкових даних від бота
function fetchUserData() {
    tg.sendData(JSON.stringify({ action: 'fetch_data' }));
}

// Обробка отриманих даних з бота
tg.onEvent('web_app_data', function(data) {
    const parsedData = JSON.parse(data);
    score = parsedData.score;
    energy = parsedData.energy;
    updateStats();
});

// Логіка гри: натискання на монету
document.getElementById('tapImage').onclick = function() {
    if (energy > 0) {
        score += 10;  // Додаємо очки за кожен тап
        energy -= 10; // Зменшуємо енергію за кожен тап
        updateStats();

        // Надсилання даних у Telegram-бот через sendData
        tg.sendData(JSON.stringify({ score: score, energy: energy }));
    } else {
        alert('No energy left! Come back tomorrow.');
    }
};

// Функція для оновлення статистики на екрані
function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}

// Викликаємо функцію для отримання даних користувача при завантаженні сторінки
fetchUserData();
