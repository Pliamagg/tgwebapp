// Ініціалізація значень гри
let score = 0;
let energy = 1000;
const tg = window.Telegram.WebApp;  // Ініціалізація Telegram SDK
tg.ready();  // WebApp готовий до роботи
let userId = tg.initDataUnsafe?.user?.id || null;  // Отримуємо user_id з Telegram

// Якщо користувач є, ініціалізуємо його дані
if (!userId) {
    alert("Користувача не знайдено. Перезапустіть додаток.");
} else {
    const user = tg.initDataUnsafe.user;
    const nickname = user.username || `${user.first_name} ${user.last_name}`;
    document.getElementById('nickname').innerText = `Player: ${nickname}`;
}

// Функція для отримання початкових даних від API
async function fetchUserData() {
    try {
        let response = await fetch(`http://localhost:5000/user/${userId}`);
        if (response.ok) {
            let userData = await response.json();
            score = userData.score;
            energy = userData.energy;
            updateStats();  // Оновлюємо інтерфейс
        } else {
            console.error("Error fetching user data:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Функція для збереження прогресу користувача на сервері
async function saveUserProgress() {
    try {
        let response = await fetch(`http://localhost:5000/user/${userId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                score: score,
                energy: energy
            })
        });
        if (!response.ok) {
            console.error("Error saving user progress:", response.statusText);
        }
    } catch (error) {
        console.error("Error saving user progress:", error);
    }
}

// Логіка гри (натискання на монету)
document.getElementById('tapImage').onclick = async function() {
    if (energy > 0) {
        score += 1;
        energy -= 1;
        updateStats();  // Оновлюємо відображення очок та енергії
        await saveUserProgress();  // Зберігаємо прогрес на сервері

        // Додавання ефекту легкого блюру при натисканні
        this.classList.add('blur');
        setTimeout(() => this.classList.remove('blur'), 100);
    } else {
        alert('No energy left! Come back tomorrow.');
    }
};

// Обробка події WebApp (якщо використовуються події бота)
tg.onEvent('web_app_data', function(data) {
    const parsedData = JSON.parse(data);
    score = parsedData.score;
    energy = parsedData.energy;
    updateStats();
});

// Функція для перемикання сторінок
function showPage(pageId) {
    document.querySelectorAll('.container').forEach(page => {
        page.style.display = 'none';  // Приховуємо всі сторінки
    });
    document.getElementById(pageId).style.display = 'flex';  // Показуємо обрану сторінку

    // Встановлюємо кнопку "Назад" замість "Menu" для всіх сторінок, крім головної
    if (pageId !== 'mainPage') {
        tg.BackButton.show();
    } else {
        tg.BackButton.hide();
    }
}

// Встановлення дії кнопки "Назад" у Telegram WebApp
tg.BackButton.onClick(goBack);

// Функція для повернення на головну сторінку
function goBack() {
    showPage('mainPage');
}

// Функція для оновлення статистики на екрані
function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}

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

// Встановлення колірної схеми відповідно до налаштувань Telegram
tg.expand();
document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';

// Виклик функції отримання даних при завантаженні сторінки
fetchUserData();
