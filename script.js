// Ініціалізація значень гри
let score = 0;
let energy = 1000;

// Функція для перемикання сторінок
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none'; // Приховуємо всі сторінки
    });
    document.getElementById(pageId).style.display = 'flex'; // Показуємо обрану сторінку
}

// Повернення на головну сторінку
document.querySelectorAll('.back-button').forEach(button => {
    button.onclick = function() {
        showPage('mainPage');
    };
});

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
