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

// Вибраний отримувач для обміну
let selectedReceiver = null;

// Віртуальний баланс для тестування
let starsBalance = 500; // В реальному додатку це має отримуватись із Telegram API

// Дані для обміну
let myItems = [];
let activeTrades = [];
let tradeHistory = [];
let currentTradeId = null;

// Тестові дані контактів (використовуються тільки якщо не вдалося отримати справжні контакти)
let contacts = [
    { id: 87654321, first_name: "Alice", last_name: "Smith", username: "alice_s" },
    { id: 55443322, first_name: "Bob", last_name: "Johnson", username: "bob_j" },
    { id: 11223344, first_name: "Carol", last_name: "Williams", username: "carol_w" },
    { id: 99887766, first_name: "Dave", last_name: "Brown", username: "dave_b" },
    { id: 12312312, first_name: "Eve", last_name: "Davis", username: "eve_d" }
];

// Тестовий список подарунків користувача
let myGifts = [
    { id: 1, name: "Книга", description: "Роман 'Майстер і Маргарита'" },
    { id: 2, name: "Футболка", description: "Футболка з логотипом Telegram" },
    { id: 3, name: "Квитки", description: "Квитки на концерт" },
    { id: 4, name: "Сертифікат", description: "Подарунковий сертифікат на 500 грн" },
    { id: 5, name: "Іграшка", description: "М'яка іграшка - панда" }
];

// Елементи інтерфейсу
const sections = {
    mainMenu: document.getElementById('main-menu'),
    createTrade: document.getElementById('create-trade'),
    activeTrades: document.getElementById('active-trades'),
    tradeDetails: document.getElementById('trade-details'),
    tradeHistory: document.getElementById('trade-history'),
    selectContact: document.getElementById('select-contact')
};

// Поточний обраний розділ (для повернення після вибору контакту/подарунку)
let previousSection = 'mainMenu';
let contactSelectMode = 'create'; // 'create' або 'counter'

// Ініціалізація
function init() {
    // Відображення інформації про користувача
    updateUserInfo();
    
    // Додавання тестових даних (для демонстрації)
    setupDemoData();
    
    // Налаштування обробників подій
    setupEventListeners();
    
    // Налаштування MainButton Telegram
    setupMainButton();
}

// Налаштування MainButton Telegram
function setupMainButton() {
    if (!tg.MainButton) return; // На випадок, якщо відсутній MainButton
    
    tg.MainButton.setText('Створити обмін');
    tg.MainButton.onClick(() => {
        showSection('createTrade');
        updateMainButton();
    });
    tg.MainButton.show();
}

// Оновлення тексту та видимості MainButton на основі поточного розділу
function updateMainButton() {
    if (!tg.MainButton) return;
    
    const activeSection = Object.keys(sections).find(key => 
        sections[key].classList.contains('active')
    );
    
    switch (activeSection) {
        case 'mainMenu':
            tg.MainButton.setText('Створити обмін');
            tg.MainButton.show();
            break;
        case 'createTrade':
            if (myItems.length > 0 && selectedReceiver) {
                tg.MainButton.setText('Створити пропозицію');
                tg.MainButton.onClick(() => createOffer());
                tg.MainButton.show();
            } else {
                tg.MainButton.hide();
            }
            break;
        case 'tradeDetails':
            const tradeButton = document.getElementById('confirmTradeBtn');
            if (tradeButton && !tradeButton.disabled) {
                tg.MainButton.setText('Підтвердити (35 Stars)');
                tg.MainButton.onClick(() => confirmTrade());
                tg.MainButton.show();
            } else {
                tg.MainButton.hide();
            }
            break;
        default:
            tg.MainButton.hide();
    }
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
    document.getElementById('backFromContactsBtn').addEventListener('click', () => showSection(previousSection));
    
    // Кнопки вибору контактів і подарунків
    document.getElementById('selectContactBtn').addEventListener('click', () => {
        // В новій версії Telegram API контакти вибираються через вбудовану функцію
        selectContactWithTelegramAPI();
    });
    
    document.getElementById('selectItemBtn').addEventListener('click', () => selectGiftWithTelegramAPI('create'));
    document.getElementById('selectCounterItemBtn').addEventListener('click', () => selectGiftWithTelegramAPI('counter'));
    
    // Пошук контактів
    document.getElementById('contactSearch').addEventListener('input', filterContacts);
    
    // Функціональні кнопки
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    document.getElementById('createOfferBtn').addEventListener('click', createOffer);
    document.getElementById('addCounterItemBtn').addEventListener('click', addCounterItem);
    document.getElementById('confirmTradeBtn').addEventListener('click', confirmTrade);
    document.getElementById('cancelTradeBtn').addEventListener('click', cancelTrade);
    
    // Обробник для back-кнопки Telegram
    tg.BackButton.onClick(() => {
        const activeSection = Object.keys(sections).find(key => 
            sections[key].classList.contains('active')
        );
        
        switch (activeSection) {
            case 'createTrade':
            case 'activeTrades':
            case 'tradeHistory':
                showSection('mainMenu');
                break;
            case 'tradeDetails':
                showSection('activeTrades');
                break;
            case 'selectContact':
                showSection(previousSection);
                break;
            default:
                // Якщо ми в головному меню, закриваємо додаток
                tg.close();
        }
    });
}

// Перемикання між розділами
function showSection(sectionName) {
    Object.keys(sections).forEach(key => {
        sections[key].classList.remove('active');
    });
    sections[sectionName].classList.add('active');
    
    // Керування кнопкою "Назад" Telegram
    if (sectionName === 'mainMenu') {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
    }
    
    // Якщо переходимо на сторінку активних обмінів, оновлюємо список
    if (sectionName === 'activeTrades') {
        renderTradesList();
    } else if (sectionName === 'tradeHistory') {
        renderHistoryList();
    } else if (sectionName === 'createTrade') {
        renderMyItems();
        updateReceiverInfo();
    }
    
    // Оновлюємо головну кнопку відповідно до поточного розділу
    updateMainButton();
}

// Вибір контакту через Telegram API
function selectContactWithTelegramAPI() {
    // Перевірка на наявність WebApp
    if (!tg) {
        showNotification('Telegram WebApp API недоступний');
        showContactsList(); // Використання локального списку як запасний варіант
        return;
    }
    
    try {
        // Спроба використати вбудовану функцію Telegram для вибору контакту
        if (tg.showScanQrPopup) {
            // Використовуємо вбудований QR-сканер для додавання контакту
            tg.showScanQrPopup({
                text: 'Відскануйте QR код контакту для обміну'
            }, function(qrText) {
                // Обробка отриманого тексту QR коду
                // Тут ми повинні розібрати дані користувача з QR
                try {
                    const contactData = JSON.parse(qrText);
                    if (contactData && contactData.id) {
                        selectContact(contactData);
                    } else {
                        showNotification('Неправильний формат QR коду');
                        showContactsList();
                    }
                } catch {
                    showNotification('Не вдалося розпізнати QR код');
                    showContactsList();
                }
            });
        } else {
            // Якщо функція сканування QR недоступна, показуємо локальний список
            showContactsList();
        }
    } catch (error) {
        console.error('Помилка при виборі контакту:', error);
        showContactsList(); // Запасний варіант
    }
}

// Вибір подарунку через Telegram API
function selectGiftWithTelegramAPI(mode) {
    try {
        // Спроба використати нативний інтерфейс Telegram
        if (tg.showPopup) {
            // Список для вибору
            const items = myGifts.map((gift, index) => ({
                id: gift.id.toString(),
                title: gift.name,
                subtitle: gift.description
            }));
            
            // Використання вбудованого меню для вибору подарунку
            tg.showPopup({
                title: 'Виберіть подарунок',
                message: 'Оберіть один з ваших подарунків для обміну',
                buttons: [
                    {type: 'default', id: 'select', text: 'Вибрати'},
                    {type: 'cancel', id: 'cancel', text: 'Скасувати'}
                ]
            }, function(buttonId) {
                if (buttonId === 'select') {
                    // Імітуємо вибір подарунка через інтерфейс
                    showGiftSelectionMenu(mode);
                }
            });
        } else {
            // Якщо вбудований інтерфейс недоступний, показуємо простий діалог
            showGiftSelectionMenu(mode);
        }
    } catch (error) {
        console.error('Помилка при виборі подарунка:', error);
        showGiftSelectionMenu(mode); // Запасний варіант
    }
}

// Показ меню вибору подарунків (запасний варіант)
function showGiftSelectionMenu(mode) {
    // Створюємо інтерфейс для вибору подарунка
    const giftSelectContainer = document.createElement('div');
    giftSelectContainer.className = 'gift-selection-popup';
    giftSelectContainer.innerHTML = `
        <div class="gift-popup-header">
            <h3>Виберіть подарунок</h3>
            <button class="close-popup">&times;</button>
        </div>
        <div class="gift-list"></div>
    `;
    
    document.body.appendChild(giftSelectContainer);
    
    // Додаємо подарунки до списку
    const giftList = giftSelectContainer.querySelector('.gift-list');
    myGifts.forEach(gift => {
        const giftElement = document.createElement('div');
        giftElement.className = 'gift-item';
        giftElement.innerHTML = `
            <div class="gift-name">${gift.name}</div>
            <div class="gift-desc">${gift.description}</div>
        `;
        giftElement.addEventListener('click', () => {
            // При виборі подарунка заповнюємо форму та закриваємо меню
            if (mode === 'create') {
                document.getElementById('itemName').value = gift.name;
                document.getElementById('itemDescription').value = gift.description;
            } else if (mode === 'counter') {
                document.getElementById('counterItemName').value = gift.name;
                document.getElementById('counterItemDescription').value = gift.description;
            }
            document.body.removeChild(giftSelectContainer);
        });
        giftList.appendChild(giftElement);
    });
    
    // Обробник для закриття меню
    giftSelectContainer.querySelector('.close-popup').addEventListener('click', () => {
        document.body.removeChild(giftSelectContainer);
    });
    
    // Додаємо стилі для спливаючого меню
    const style = document.createElement('style');
    style.textContent = `
        .gift-selection-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 350px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            overflow: hidden;
        }
        .gift-popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
        }
        .gift-popup-header h3 {
            margin: 0;
        }
        .close-popup {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        }
        .gift-list {
            max-height: 400px;
            overflow-y: auto;
            padding: 8px 0;
        }
        .gift-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f5f5f5;
            cursor: pointer;
        }
        .gift-item:hover {
            background-color: #f8f8f8;
        }
        .gift-name {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .gift-desc {
            font-size: 14px;
            color: #666;
        }
    `;
    document.head.appendChild(style);
}

// Показ списку контактів для вибору
function showContactsList() {
    renderContactsList();
    showSection('selectContact');
}

// Відображення списку контактів
function renderContactsList() {
    const container = document.getElementById('contactsList');
    container.innerHTML = '';
    
    // Очищення поля пошуку при відображенні
    document.getElementById('contactSearch').value = '';
    
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.setAttribute('data-contact-id', contact.id);
        
        // Створення аватара з ініціалами
        const initials = (contact.first_name.charAt(0) + (contact.last_name ? contact.last_name.charAt(0) : '')).toUpperCase();
        
        contactElement.innerHTML = `
            <div class="contact-avatar">${initials}</div>
            <div class="contact-details">
                <div class="contact-name">${contact.first_name} ${contact.last_name || ''}</div>
                ${contact.username ? `<div>@${contact.username}</div>` : ''}
            </div>
        `;
        
        contactElement.addEventListener('click', () => selectContact(contact));
        container.appendChild(contactElement);
    });
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
    if (!selectedReceiver) {
        showNotification('Виберіть отримувача обміну');
        return;
    }
    
    if (myItems.length === 0) {
        showNotification('Додайте хоча б один подарунок');
        return;
    }
    
    // Створення нового обміну
    const newTrade = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.username || currentUser.first_name,
        receiverId: selectedReceiver.id,
        receiverName: selectedReceiver.username || `${selectedReceiver.first_name} ${selectedReceiver.last_name || ''}`,
        items: [...myItems],
        counterOffer: [],
        status: "pending"
    };
    
    activeTrades.push(newTrade);
    
    // Очищення списку предметів і скидання отримувача
    myItems = [];
    selectedReceiver = null;
    renderMyItems();
    updateReceiverInfo();
    
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

// Пошук/фільтрація контактів
function filterContacts() {
    const searchQuery = document.getElementById('contactSearch').value.toLowerCase();
    const contactElements = document.querySelectorAll('.contact-item');
    
    contactElements.forEach(element => {
        const contactName = element.querySelector('.contact-name').innerText.toLowerCase();
        const username = element.querySelector('.contact-details div:nth-child(2)')?.innerText.toLowerCase() || '';
        
        if (contactName.includes(searchQuery) || username.includes(searchQuery)) {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    });
}

// Вибір контакту
function selectContact(contact) {
    selectedReceiver = contact;
    updateReceiverInfo();
    showSection(previousSection);
}

// Оновлення інформації про вибраного отримувача
function updateReceiverInfo() {
    const selectedReceiverElement = document.getElementById('selectedReceiver');
    
    if (selectedReceiver) {
        selectedReceiverElement.innerText = `Отримувач: ${selectedReceiver.first_name} ${selectedReceiver.last_name || ''} ${selectedReceiver.username ? `(@${selectedReceiver.username})` : ''}`;
        selectedReceiverElement.style.display = 'block';
    } else {
        selectedReceiverElement.style.display = 'none';
    }
}

// Запуск додатку
init();
