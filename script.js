// Ініціалізація значень гри
let score = 0;
let energy = 1000;

// Отримання інформації про користувача з Telegram
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe.user;
const nickname = user.username || `${user.first_name} ${user.last_name}`;
document.getElementById('nickname').innerText = `Player: ${nickname}`;

// Логіка гри
document.getElementById('tapButton').onclick = function() {
    if (energy > 0) {
        score += 1;
        energy -= 1;
        updateStats();
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
