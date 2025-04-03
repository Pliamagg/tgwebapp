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
        // Намагаємось використати новітній API для вибору контактів із Telegram
        if (tg.requestContact) {
            tg.requestContact(function(contact) {
                if (contact) {
                    // Передаємо дані контакту до функції вибору
                    selectContact({
                        id: contact.userId || contact.id,
                        first_name: contact.firstName || contact.first_name,
                        last_name: contact.lastName || contact.last_name,
                        username: contact.username
                    });
                } else {
                    showNotification('Контакт не вибрано');
                    showContactsList();
                }
            });
        } else if (tg.contacts && typeof tg.contacts.get === 'function') {
            // Альтернативний метод отримання контактів
            tg.contacts.get(function(contacts) {
                if (contacts && contacts.length > 0) {
                    // Відображаємо модальне вікно зі списком контактів
                    showCustomContactsList(contacts);
                } else {
                    showNotification('Не вдалося отримати контакти');
                    showContactsList();
                }
            });
        } else {
            // Якщо API для контактів недоступне, переходимо до запасного варіанту
            showNotification('API Telegram для контактів недоступне. Використовуємо тестовий список.');
            showContactsList();
        }
    } catch (error) {
        console.error('Помилка при виборі контакту:', error);
        showContactsList(); // Запасний варіант
    }
}

// Вибір NFT-подарунку через Telegram API
function selectGiftWithTelegramAPI(mode) {
    try {
        // Перевіряємо наявність NFT API в Telegram
        if (tg.collectibles && typeof tg.collectibles.get === 'function') {
            // Отримуємо колекційні NFT від Telegram
            tg.collectibles.get(function(collectibles) {
                if (collectibles && collectibles.length > 0) {
                    // Показуємо вікно вибору NFT
                    showNFTSelectionMenu(collectibles, mode);
                } else {
                    showNotification('У вас немає NFT подарунків для обміну');
                    // В якості запасного варіанту показуємо базове меню
                    showBasicGiftSelectionMenu(mode);
                }
            });
        } else if (tg.showPopup) {
            // Показуємо нативне вікно з повідомленням про NFT
            tg.showPopup({
                title: 'NFT Подарунки',
                message: 'Для обміну NFT подарунками потрібно оновити Telegram до останньої версії.',
                buttons: [
                    {type: 'default', id: 'ok', text: 'Зрозуміло'}
                ]
            });
            // Показуємо базове меню вибору
            showBasicGiftSelectionMenu(mode);
        } else {
            // Показуємо базове меню вибору
            showBasicGiftSelectionMenu(mode);
        }
    } catch (error) {
        console.error('Помилка при виборі подарунка:', error);
        showBasicGiftSelectionMenu(mode); // Запасний варіант
    }
}

// Показ меню вибору NFT подарунків
function showNFTSelectionMenu(collectibles, mode) {
    // Створюємо інтерфейс для вибору NFT подарунка
    const giftSelectContainer = document.createElement('div');
    giftSelectContainer.className = 'gift-selection-popup nft-selection';
    giftSelectContainer.innerHTML = `
        <div class="gift-popup-header">
            <h3>Виберіть NFT подарунок</h3>
            <button class="close-popup">&times;</button>
        </div>
        <div class="gift-list nft-list"></div>
    `;
    
    document.body.appendChild(giftSelectContainer);
    
    // Додаємо NFT до списку
    const giftList = giftSelectContainer.querySelector('.nft-list');
    collectibles.forEach(nft => {
        const nftElement = document.createElement('div');
        nftElement.className = 'nft-item';
        
        // Отримуємо дані NFT
        const nftName = nft.title || nft.name || 'NFT Подарунок';
        const nftDesc = nft.description || 'Колекційний NFT подарунок';
        const nftImage = nft.imageUrl || nft.thumbnail || '';
        const nftId = nft.id || nft.uniqueId || Date.now().toString();
        
        nftElement.innerHTML = `
            <div class="nft-image">${nftImage ? `<img src="${nftImage}" alt="${nftName}">` : '<div class="nft-placeholder">NFT</div>'}</div>
            <div class="nft-info">
                <div class="nft-name">${nftName}</div>
                <div class="nft-desc">${nftDesc}</div>
            </div>
        `;
        
        nftElement.addEventListener('click', () => {
            // При виборі NFT подарунка заповнюємо форму та закриваємо меню
            if (mode === 'create') {
                document.getElementById('itemName').value = nftName;
                document.getElementById('itemDescription').value = nftDesc;
                // Додаємо ідентифікатор NFT як прихований параметр
                addNFTToExchange(nftId, nftName, nftDesc, nftImage);
            } else if (mode === 'counter') {
                document.getElementById('counterItemName').value = nftName;
                document.getElementById('counterItemDescription').value = nftDesc;
                // Додаємо ідентифікатор NFT як прихований параметр
                addCounterNFT(nftId, nftName, nftDesc, nftImage);
            }
            document.body.removeChild(giftSelectContainer);
        });
        
        giftList.appendChild(nftElement);
    });
    
    // Обробник для закриття меню
    giftSelectContainer.querySelector('.close-popup').addEventListener('click', () => {
        document.body.removeChild(giftSelectContainer);
    });
    
    // Додаємо стилі для NFT вікна
    const style = document.createElement('style');
    style.textContent = `
        .nft-selection {
            max-width: 400px;
        }
        .nft-list {
            max-height: 450px;
        }
        .nft-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f5f5f5);
            cursor: pointer;
        }
        .nft-item:hover {
            background-color: var(--tg-theme-secondary-bg-color, #f8f8f8);
        }
        .nft-image {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 12px;
            background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .nft-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .nft-placeholder {
            font-weight: bold;
            color: var(--tg-theme-hint-color, #999);
        }
        .nft-info {
            flex: 1;
        }
        .nft-name {
            font-weight: bold;
            margin-bottom: 4px;
        }
        .nft-desc {
            font-size: 14px;
            color: var(--tg-theme-hint-color, #666);
        }
    `;
    document.head.appendChild(style);
}

// Додавання NFT до обміну
function addNFTToExchange(nftId, name, description, imageUrl) {
    myItems.push({
        name: name,
        description: description,
        nftId: nftId,
        imageUrl: imageUrl,
        isNFT: true
    });
    
    // Оновлюємо список предметів
    renderMyItems();
}

// Додавання NFT до контр-пропозиції
function addCounterNFT(nftId, name, description, imageUrl) {
    if (!currentTradeId) return;
    
    const trade = activeTrades.find(t => t.id === currentTradeId);
    if (!trade || trade.senderId === currentUser.id) return;
    
    trade.counterOffer.push({
        name: name,
        description: description,
        nftId: nftId,
        imageUrl: imageUrl,
        isNFT: true
    });
    
    // Зміна статусу на "очікує підтвердження"
    trade.status = 'waiting_confirmation';
    
    // Оновлення відображення
    openTradeDetails(currentTradeId);
}

// Показ базового меню вибору подарунків (запасний варіант)
function showBasicGiftSelectionMenu(mode) {
    // Створюємо вікно для пояснення про NFT
    const giftSelectContainer = document.createElement('div');
    giftSelectContainer.className = 'gift-selection-popup';
    giftSelectContainer.innerHTML = `
        <div class="gift-popup-header">
            <h3>Подарунки Telegram</h3>
            <button class="close-popup">&times;</button>
        </div>
        <div class="nft-explanation">
            <p>Для обміну використовуються NFT подарунки Telegram - унікальні цифрові предмети, які зберігаються у вашому профілі.</p>
            <p>Ви можете придбати подарунки в офіційному магазині Telegram або отримати їх від інших користувачів.</p>
            <p>Після отримання NFT подарунків ви зможете обмінюватись ними через цей додаток.</p>
            <button id="demoNFTBtn" class="demo-nft-btn">Використовувати демо NFT</button>
        </div>
    `;
    
    document.body.appendChild(giftSelectContainer);
    
    // Обробник для закриття меню
    giftSelectContainer.querySelector('.close-popup').addEventListener('click', () => {
        document.body.removeChild(giftSelectContainer);
    });
    
    // Обробник для кнопки демо NFT
    giftSelectContainer.querySelector('#demoNFTBtn').addEventListener('click', () => {
        document.body.removeChild(giftSelectContainer);
        showDemoNFTSelection(mode);
    });
    
    // Додаємо стилі для пояснення NFT
    const style = document.createElement('style');
    style.textContent = `
        .nft-explanation {
            padding: 16px;
            text-align: left;
        }
        .nft-explanation p {
            margin-bottom: 12px;
            line-height: 1.5;
            color: var(--tg-theme-text-color, #333);
        }
        .demo-nft-btn {
            margin-top: 12px;
            background-color: var(--tg-theme-button-color, #3390ec);
        }
    `;
    document.head.appendChild(style);
}

// Показ демонстраційних NFT для вибору
function showDemoNFTSelection(mode) {
    // Створюємо демонстраційні NFT
    const demoNFTs = [
        { id: 'demo1', name: 'Telegram Premium Gift', description: 'Преміум подарунок від Telegram', imageUrl: 'https://telegram.org/img/t_logo.svg' },
        { id: 'demo2', name: 'Silver Gift Box', description: 'Срібна подарункова коробка', imageUrl: '' },
        { id: 'demo3', name: 'Cake NFT', description: 'Колекційний торт на день народження', imageUrl: '' },
        { id: 'demo4', name: 'Gold Star', description: 'Золота зірка за досягнення', imageUrl: '' },
        { id: 'demo5', name: 'Festive Tree', description: 'Святкова ялинка з колекції Нового року', imageUrl: '' }
    ];
    
    // Показуємо вікно вибору NFT з демо-даними
    showNFTSelectionMenu(demoNFTs, mode);
}

// Відображення списку предметів користувача з підтримкою NFT
function renderMyItems() {
    const container = document.getElementById('myItems');
    container.innerHTML = '';
    
    if (myItems.length === 0) {
        container.innerHTML = '<p>Додайте подарунки для обміну</p>';
        return;
    }
    
    myItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item' + (item.isNFT ? ' nft-item-display' : '');
        
        // Відображення NFT з зображенням, якщо доступно
        let itemContent = '';
        if (item.isNFT) {
            itemContent += `
                <div class="item-nft-tag">NFT</div>
                ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
            `;
        }
        
        itemContent += `
            <div class="item-name">${item.name}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
            <button class="remove-item" data-index="${index}">✕</button>
        `;
        
        itemElement.innerHTML = itemContent;
        container.appendChild(itemElement);
    });
    
    // Додавання обробників для кнопок видалення
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            myItems.splice(index, 1);
            renderMyItems();
            
            // Оновлюємо головну кнопку після зміни списку предметів
            updateMainButton();
        });
    });
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

// Відображення модального вікна з контактами Telegram
function showCustomContactsList(contacts) {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'contact-selection-popup';
    modalContainer.innerHTML = `
        <div class="popup-header">
            <h3>Виберіть контакт</h3>
            <button class="close-popup">&times;</button>
        </div>
        <div class="search-input">
            <input type="text" id="modalContactSearch" placeholder="Пошук контактів...">
        </div>
        <div class="contacts-modal-list"></div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Додаємо контакти до списку
    const contactsList = modalContainer.querySelector('.contacts-modal-list');
    contacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-modal-item';
        
        // Створення аватара (якщо є)
        const photoUrl = contact.photo_url || '';
        const initials = ((contact.first_name || '').charAt(0) + (contact.last_name || '').charAt(0)).toUpperCase();
        
        contactElement.innerHTML = `
            <div class="contact-avatar">
                ${photoUrl ? `<img src="${photoUrl}" alt="${initials}">` : initials}
            </div>
            <div class="contact-details">
                <div class="contact-name">${contact.first_name || ''} ${contact.last_name || ''}</div>
                ${contact.username ? `<div class="contact-username">@${contact.username}</div>` : ''}
            </div>
        `;
        
        contactElement.addEventListener('click', () => {
            // Перетворюємо дані контакту в потрібний формат
            selectContact({
                id: contact.id,
                first_name: contact.first_name || '',
                last_name: contact.last_name || '',
                username: contact.username || ''
            });
            document.body.removeChild(modalContainer);
        });
        
        contactsList.appendChild(contactElement);
    });
    
    // Додаємо пошук
    const searchInput = modalContainer.querySelector('#modalContactSearch');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const contactItems = contactsList.querySelectorAll('.contact-modal-item');
        
        contactItems.forEach(item => {
            const name = item.querySelector('.contact-name').textContent.toLowerCase();
            const username = item.querySelector('.contact-username')?.textContent.toLowerCase() || '';
            
            if (name.includes(query) || username.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
    
    // Додаємо обробник для закриття
    modalContainer.querySelector('.close-popup').addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    // Додаємо стилі
    const style = document.createElement('style');
    style.textContent = `
        .contact-selection-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 400px;
            background-color: var(--tg-theme-bg-color, white);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            overflow: hidden;
        }
        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
        }
        .popup-header h3 {
            margin: 0;
            color: var(--tg-theme-text-color, #333);
        }
        .search-input {
            padding: 12px 16px;
            border-bottom: 1px solid var(--tg-theme-hint-color, #eee);
        }
        .search-input input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--tg-theme-hint-color, #ddd);
            border-radius: 8px;
            font-size: 14px;
        }
        .contacts-modal-list {
            max-height: 400px;
            overflow-y: auto;
            padding: 8px 0;
        }
        .contact-modal-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .contact-modal-item:hover {
            background-color: var(--tg-theme-secondary-bg-color, rgba(0,0,0,0.05));
        }
    `;
    document.head.appendChild(style);
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
        description: itemDescription,
        isNFT: false
    });
    
    // Очищення полів введення
    document.getElementById('itemName').value = '';
    document.getElementById('itemDescription').value = '';
    
    // Оновлення списку предметів
    renderMyItems();
    
    // Оновлюємо головну кнопку після додавання предмету
    updateMainButton();
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
    
    // Перевіряємо, чи є хоча б один NFT подарунок
    const hasNFT = myItems.some(item => item.isNFT);
    if (!hasNFT) {
        // Показуємо вікно з попередженням про відсутність NFT
        tg.showPopup({
            title: 'Додайте NFT подарунок',
            message: 'Для обміну потрібен хоча б один NFT подарунок. Бажаєте додати?',
            buttons: [
                {type: 'default', id: 'add', text: 'Додати NFT'},
                {type: 'cancel', id: 'continue', text: 'Продовжити без NFT'}
            ]
        }, function(buttonId) {
            if (buttonId === 'add') {
                selectGiftWithTelegramAPI('create');
            } else if (buttonId === 'continue') {
                createTradeWithCurrentItems();
            }
        });
    } else {
        createTradeWithCurrentItems();
    }
}

// Створення обміну з поточними предметами
function createTradeWithCurrentItems() {
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

// Запуск додатку
init();

// Оновлені функції для роботи з нативними NFT подарунками Telegram

// Функція для вибору NFT подарунків Telegram
async function selectNFTWithTelegramAPI(mode) {
    try {
        console.log("Отримання NFT подарунків Telegram...");
        
        // Перевірка чи доступне API колекцій Telegram
        if (tg && tg.collectibles && typeof tg.collectibles.getGifts === 'function') {
            // Отримуємо NFT подарунки користувача через правильний метод
            tg.collectibles.getGifts((gifts) => {
                if (gifts && gifts.length > 0) {
                    // Показуємо інтерфейс вибору NFT
                    showJellyBunnyNFTSelectionMenu(gifts, mode);
                } else {
                    // Показуємо інформацію про відсутність подарунків
                    tg.showPopup({
                        title: "Немає NFT подарунків",
                        message: "У вас немає NFT подарунків Telegram. Ви можете придбати їх у Telegram за Stars.",
                        buttons: [
                            {type: 'default', id: 'buy', text: 'Купити подарунки'},
                            {type: 'cancel', id: 'close', text: 'Закрити'}
                        ]
                    }, function(buttonId) {
                        if (buttonId === 'buy') {
                            // Відкриття сторінки покупки подарунків
                            tg.openTelegramLink("https://t.me/giftexchange/buy");
                        }
                    });
                    
                    // Показуємо демо для тестування
                    showJellyBunnyDemoNFTs(mode);
                }
            });
        } else {
            console.log("API подарунків Telegram не доступне, використовуємо демо");
            // Демонстраційний режим
            showJellyBunnyDemoNFTs(mode);
        }
    } catch (error) {
        console.error("Помилка при отриманні NFT подарунків:", error);
        // Використовуємо демо режим при помилці
        showJellyBunnyDemoNFTs(mode);
    }
}

// Функція для відображення меню вибору NFT подарунків Jelly Bunny
function showJellyBunnyNFTSelectionMenu(gifts, mode) {
    // Створення модального вікна для вибору NFT
    const modal = document.createElement('div');
    modal.className = 'gift-selection-popup';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'popup-content';
    
    const header = document.createElement('div');
    header.className = 'popup-header';
    header.innerHTML = '<h3>Виберіть NFT подарунок</h3><button class="close-btn">✕</button>';
    
    const nftList = document.createElement('div');
    nftList.className = 'jelly-bunny-list';
    
    gifts.forEach(gift => {
        const nftItem = document.createElement('div');
        nftItem.className = 'jelly-bunny-item';
        
        // Обробка даних подарунка
        const nftName = gift.title || gift.name || "Jelly Bunny";
        const nftModel = gift.metadata?.model || "Стандартний";
        const nftBackdrop = gift.metadata?.backdrop || "Базовий";
        const nftSymbol = gift.metadata?.symbol || "";
        const nftQuantity = gift.metadata?.quantity || "Лімітований випуск";
        const nftImage = gift.imageUrl || gift.thumbnailUrl || '';
        
        nftItem.innerHTML = `
            <div class="jelly-bunny-image">
                ${nftImage ? `<img src="${nftImage}" alt="${nftName}">` : 
                '<div class="jelly-bunny-placeholder">JB</div>'}
            </div>
            <div class="jelly-bunny-info">
                <div class="jelly-bunny-name">${nftName}</div>
                <div class="jelly-bunny-details">
                    <div><strong>Модель:</strong> ${nftModel}</div>
                    <div><strong>Фон:</strong> ${nftBackdrop}</div>
                    ${nftSymbol ? `<div><strong>Символ:</strong> ${nftSymbol}</div>` : ''}
                    <div class="jelly-bunny-rarity">${nftQuantity}</div>
                </div>
            </div>
        `;
        
        nftItem.addEventListener('click', () => {
            if (mode === 'add') {
                addJellyBunnyToExchange(
                    gift.id, 
                    nftName, 
                    `${nftModel} | ${nftBackdrop}${nftSymbol ? ' | ' + nftSymbol : ''}`, 
                    nftImage,
                    gift.metadata
                );
            } else if (mode === 'counter') {
                addCounterJellyBunny(
                    gift.id, 
                    nftName, 
                    `${nftModel} | ${nftBackdrop}${nftSymbol ? ' | ' + nftSymbol : ''}`, 
                    nftImage,
                    gift.metadata
                );
            }
            document.body.removeChild(modal);
        });
        
        nftList.appendChild(nftItem);
    });
    
    modalContent.appendChild(header);
    modalContent.appendChild(nftList);
    modal.appendChild(modalContent);
    
    // Закриття модального вікна
    header.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.body.appendChild(modal);
    
    // Додаємо стилі для Jelly Bunny
    const jellyBunnyStyle = document.createElement('style');
    jellyBunnyStyle.textContent = `
        .jelly-bunny-list {
            max-height: 460px;
            overflow-y: auto;
            padding: 8px;
        }
        .jelly-bunny-item {
            display: flex;
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 12px;
            background: var(--tg-theme-secondary-bg-color, #f5f5f5);
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .jelly-bunny-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .jelly-bunny-image {
            width: 70px;
            height: 70px;
            border-radius: 8px;
            overflow: hidden;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .jelly-bunny-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .jelly-bunny-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #8a2be2, #4169e1);
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        .jelly-bunny-info {
            flex: 1;
            text-align: left;
        }
        .jelly-bunny-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 6px;
            color: var(--tg-theme-text-color, #000);
        }
        .jelly-bunny-details {
            font-size: 12px;
            color: var(--tg-theme-hint-color, #666);
            line-height: 1.4;
        }
        .jelly-bunny-rarity {
            margin-top: 4px;
            font-size: 11px;
            color: #8a2be2;
            font-weight: bold;
        }
        @keyframes jellyGlow {
            0%, 100% {
                box-shadow: 0 0 8px rgba(138, 43, 226, 0.6);
            }
            50% {
                box-shadow: 0 0 16px rgba(138, 43, 226, 0.8);
            }
        }
    `;
    document.head.appendChild(jellyBunnyStyle);
}

// Функція для демонстрації Jelly Bunny NFT
function showJellyBunnyDemoNFTs(mode) {
    // Створюємо демо дані для Jelly Bunny NFT
    const demoJellyBunnies = [
        {
            id: 'jb-13829',
            title: 'Jelly Bunny Collectible #13829',
            imageUrl: 'https://telegram.org/img/t_logo.svg', // Заглушка для демо
            metadata: {
                model: 'Pirate 1.5%',
                backdrop: 'Steel Grey 2%',
                symbol: 'Cursor 0.2%',
                quantity: '60 508/129 350 issued',
                owner: '𝐉𝐚𝐜𝐤 // 𝐏𝐈𝐑𝐀𝐓𝐄 𝐂𝐏𝐀'
            }
        },
        {
            id: 'jb-24601',
            title: 'Jelly Bunny Collectible #24601',
            imageUrl: 'https://telegram.org/img/t_logo.svg', // Заглушка для демо
            metadata: {
                model: 'Cowboy 2.5%',
                backdrop: 'Desert Gold 3%',
                symbol: 'Star 0.5%',
                quantity: '42 123/129 350 issued',
                owner: 'Поточний користувач'
            }
        },
        {
            id: 'jb-10101',
            title: 'Jelly Bunny Collectible #10101',
            imageUrl: 'https://telegram.org/img/t_logo.svg', // Заглушка для демо
            metadata: {
                model: 'Wizard 1.2%',
                backdrop: 'Mystic Purple 2.2%',
                symbol: 'Wand 0.3%',
                quantity: '32 456/129 350 issued',
                owner: 'Поточний користувач'
            }
        }
    ];
    
    // Відображаємо демо подарунки
    showJellyBunnyNFTSelectionMenu(demoJellyBunnies, mode);
}

// Додавання Jelly Bunny подарунка до обміну
function addJellyBunnyToExchange(nftId, name, details, imageUrl, metadata) {
    const myItemsList = document.getElementById("myItems");
    
    // Створюємо новий елемент для подарунка
    const jellyBunnyElement = document.createElement('div');
    jellyBunnyElement.className = 'item jelly-bunny-display';
    
    // Створюємо HTML для відображення подарунка
    jellyBunnyElement.innerHTML = `
        <div class="item-nft-tag">JELLY BUNNY</div>
        <div class="item-nft-image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : '<div class="jelly-bunny-placeholder">JB</div>'}
        </div>
        <div class="item-name">${name}</div>
        <div class="item-description">${details}</div>
        <div class="jelly-bunny-rarity">${metadata?.quantity || 'Рідкісний предмет'}</div>
    `;
    
    // Додаємо до відображення
    myItemsList.appendChild(jellyBunnyElement);
    
    // Додаємо до глобального списку предметів
    myItems.push({
        id: nftId,
        name: name,
        description: details,
        isNFT: true,
        isJellyBunny: true,
        imageUrl: imageUrl,
        metadata: metadata
    });
    
    // Повідомлення про успішне додавання
    tg.showPopup({
        title: "Подарунок додано",
        message: `${name} додано до пропозиції обміну.`,
        buttons: [{ type: "close" }]
    });
    
    // Оновлюємо кнопку MainButton
    updateMainButton();
}

// Додавання Jelly Bunny подарунка до контр-пропозиції
function addCounterJellyBunny(nftId, name, details, imageUrl, metadata) {
    const receiverItemsList = document.getElementById("receiverItemsList");
    
    // Створюємо новий елемент для подарунка
    const jellyBunnyElement = document.createElement('div');
    jellyBunnyElement.className = 'item jelly-bunny-display';
    
    // Створюємо HTML для відображення подарунка
    jellyBunnyElement.innerHTML = `
        <div class="item-nft-tag">JELLY BUNNY</div>
        <div class="item-nft-image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : '<div class="jelly-bunny-placeholder">JB</div>'}
        </div>
        <div class="item-name">${name}</div>
        <div class="item-description">${details}</div>
        <div class="jelly-bunny-rarity">${metadata?.quantity || 'Рідкісний предмет'}</div>
    `;
    
    // Додаємо до відображення
    receiverItemsList.appendChild(jellyBunnyElement);
    
    if (!counterItems) {
        counterItems = [];
    }
    
    // Додаємо до глобального списку контр-пропозицій
    counterItems.push({
        id: nftId,
        name: name,
        description: details,
        isNFT: true,
        isJellyBunny: true,
        imageUrl: imageUrl,
        metadata: metadata
    });
    
    // Повідомлення про успішне додавання
    tg.showPopup({
        title: "Подарунок додано",
        message: `${name} додано до вашої зустрічної пропозиції.`,
        buttons: [{ type: "close" }]
    });
}

// Оновлення відображення предметів користувача для підтримки Jelly Bunny
function renderMyItems() {
    const container = document.getElementById('myItems');
    container.innerHTML = '';
    
    if (myItems.length === 0) {
        container.innerHTML = '<p>Додайте подарунки для обміну</p>';
        return;
    }
    
    myItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        
        // Визначаємо клас відповідно до типу подарунка
        if (item.isJellyBunny) {
            itemElement.className = 'item jelly-bunny-display';
        } else if (item.isNFT) {
            itemElement.className = 'item nft-item-display';
        } else {
            itemElement.className = 'item';
        }
        
        // Відображення Jelly Bunny з особливим форматуванням
        let itemContent = '';
        if (item.isJellyBunny) {
            itemContent += `
                <div class="item-nft-tag">JELLY BUNNY</div>
                ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                <div class="jelly-bunny-rarity">${item.metadata?.quantity || 'Рідкісний предмет'}</div>
            `;
        } else if (item.isNFT) {
            itemContent += `
                <div class="item-nft-tag">NFT</div>
                ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
            `;
        } else {
            itemContent += `
                <div class="item-name">${item.name}</div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            `;
        }
        
        // Додаємо кнопку видалення
        itemContent += `<button class="remove-item" data-index="${index}">✕</button>`;
        
        itemElement.innerHTML = itemContent;
        container.appendChild(itemElement);
    });
    
    // Додавання обробників для кнопок видалення
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            myItems.splice(index, 1);
            renderMyItems();
            
            // Оновлюємо головну кнопку після зміни списку предметів
            updateMainButton();
        });
    });
}

// Оновлення слухачів подій для Jelly Bunny NFT кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Додаємо слухачі для кнопок NFT подарунків
    document.getElementById('addNFTBtn').addEventListener('click', function() {
        selectNFTWithTelegramAPI('add');
    });
    
    document.getElementById('addCounterNFTBtn').addEventListener('click', function() {
        selectNFTWithTelegramAPI('counter');
    });
    
    document.getElementById('myNFTBtn').addEventListener('click', function() {
        showMyJellyBunnyCollection();
    });
    
    document.getElementById('backFromNFTBtn').addEventListener('click', function() {
        showSection('mainMenu');
    });
    
    // Додаємо обробник для кнопки купівлі NFT
    document.getElementById('buyNFTBtn').addEventListener('click', function() {
        // Відкриття сторінки покупки NFT подарунків в Telegram
        tg.openTelegramLink("https://t.me/giftshop");
    });
});

// Функція для відображення колекції Jelly Bunny користувача
function showMyJellyBunnyCollection() {
    showSection('my-nft-collection');
    
    try {
        const nftCollectionsList = document.getElementById('nftCollectionsList');
        const nftEmptyState = document.getElementById('nftEmptyState');
        
        // Очищення списку
        nftCollectionsList.innerHTML = '';
        
        // Перевірка чи доступне API подарунків Telegram
        if (tg && tg.collectibles && typeof tg.collectibles.getGifts === 'function') {
            // Отримуємо NFT подарунки користувача з API
            tg.collectibles.getGifts((gifts) => {
                if (gifts && gifts.length > 0) {
                    nftEmptyState.style.display = 'none';
                    gifts.forEach(gift => {
                        // Додаємо кожен Jelly Bunny подарунок до колекції
                        addJellyBunnyToCollection(
                            gift.id, 
                            gift.title || gift.name || "Jelly Bunny",
                            gift.metadata?.model,
                            gift.metadata?.backdrop,
                            gift.metadata?.symbol,
                            gift.metadata?.quantity,
                            gift.imageUrl || gift.thumbnailUrl
                        );
                    });
                } else {
                    nftEmptyState.style.display = 'block';
                }
            });
        } else {
            // Демо режим для тестування
            console.log("API подарунків недоступне, показуємо демо-дані");
            nftEmptyState.style.display = 'none';
            
            // Демо подарунки Jelly Bunny
            addJellyBunnyToCollection(
                'jb-13829',
                'Jelly Bunny Collectible #13829',
                'Pirate 1.5%',
                'Steel Grey 2%',
                'Cursor 0.2%',
                '60 508/129 350 issued',
                'https://telegram.org/img/t_logo.svg'
            );
            
            addJellyBunnyToCollection(
                'jb-24601',
                'Jelly Bunny Collectible #24601',
                'Cowboy 2.5%',
                'Desert Gold 3%',
                'Star 0.5%',
                '42 123/129 350 issued',
                'https://telegram.org/img/t_logo.svg'
            );
        }
    } catch (error) {
        console.error("Помилка при завантаженні NFT подарунків:", error);
        document.getElementById('nftEmptyState').style.display = 'block';
        document.getElementById('nftEmptyState').textContent = 'Виникла помилка при завантаженні NFT подарунків. Спробуйте пізніше.';
    }
}

// Додавання Jelly Bunny до колекції
function addJellyBunnyToCollection(id, name, model, backdrop, symbol, quantity, imageUrl) {
    const nftCollectionsList = document.getElementById('nftCollectionsList');
    
    // Створюємо новий елемент для подарунка
    const jellyBunnyElement = document.createElement('div');
    jellyBunnyElement.className = 'item jelly-bunny-display';
    jellyBunnyElement.setAttribute('data-id', id);
    
    // Створюємо HTML для відображення подарунка
    jellyBunnyElement.innerHTML = `
        <div class="item-nft-tag">JELLY BUNNY</div>
        <div class="item-nft-image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${name}">` : '<div class="jelly-bunny-placeholder">JB</div>'}
        </div>
        <div class="item-name">${name}</div>
        <div class="item-description">
            ${model ? `<div><strong>Модель:</strong> ${model}</div>` : ''}
            ${backdrop ? `<div><strong>Фон:</strong> ${backdrop}</div>` : ''}
            ${symbol ? `<div><strong>Символ:</strong> ${symbol}</div>` : ''}
        </div>
        <div class="jelly-bunny-rarity">${quantity || 'Рідкісний предмет'}</div>
    `;
    
    // Додаємо в DOM
    nftCollectionsList.appendChild(jellyBunnyElement);
}

// Функція для відображення списку активних обмінів з підтримкою Jelly Bunny
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
        
        // Підраховуємо кількість NFT подарунків у пропозиції
        const nftItemsCount = trade.items.filter(item => item.isJellyBunny).length;
        const totalItemsCount = trade.items.length;
        
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
            <div>Предмети: ${totalItemsCount} (${nftItemsCount} NFT)</div>
            <div>Статус: ${statusText}</div>
        `;
        
        tradeElement.addEventListener('click', () => openTradeDetails(trade.id));
        container.appendChild(tradeElement);
    });
}

// Відкриття деталей обміну з підтримкою Jelly Bunny
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
        let itemElement;
        
        if (item.isJellyBunny) {
            // Відображення Jelly Bunny
            itemElement = document.createElement('div');
            itemElement.className = 'item jelly-bunny-display';
            itemElement.innerHTML = `
                <div class="item-nft-tag">JELLY BUNNY</div>
                ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
                ${item.metadata?.quantity ? `<div class="jelly-bunny-rarity">${item.metadata.quantity}</div>` : ''}
            `;
        } else if (item.isNFT) {
            // Відображення інших NFT
            itemElement = document.createElement('div');
            itemElement.className = 'item nft-item-display';
            itemElement.innerHTML = `
                <div class="item-nft-tag">NFT</div>
                ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description}</div>
            `;
        } else {
            // Звичайні предмети
            itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.innerHTML = `
                <div class="item-name">${item.name}</div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
            `;
        }
        
        senderItemsList.appendChild(itemElement);
    });
    
    // Відображення предметів отримувача (контр-пропозиція)
    const receiverItemsList = document.getElementById('receiverItemsList');
    receiverItemsList.innerHTML = '';
    
    if (trade.counterOffer.length > 0) {
        trade.counterOffer.forEach((item, index) => {
            let itemElement;
            
            if (item.isJellyBunny) {
                // Відображення Jelly Bunny в контрпропозиції
                itemElement = document.createElement('div');
                itemElement.className = 'item jelly-bunny-display';
                itemElement.innerHTML = `
                    <div class="item-nft-tag">JELLY BUNNY</div>
                    ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                    ${item.metadata?.quantity ? `<div class="jelly-bunny-rarity">${item.metadata.quantity}</div>` : ''}
                    ${isInitiator ? '' : `<button class="remove-item" data-index="${index}">✕</button>`}
                `;
            } else if (item.isNFT) {
                // Відображення інших NFT в контрпропозиції
                itemElement = document.createElement('div');
                itemElement.className = 'item nft-item-display';
                itemElement.innerHTML = `
                    <div class="item-nft-tag">NFT</div>
                    ${item.imageUrl ? `<div class="item-nft-image"><img src="${item.imageUrl}" alt="${item.name}"></div>` : ''}
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                    ${isInitiator ? '' : `<button class="remove-item" data-index="${index}">✕</button>`}
                `;
            } else {
                // Звичайні предмети в контрпропозиції
                itemElement = document.createElement('div');
                itemElement.className = 'item';
                itemElement.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                    ${isInitiator ? '' : `<button class="remove-item" data-index="${index}">✕</button>`}
                `;
            }
            
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
