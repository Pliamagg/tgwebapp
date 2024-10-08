window.onload = function() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    
    // Мінімальна затримка в 5 секунд
    setTimeout(() => {
        loadingScreen.classList.add('hidden');  // Додаємо клас для плавного зникання
        setTimeout(() => {
            loadingScreen.style.display = 'none';  // Повністю приховуємо екран після завершення анімації
            mainContent.style.display = 'block';   // Відображаємо основний контент
        }, 500);  // Затримка на тривалість анімації (0.5 сек)
    }, 5000);  // 5000 мілісекунд = 5 секунд
};

// Ініціалізація значень гри
let score = 0;
let energy = 1000;
const tg = window.Telegram.WebApp;  // Ініціалізація Telegram SDK
tg.ready();  // WebApp готовий до роботи
let userId = tg.initDataUnsafe?.user?.id || null;  // Отримуємо user_id з Telegram
let firstName = tg.initDataUnsafe?.user?.first_name || '';  // Ім'я користувача
let lastName = tg.initDataUnsafe?.user?.last_name || '';  // Прізвище користувача
let fullName = `${firstName} ${lastName}`;  // Повне ім'я
let username = tg.initDataUnsafe?.user?.username || '';  // Нікнейм
let photoUrl = tg.initDataUnsafe?.user?.photo_url || 'images/default-avatar.png';  // Фото профілю користувача
// Виводимо дані у консоль для перевірки
console.log('User ID:', userId);
console.log('Full Name:', fullName);
console.log('Username:', username);
console.log('Photo URL:', photoUrl);

// Відображення цих даних на сторінці
if (userId) {
    document.getElementById('avatar').src = photoUrl;  // Встановлюємо аватар
    document.getElementById('userFullName').innerText = fullName;  // Встановлюємо повне ім'я
} else {
    alert("Користувача не знайдено. Перезапустіть додаток.");
}

// Якщо користувач є, ініціалізуємо його дані
if (!userId) {
    alert("Користувача не знайдено. Перезапустіть додаток.");
} else {
    const user = tg.initDataUnsafe.user;
    const nickname = user.username || `${user.first_name} ${user.last_name}`;
    document.getElementById('nickname').innerText = `Player: ${nickname}`;
}
// Перевірка даних користувача з Telegram
console.log(tg.initDataUnsafe.user);


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
    fetchReferralLink();
    fetchReferrals();
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

// Завантаження аватару користувача та його інформації
if (user) {
    document.getElementById('avatar').src = user.photo_url || 'images/default-avatar.png';
    document.getElementById('userFullName').innerText = `${user.first_name} ${user.last_name}`;
}

// Функція отримання реферального посилання
async function fetchReferralLink() {
    try {
        let response = await fetch(`http://localhost:5000/referral-link/${userId}`);
        if (response.ok) {
            let data = await response.json();
            document.getElementById('referralLink').innerText = data.referral_link;
        } else {
            console.error("Error fetching referral link:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching referral link:", error);
    }
}

// Функція копіювання реферального посилання
function copyReferralLink() {
    const referralLink = document.getElementById('referralLink').innerText;
    navigator.clipboard.writeText(referralLink).then(() => {
        alert('Referral link copied to clipboard');
    });
}

// Функція отримання списку рефералів
async function fetchReferrals() {
    try {
        let response = await fetch(`http://localhost:5000/referrals/${userId}`);
        if (response.ok) {
            let referrals = await response.json();
            updateReferralsList(referrals);
        } else {
            console.error("Error fetching referrals:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching referrals:", error);
    }
}

// Оновлення списку рефералів на сторінці
function updateReferralsList(referrals) {
    const referralList = document.getElementById('referralList');
    referralList.innerHTML = '';  // Очищуємо поточний список

    referrals.forEach((referral, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${referral.name}: ${referral.points} points`;
        referralList.appendChild(listItem);
    });
}
