// Ініціалізація значень гри
let score = 0;
let energy = 1000;
let userId = window.Telegram.WebApp.initDataUnsafe.user.id; // Отримуємо user_id з Telegram

// Функція для отримання початкових даних від API
async function fetchUserData() {
    try {
        let response = await fetch(`http://localhost:5000/user/${userId}`);
        if (response.ok) {
            let userData = await response.json();
            score = userData.score;
            energy = userData.energy;
            updateStats();
        } else {
            console.error("Error fetching user data:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Логіка гри
document.getElementById('tapImage').onclick = async function() {
    if (energy > 0) {
        score += 1;
        energy -= 1;
        updateStats();

        // Надсилання нових даних до API
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
                console.error("Error updating user data:", response.statusText);
            }
        } catch (error) {
            console.error("Error updating user data:", error);
        }
        
        // Додавання ефекту легкого блюру при натисканні
        this.classList.add('blur');
        setTimeout(() => this.classList.remove('blur'), 100);
    } else {
        alert('No energy left! Come back tomorrow.');
    }
};

// Функція для оновлення статистики на екрані
function updateStats() {
    document.getElementById('score').innerText = 'Score: ' + score;
    document.getElementById('energy').innerText = 'Energy: ' + energy;
}

// Встановлення колірної схеми відповідно до налаштувань Telegram
window.Telegram.WebApp.expand();
document.body.style.backgroundColor = window.Telegram.WebApp.themeParams.bg_color || '#ffffff';

// Виклик функції отримання даних при завантаженні сторінки
fetchUserData();
