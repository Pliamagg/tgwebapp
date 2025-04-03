

// Ініціалізація Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Встановлення колірної схеми відповідно до налаштувань Telegram
document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
document.body.style.color = tg.themeParams.text_color || '#000000';

// Дані користувача
let currentUser = tg.initDataUnsafe?.user || {
    id: 12345678,
    first_name: "Тестовий",
    last_name: "Користувач", 
    username: "test_user"
};

// Віртуальний баланс для тестування
let starsBalance = 500; // В реальному додатку це має отримуватись із Telegram API

// Дані для обміну
let myItems = [];
let activeTrades = [];
let tradeHistory = [];
let currentTradeId = null;

// Елементи інтерфейсу
const sections = {
    mainMenu: document.getElementById('main-menu'),
    createTrade: document.getElementById('create-trade'),
    activeTrades: document.getElementById('active-trades'),
    tradeDetails: document.getElementById('trade-details'),
    tradeHistory: document.getElementById('trade-history')
};

// Ініціалізація
function init() {
    // Відображення інформації про користувача
    updateUserInfo();
    
    // Додавання тестових даних (для демонстрації)
    setupDemoData();
    
    // Налаштування обробників подій
    setupEventListeners();
}

// Оновлення інформації про користувача
function updateUserInfo() {
    const username = currentUser.username || `${currentUser.first_name} ${currentUser.last_name || ''}`;
    document.getElementById('username').innerText = `Користувач: ${username}`;
    document.getElementById('balance').innerText = `Баланс Stars: ${starsBalance}`;
}

// Додавання демонстраційних даних
function setupDemoData() {
    // Приклади активних обмінів
    activeTrades = [
        {
            id: 1,
            senderId: 87654321,
            senderName: "Alice",
            receiverId: currentUser.id,
            items: [
                { name: "Квіти", description: "Букет троянд" },
                { name: "Шоколад", description: "Коробка бельгійського шоколаду" }
            ],
            counterOffer: [],
            status: "pending"
        },
        {
            id: 2,
            senderId: currentUser.id,
            senderName: currentUser.username || currentUser.first_name,
            receiverId: 55443322,
            receiverName: "Bob",
            items: [
                { name: "Книга", description: "Підручник з програмування" }
            ],
            counterOffer: [
                { name: "Настільна гра", description: "Стратегічна гра" }
            ],
            status: "waiting_confirmation"
        }
    ];
    
    // Приклади історії обмінів
    tradeHistory = [
        {
            id: 101,
            senderId: currentUser.id,
            senderName: currentUser.username || currentUser.first_name,
            receiverId: 11223344,
            receiverName: "Carol",
            items: [{ name: "Квиток", description: "Квиток на концерт" }],
            counterOffer: [{ name: "Сувенір", description: "Сувенір із подорожі" }],
            status: "completed",
            completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    // Відображення всіх даних
    renderTradesList();
    renderHistoryList();
}

// Налаштування обробників подій
function setupEventListeners() {
    // Кнопки головного меню
    document.getElementById('createTradeBtn').addEventListener('click', () => showSection('createTrade'));
    document.getElementById('activeTradesBtn').addEventListener('click', () => showSection('activeTrades'));
    document.getElementById('historyBtn').addEventListener('click', () => showSection('tradeHistory'));
    
    // Кнопки навігації "Назад"
    document.getElementById('backFromCreateBtn').addEventListener('click', () => showSection('mainMenu'));
    document.getElementById('backFromActiveBtn').addEventListener('click', () => showSection('mainMenu'));
    document.getElementById('backFromDetailsBtn').addEventListener('click', () => showSection('activeTrades'));
    document.getElementById('backFromHistoryBtn').addEventListener('click', () => showSection('mainMenu'));
    
    // Функціональні кнопки
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    document.getElementById('createOfferBtn').addEventListener('click', createOffer);
    document.getElementById('addCounterItemBtn').addEventListener('click', addCounterItem);
    document.getElementById('confirmTradeBtn').addEventListener('click', confirmTrade);
    document.getElementById('cancelTradeBtn').addEventListener('click', cancelTrade);
}

// Перемикання між розділами
function showSection(sectionName) {
    Object.keys(sections).forEach(key => {
        sections[key].classList.remove('active');
    });
    sections[sectionName].classList.add('active');
    
    // Якщо переходимо на сторінку активних обмінів, оновлюємо список
    if (sectionName === 'activeTrades') {
        renderTradesList();
    } else if (sectionName === 'tradeHistory') {
        renderHistoryList();
    }
}

// Додавання нового предмету
function addItem() {
    const itemName = document.getElementById('itemName').value.trim();
    const itemDescription = document.getElementById('itemDescription').value.trim();
    
    if (!itemName) {
        showNotification('Введіть назву подарунка');
        return;
    }
    
    myItems.push({
        name: itemName,
        description: itemDescription
    });
    
    // Очищення полів введення
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    
    // Оновлення списку предметів
    renderMyItems();
}

// Відображення списку предметів користувача
function renderMyItems() {
    const container = document.getElementById('myItems');
    container.innerHTML = '';
    
    if (myItems.length === 0) {
        container.innerHTML = '<p>Додайте подарунки для обміну</p>';
        return;
    }
    
    myItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <div class="item-name">${item.name}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
            <button class="remove-item" data-index="${index}">✕</button>
        `;
        container.appendChild(itemElement);
    });
    
    // Додавання обробників для кнопок видалення
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            myItems.splice(index, 1);
            renderMyItems();
        });
    });
}

// Створення нової пропозиції обміну
function createOffer() {
    if (myItems.length === 0) {
        showNotification('Додайте хоча б один подарунок');
        return;
    }
    
    // Діалог для вибору отримувача (в реальному додатку це може бути список контактів)
    const receiverId = 87654321; // Заглушка
    const receiverName = "Користувач"; // Заглушка
    
    // Створення нового обміну
    const newTrade = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.username || currentUser.first_name,
        receiverId: receiverId,
        receiverName: receiverName,
        items: [...myItems],
        counterOffer: [],
        status: "pending"
    };
    
    activeTrades.push(newTrade);
    
    // Очищення списку предметів
    myItems = [];
    renderMyItems();
    
    showNotification('Пропозицію обміну створено');
    showSection('mainMenu');
}

// Відображення списку активних обмінів
function renderTradesList() {
    const container = document.getElementById('tradesList');
    container.innerHTML = '';
    
    if (activeTrades.length === 0) {
        container.innerHTML = '<p>Немає активних обмінів</p>';
        return;
    }
    
    activeTrades.forEach(trade => {
        const isInitiator = trade.senderId === currentUser.id;
        const otherUser = isInitiator ? trade.receiverName : trade.senderName;
        
        const tradeElement = document.createElement('div');
        tradeElement.className = 'trade-item';
        tradeElement.setAttribute('data-trade-id', trade.id);
        
        let statusText = '';
        switch (trade.status) {
            case 'pending':
                statusText = isInitiator ? 'Очікує відповіді' : 'Нова пропозиція';
                break;
            case 'waiting_confirmation':
                statusText = 'Очікує підтвердження';
                break;
            case 'confirmed_by_sender':
                statusText = isInitiator ? 'Ви підтвердили' : 'Відправник підтвердив';
                break;
            case 'confirmed_by_receiver':
                statusText = isInitiator ? 'Отримувач підтвердив' : 'Ви підтвердили';
                break;
        }
        
        tradeElement.innerHTML = `
            <div><strong>${isInitiator ? 'До' : 'Від'}: ${otherUser}</strong></div>
            <div>Предмети: ${trade.items.length}</div>
            <div>Статус: ${statusText}</div>
        `;
        
        tradeElement.addEventListener('click', () => openTradeDetails(trade.id));
        container.appendChild(tradeElement);
    });
}

// Відображення списку історії обмінів
function renderHistoryList() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    if (tradeHistory.length === 0) {
        container.innerHTML = '<p>Історія обмінів порожня</p>';
        return;
    }
    
    tradeHistory.forEach(trade => {
        const isInitiator = trade.senderId === currentUser.id;
        const otherUser = isInitiator ? trade.receiverName : trade.senderName;
        
        const historyElement = document.createElement('div');
        historyElement.className = `trade-item trade-history-item ${trade.status === 'completed' ? 'completed-trade' : 'canceled-trade'}`;
        
        historyElement.innerHTML = `
            <div><strong>${isInitiator ? 'До' : 'Від'}: ${otherUser}</strong></div>
            <div>Предмети: ${trade.items.length} ⟷ ${trade.counterOffer.length}</div>
            <div>Статус: ${trade.status === 'completed' ? 'Завершено' : 'Скасовано'}</div>
            <div>Дата: ${new Date(trade.completedAt).toLocaleDateString()}</div>
        `;
        
        container.appendChild(historyElement);
    });
}

// Відкриття деталей обміну
function openTradeDetails(tradeId) {
    currentTradeId = tradeId;
    const trade = activeTrades.find(t => t.id === tradeId);
    
    if (!trade) {
        showNotification('Обмін не знайдено');
        return;
    }
    
    const isInitiator = trade.senderId === currentUser.id;
    
    // Відображення предметів відправника
    const senderItemsList = document.getElementById('senderItemsList');
    senderItemsList.innerHTML = '';
    
    trade.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <div class="item-name">${item.name}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
        `;
        senderItemsList.appendChild(itemElement);
    });
    
    // Відображення предметів отримувача (контр-пропозиція)
    const receiverItemsList = document.getElementById('receiverItemsList');
    receiverItemsList.innerHTML = '';
    
    if (trade.counterOffer.length > 0) {
        trade.counterOffer.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                ${isInitiator ? '' : `<button class="remove-item" data-index="${index}">✕</button>`}
            `;
            receiverItemsList.appendChild(itemElement);
        });
        
        // Додавання обробників для кнопок видалення (тільки для отримувача)
        if (!isInitiator) {
            document.querySelectorAll('#receiverItemsList .remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    trade.counterOffer.splice(index, 1);
                    openTradeDetails(tradeId); // Оновлення відображення
                });
            });
        }
    } else {
        receiverItemsList.innerHTML = '<p>Немає предметів у відповідь</p>';
    }
    
    // Контроль видимості блоку додавання контр-пропозиції
    const counterOfferBlock = document.getElementById('counterOffer');
    counterOfferBlock.style.display = isInitiator ? 'none' : 'block';
    
    // Оновлення стану кнопки підтвердження
    const confirmBtn = document.getElementById('confirmTradeBtn');
    let canConfirm = false;
    
    if (isInitiator) {
        // Для відправника - може підтвердити, якщо є контр-пропозиція
        canConfirm = trade.counterOffer.length > 0 && 
                    (trade.status === 'waiting_confirmation' || trade.status === 'confirmed_by_receiver');
    } else {
        // Для отримувача - може підтвердити, якщо додав контр-пропозицію
        canConfirm = trade.counterOffer.length > 0 && 
                    (trade.status === 'pending' || trade.status === 'confirmed_by_sender');
    }
    
    // Перевірка балансу Stars
    if (canConfirm && starsBalance < 35) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Недостатньо Stars';
    } else {
        confirmBtn.disabled = !canConfirm;
        confirmBtn.textContent = 'Підтвердити (35 Stars)';
    }
    
    showSection('tradeDetails');
}

// Додавання предмету до контр-пропозиції
function addCounterItem() {
    if (!currentTradeId) return;
    
    const trade = activeTrades.find(t => t.id === currentTradeId);
    if (!trade || trade.senderId === currentUser.id) return;
    
    const itemName = document.getElementById('counterItemName').value.trim();
    const itemDescription = document.getElementById('counterItemDescription').value.trim();
    
    if (!itemName) {
        showNotification('Введіть назву подарунка');
        return;
    }
    
    trade.counterOffer.push({
        name: itemName,
        description: itemDescription
    });
    
    // Зміна статусу на "очікує підтвердження"
    trade.status = 'waiting_confirmation';
    
    // Очищення полів введення
    document.getElementById('counterItemName').value = '';
    document.getElementById('counterItemDescription').value = '';
    
    // Оновлення відображення
    openTradeDetails(currentTradeId);
}

// Підтвердження обміну
function confirmTrade() {
    if (!currentTradeId) return;
    
    const trade = activeTrades.find(t => t.id === currentTradeId);
    if (!trade) return;
    
    // Перевірка балансу Stars
    if (starsBalance < 35) {
        showNotification('Недостатньо Stars для підтвердження обміну');
        return;
    }
    
    const isInitiator = trade.senderId === currentUser.id;
    
    // Оновлення статусу обміну
    if (isInitiator) {
        trade.status = trade.status === 'confirmed_by_receiver' ? 'completed' : 'confirmed_by_sender';
    } else {
        trade.status = trade.status === 'confirmed_by_sender' ? 'completed' : 'confirmed_by_receiver';
    }
    
    // Списання Stars
    starsBalance -= 35;
    updateUserInfo();
    
    // Перевірка, чи завершено обмін
    if (trade.status === 'completed') {
        // Імітація звернення до Telegram Stars API для перевірки та обробки платежів
        
        // Додавання обміну до історії
        tradeHistory.push({
            ...trade,
            completedAt: new Date().toISOString()
        });
        
        // Видалення з активних обмінів
        activeTrades = activeTrades.filter(t => t.id !== currentTradeId);
        
        showNotification('Обмін успішно завершено!');
        showSection('mainMenu');
    } else {
        showNotification('Ваше підтвердження обміну прийнято');
        openTradeDetails(currentTradeId);
    }
}

// Скасування обміну
function cancelTrade() {
    if (!currentTradeId) return;
    
    const trade = activeTrades.find(t => t.id === currentTradeId);
    if (!trade) return;
    
    // Додавання до історії зі статусом "скасовано"
    tradeHistory.push({
        ...trade,
        status: 'canceled',
        completedAt: new Date().toISOString()
    });
    
    // Видалення з активних обмінів
    activeTrades = activeTrades.filter(t => t.id !== currentTradeId);
    
    showNotification('Обмін скасовано');
    showSection('activeTrades');
}

// Відображення повідомлення
function showNotification(message) {
    // В реальному додатку може використовуватися Telegram Mini Apps API
    // для нативних повідомлень або спливаючих вікон
    alert(message);
}

// Запуск додатку
init();
