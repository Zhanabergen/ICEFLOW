// invest.js - Полная логика для страницы инвестирования IceFlow

// Глобальные переменные
let currentUser = null;
let wallet = null;
let publicKey = null;
let selectedAsset = null;
let availableAssets = [];
let portfolioChart = null;

// Данные активов
const assetsData = [
    {
        id: 1,
        name: 'Downtown Loft',
        type: 'residential',
        location: 'Нью-Йорк, Сохо',
        price: 250,
        yield: 8.5,
        totalTokens: 1000,
        soldTokens: 750,
        image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400',
        description: 'Современный лофт в центре Нью-Йорка с видом на Манхэттен',
        features: ['Круглосуточная охрана', 'Паркинг', 'Фитнес-центр']
    },
    {
        id: 2,
        name: 'Beachfront Villa',
        type: 'residential',
        location: 'Майами, Бич',
        price: 500,
        yield: 12,
        totalTokens: 500,
        soldTokens: 250,
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
        description: 'Роскошная вилла на первой линии океана',
        features: ['Бассейн', 'Частный пляж', 'Сауна']
    },
    {
        id: 3,
        name: 'Commercial Tower',
        type: 'commercial',
        location: 'Дубай, DIFC',
        price: 1000,
        yield: 15,
        totalTokens: 2000,
        soldTokens: 600,
        image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
        description: 'Офисный центр в деловом районе Дубая',
        features: ['Конференц-залы', 'Рестораны', 'Бизнес-центр']
    },
    {
        id: 4,
        name: 'Mountain Retreat',
        type: 'residential',
        location: 'Швейцария, Церматт',
        price: 750,
        yield: 10.5,
        totalTokens: 300,
        soldTokens: 120,
        image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
        description: 'Горный курорт с видом на Альпы',
        features: ['Спа-центр', 'Горнолыжный склон', 'Ресторан']
    }
];

// Инициализация страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверка авторизации
    checkAuth();
    
    // Загрузка активов
    loadAssets();
    
    // Инициализация кошелька
    initWalletConnection();
    
    // Настройка обработчиков форм
    setupFormHandlers();
});

// Проверка авторизации
function checkAuth() {
    const user = localStorage.getItem('iceflow_user');
    if (user) {
        currentUser = JSON.parse(user);
        updateUserUI();
    }
}

// Обновление UI пользователя
function updateUserUI() {
    if (currentUser && currentUser.wallet_address) {
        const shortWallet = `${currentUser.wallet_address.slice(0, 6)}...${currentUser.wallet_address.slice(-4)}`;
        document.getElementById('walletAddress').textContent = shortWallet;
        document.getElementById('walletStatus').className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
    }
}

// Инициализация подключения кошелька
function initWalletConnection() {
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectSolanaWallet);
    }
}

// Подключение Solana кошелька
async function connectSolanaWallet() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            wallet = window.solana;
            publicKey = response.publicKey;
            
            const shortAddress = `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`;
            document.getElementById('walletAddress').textContent = shortAddress;
            document.getElementById('walletStatus').className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
            document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-check-circle mr-2"></i> Подключен';
            document.getElementById('connectWalletBtn').disabled = true;
            
            // Обновляем кошелек в профиле пользователя
            if (currentUser) {
                await updateUserWallet(publicKey.toString());
            }
            
            showToast('Кошелек успешно подключен!', 'success');
            
            // Активируем кнопку инвестирования
            const investBtn = document.getElementById('investBtn');
            if (investBtn && selectedAsset) {
                investBtn.disabled = false;
            }
        } else {
            window.open('https://phantom.app/', '_blank');
            showToast('Установите Phantom Wallet для продолжения', 'info');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showToast('Ошибка подключения кошелька', 'error');
    }
}

// Обновление кошелька пользователя
async function updateUserWallet(walletAddress) {
    try {
        const response = await fetch('/php/api.php?action=updateUser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                walletAddress: walletAddress
            })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('iceflow_user', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('Error updating wallet:', error);
    }
}

// Загрузка активов
function loadAssets() {
    const container = document.getElementById('assetsList');
    if (!container) return;
    
    availableAssets = assetsData;
    displayAssets(availableAssets);
}

// Отображение активов
function displayAssets(assets) {
    const container = document.getElementById('assetsList');
    
    if (assets.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-box-open text-4xl mb-2"></i>
                <p>Нет доступных активов</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assets.map(asset => `
        <div class="asset-card p-4 ${selectedAsset?.id === asset.id ? 'selected' : ''}" onclick="selectAsset(${asset.id})">
            <div class="flex items-center space-x-4">
                <img src="${asset.image}" alt="${asset.name}" class="w-16 h-16 rounded-xl object-cover">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-white font-semibold">${asset.name}</h3>
                            <p class="text-gray-400 text-sm">${asset.location}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-blue-400 font-bold">${asset.price} SOL</div>
                            <div class="text-green-400 text-sm">+${asset.yield}% APY</div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Продано: ${asset.soldTokens}/${asset.totalTokens}</span>
                            <span>${Math.round((asset.soldTokens / asset.totalTokens) * 100)}%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-1.5">
                            <div class="gradient-bg h-1.5 rounded-full" style="width: ${(asset.soldTokens / asset.totalTokens) * 100}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Фильтрация активов
function filterAssets(type) {
    // Обновляем активные кнопки фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    
    const activeBtn = event.target;
    activeBtn.classList.add('active');
    activeBtn.classList.remove('bg-gray-700', 'text-gray-300');
    
    // Фильтруем активы
    let filtered = assetsData;
    if (type !== 'all') {
        filtered = assetsData.filter(asset => asset.type === type);
    }
    
    displayAssets(filtered);
}

// Выбор актива
function selectAsset(assetId) {
    const asset = assetsData.find(a => a.id === assetId);
    if (!asset) return;
    
    selectedAsset = asset;
    
    // Обновляем выделение в списке
    document.querySelectorAll('.asset-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Обновляем карточку выбранного актива
    updateSelectedAssetCard(asset);
    
    // Обновляем форму
    updateInvestmentForm();
    
    // Активируем кнопку инвестирования если кошелек подключен
    const investBtn = document.getElementById('investBtn');
    if (investBtn && publicKey) {
        investBtn.disabled = false;
    }
    
    showToast(`Выбран актив: ${asset.name}`, 'info');
}

// Обновление карточки выбранного актива
function updateSelectedAssetCard(asset) {
    const container = document.getElementById('selectedAssetCard');
    if (!container) return;
    
    const availableTokens = asset.totalTokens - asset.soldTokens;
    const progressPercent = (asset.soldTokens / asset.totalTokens) * 100;
    
    container.innerHTML = `
        <div class="text-center">
            <img src="${asset.image}" alt="${asset.name}" class="w-full h-32 object-cover rounded-lg mb-3">
            <h4 class="text-white font-bold text-lg">${asset.name}</h4>
            <p class="text-gray-400 text-sm mb-2">${asset.location}</p>
            <div class="flex justify-center space-x-4 mb-3">
                <div class="text-center">
                    <div class="text-blue-400 font-bold">${asset.price} SOL</div>
                    <div class="text-gray-500 text-xs">Цена за токен</div>
                </div>
                <div class="text-center">
                    <div class="text-green-400 font-bold">${asset.yield}%</div>
                    <div class="text-gray-500 text-xs">APY</div>
                </div>
            </div>
            <div class="bg-gray-700/50 rounded-lg p-2 mb-2">
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-gray-400">Доступно токенов:</span>
                    <span class="text-white font-bold">${availableTokens} / ${asset.totalTokens}</span>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-1.5">
                    <div class="gradient-bg h-1.5 rounded-full" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            <p class="text-gray-400 text-xs">${asset.description}</p>
        </div>
    `;
}

// Обновление инвестиционной формы
function updateInvestmentForm() {
    if (!selectedAsset) return;
    
    const amount = parseInt(document.getElementById('tokenAmount').value) || 1;
    const totalCost = amount * selectedAsset.price;
    const fee = totalCost * 0.01;
    const totalWithFee = totalCost + fee;
    
    document.getElementById('displayPrice').textContent = `${selectedAsset.price} SOL`;
    document.getElementById('displayFee').textContent = `${fee.toFixed(4)} SOL`;
    document.getElementById('displayTotal').textContent = `${totalWithFee.toFixed(4)} SOL`;
}

// Изменение количества токенов
function adjustAmount(delta) {
    const input = document.getElementById('tokenAmount');
    let value = parseInt(input.value) || 1;
    value = Math.max(1, value + delta);
    
    const availableTokens = selectedAsset ? (selectedAsset.totalTokens - selectedAsset.soldTokens) : 1000;
    value = Math.min(value, availableTokens);
    
    input.value = value;
    updateInvestmentForm();
}

// Быстрая установка количества
function setQuickAmount(amount) {
    const input = document.getElementById('tokenAmount');
    const availableTokens = selectedAsset ? (selectedAsset.totalTokens - selectedAsset.soldTokens) : 1000;
    input.value = Math.min(amount, availableTokens);
    updateInvestmentForm();
}

// Настройка обработчиков формы
function setupFormHandlers() {
    const form = document.getElementById('investForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await processInvestment();
        });
    }
    
    const amountInput = document.getElementById('tokenAmount');
    if (amountInput) {
        amountInput.addEventListener('input', updateInvestmentForm);
    }
}

// Обработка инвестирования
async function processInvestment() {
    if (!selectedAsset) {
        showToast('Пожалуйста, выберите актив', 'error');
        return;
    }
    
    if (!publicKey) {
        showToast('Пожалуйста, подключите Solana кошелек', 'error');
        await connectSolanaWallet();
        return;
    }
    
    const amount = parseInt(document.getElementById('tokenAmount').value);
    const totalCost = amount * selectedAsset.price;
    const fee = totalCost * 0.01;
    const totalWithFee = totalCost + fee;
    
    // Проверяем баланс
    const balance = await getWalletBalance();
    if (balance < totalWithFee) {
        showToast(`Недостаточно средств. Нужно ${totalWithFee.toFixed(4)} SOL`, 'error');
        return;
    }
    
    // Показываем модальное окно
    showModal('processing');
    
    try {
        // Симуляция транзакции на Solana
        updateModalProgress(25, 'Подготовка транзакции...');
        await sleep(1000);
        
        updateModalProgress(50, 'Отправка в блокчейн...');
        await sleep(1500);
        
        // Здесь будет реальная транзакция
        const transactionHash = simulateTransaction();
        
        updateModalProgress(75, 'Подтверждение транзакции...');
        await sleep(1000);
        
        // Сохраняем инвестицию
        await saveInvestment(selectedAsset.id, amount, totalWithFee, transactionHash);
        
        updateModalProgress(100, 'Транзакция подтверждена!');
        await sleep(500);
        
        // Успех
        showModal('success', {
            amount: amount,
            assetName: selectedAsset.name,
            total: totalWithFee,
            hash: transactionHash
        });
        
        // Обновляем данные
        updateAfterInvestment();
        
    } catch (error) {
        console.error('Investment error:', error);
        showModal('error', { error: error.message });
    }
}

// Получение баланса кошелька
async function getWalletBalance() {
    if (!publicKey) return 0;
    
    try {
        const connection = new solanaWeb3.Connection('https://api.devnet.solana.com');
        const balance = await connection.getBalance(publicKey);
        return balance / solanaWeb3.LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error getting balance:', error);
        return 0;
    }
}

// Симуляция транзакции
function simulateTransaction() {
    return '0x' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Сохранение инвестиции
async function saveInvestment(assetId, tokenAmount, totalCost, txHash) {
    // Сохраняем в localStorage для демо
    const walletAddress = publicKey.toString();
    let portfolio = localStorage.getItem(`iceflow_portfolio_${walletAddress}`);
    let userAssets = portfolio ? JSON.parse(portfolio) : [];
    
    const asset = assetsData.find(a => a.id === assetId);
    
    userAssets.push({
        asset_id: assetId,
        asset_name: asset.name,
        token_amount: tokenAmount,
        investment_amount: totalCost,
        yield_rate: asset.yield,
        purchase_date: new Date().toISOString(),
        tx_hash: txHash
    });
    
    localStorage.setItem(`iceflow_portfolio_${walletAddress}`, JSON.stringify(userAssets));
    
    // Обновляем количество проданных токенов
    asset.soldTokens += tokenAmount;
    
    return true;
}

// Обновление после инвестирования
function updateAfterInvestment() {
    // Обновляем список активов
    displayAssets(availableAssets);
    
    // Обновляем карточку выбранного актива
    if (selectedAsset) {
        updateSelectedAssetCard(selectedAsset);
    }
}

// Показ модального окна
function showModal(type, data = {}) {
    const modal = document.getElementById('transactionModal');
    const icon = document.getElementById('modalIcon');
    const title = document.getElementById('modalTitle');
    const message = document.getElementById('modalMessage');
    const progress = document.getElementById('modalProgress');
    const closeBtn = document.getElementById('modalCloseBtn');
    
    modal.classList.remove('hidden');
    
    switch(type) {
        case 'processing':
            icon.innerHTML = '<i class="fas fa-spinner fa-spin text-4xl text-blue-400"></i>';
            title.textContent = 'Обработка транзакции';
            message.textContent = 'Пожалуйста, подождите...';
            progress.classList.remove('hidden');
            closeBtn.classList.add('hidden');
            break;
            
        case 'success':
            icon.innerHTML = '<i class="fas fa-check-circle text-4xl text-green-400"></i>';
            title.textContent = 'Инвестиция успешна!';
            message.innerHTML = `
                Вы успешно инвестировали ${data.amount} токенов в ${data.assetName}<br>
                Сумма: ${data.total.toFixed(4)} SOL<br>
                Хеш: <span class="text-xs">${data.hash.slice(0, 20)}...</span>
            `;
            progress.classList.add('hidden');
            closeBtn.classList.remove('hidden');
            break;
            
        case 'error':
            icon.innerHTML = '<i class="fas fa-times-circle text-4xl text-red-400"></i>';
            title.textContent = 'Ошибка транзакции';
            message.textContent = data.error || 'Произошла ошибка при обработке';
            progress.classList.add('hidden');
            closeBtn.classList.remove('hidden');
            break;
    }
}

// Обновление прогресса в модальном окне
function updateModalProgress(percent, statusMessage) {
    const progressBar = document.querySelector('#modalProgress .gradient-bg');
    const message = document.getElementById('modalMessage');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    if (message && statusMessage) {
        message.textContent = statusMessage;
    }
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('transactionModal');
    modal.classList.add('hidden');
    
    // Если успешная инвестиция, перенаправляем на дашборд
    const title = document.getElementById('modalTitle').textContent;
    if (title === 'Инвестиция успешна!') {
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }
}

// Показ уведомления
function showToast(message, type = 'info') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden', 'translate-x-full');
    toast.classList.add('translate-x-0');
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Вспомогательная функция для задержки
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Экспорт функций для глобального использования
window.selectAsset = selectAsset;
window.filterAssets = filterAssets;
window.adjustAmount = adjustAmount;
window.setQuickAmount = setQuickAmount;
window.closeModal = closeModal;