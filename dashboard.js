// Dashboard Logic
let portfolioData = [];
let transactionsData = [];
let portfolioChart, yieldChart, monthlyYieldChart, portfolioGrowthChart, forecastChart;

// Initialize dashboard
async function initDashboard() {
    if (!requireAuth()) return;
    
    // Set user info
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userInitial').textContent = currentUser.username[0].toUpperCase();
    
    // Load data
    await loadPortfolio();
    await loadTransactions();
    await loadAvailableAssets();
    
    // Check if wallet is connected
    if (currentUser.wallet_address) {
        await updateWalletBalance(currentUser.wallet_address);
        document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-check-circle mr-2"></i> Кошелек подключен';
    }
}

// Load portfolio data
async function loadPortfolio() {
    portfolioData = await getUserPortfolio(currentUser.id);
    updatePortfolioStats();
    displayPortfolioAssets();
    initPortfolioCharts();
}

// Update portfolio statistics
function updatePortfolioStats() {
    const totalInvested = portfolioData.reduce((sum, item) => sum + parseFloat(item.investment_amount), 0);
    const totalValue = portfolioData.reduce((sum, item) => sum + (parseFloat(item.token_amount) * parseFloat(item.current_price || item.price_per_token)), totalInvested);
    const annualYield = portfolioData.reduce((sum, item) => sum + (parseFloat(item.investment_amount) * parseFloat(item.yield_rate) / 100), 0);
    
    document.getElementById('totalValue').textContent = `${totalValue.toFixed(2)} SOL`;
    document.getElementById('annualYield').textContent = `${annualYield.toFixed(2)} SOL`;
    document.getElementById('assetsCount').textContent = portfolioData.length;
    document.getElementById('totalInvested').textContent = `${totalInvested.toFixed(2)} SOL`;
}

// Display portfolio assets
function displayPortfolioAssets() {
    const container = document.getElementById('userAssets');
    if (!container) return;
    
    if (portfolioData.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-8 text-gray-400">
                <i class="fas fa-folder-open text-4xl mb-2"></i>
                <p>У вас пока нет активов</p>
                <button onclick="showSection('invest')" class="text-purple-400 hover:underline mt-2">Инвестировать сейчас</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = portfolioData.map(asset => `
        <div class="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="text-white font-semibold">${asset.asset_name}</h4>
                    <p class="text-gray-400 text-sm">${asset.token_amount} токенов</p>
                </div>
                <span class="text-green-400 text-sm">+${asset.yield_rate}% APY</span>
            </div>
            <div class="flex justify-between text-sm mb-2">
                <span class="text-gray-400">Инвестировано:</span>
                <span class="text-white">${asset.investment_amount} SOL</span>
            </div>
            <div class="flex justify-between text-sm mb-3">
                <span class="text-gray-400">Текущая стоимость:</span>
                <span class="text-purple-400">${(asset.token_amount * (asset.current_price || asset.price_per_token)).toFixed(2)} SOL</span>
            </div>
            <div class="w-full bg-gray-600 rounded-full h-2">
                <div class="gradient-bg h-2 rounded-full" style="width: ${((asset.token_amount * (asset.current_price || asset.price_per_token)) / asset.investment_amount * 100).toFixed(0)}%"></div>
            </div>
            <div class="flex justify-between mt-3">
                <button onclick="showAssetDetails(${asset.asset_id})" class="text-purple-400 text-sm hover:underline">
                    <i class="fas fa-chart-line mr-1"></i>Детали
                </button>
                <button onclick="sellAsset(${asset.asset_id})" class="text-red-400 text-sm hover:underline">
                    <i class="fas fa-exchange-alt mr-1"></i>Продать
                </button>
            </div>
        </div>
    `).join('');
}

// Load transactions
async function loadTransactions() {
    transactionsData = await getUserTransactions(currentUser.id);
    displayRecentTransactions();
    displayAllTransactions();
}

// Display recent transactions (last 5)
function displayRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    const recent = transactionsData.slice(0, 5);
    if (recent.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">Нет транзакций</div>';
        return;
    }
    
    container.innerHTML = recent.map(tx => `
        <div class="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 ${tx.type === 'buy' ? 'bg-green-500/20' : tx.type === 'sell' ? 'bg-red-500/20' : 'bg-purple-500/20'} rounded-full flex items-center justify-center">
                    <i class="fas ${tx.type === 'buy' ? 'fa-arrow-down text-green-400' : tx.type === 'sell' ? 'fa-arrow-up text-red-400' : 'fa-chart-line text-purple-400'}"></i>
                </div>
                <div>
                    <p class="text-white text-sm font-medium">${tx.type === 'buy' ? 'Покупка' : tx.type === 'sell' ? 'Продажа' : 'Доход'} - ${tx.asset_name}</p>
                    <p class="text-gray-500 text-xs">${new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-white font-mono">${tx.amount} SOL</p>
                <p class="text-gray-500 text-xs">${tx.token_amount} токенов</p>
            </div>
        </div>
    `).join('');
}

// Display all transactions
function displayAllTransactions() {
    const container = document.getElementById('allTransactions');
    if (!container) return;
    
    if (transactionsData.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">История транзакций пуста</div>';
        return;
    }
    
    container.innerHTML = transactionsData.map(tx => `
        <div class="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
            <div class="flex items-center space-x-4">
                <div class="w-10 h-10 ${tx.type === 'buy' ? 'bg-green-500/20' : tx.type === 'sell' ? 'bg-red-500/20' : 'bg-purple-500/20'} rounded-full flex items-center justify-center">
                    <i class="fas ${tx.type === 'buy' ? 'fa-arrow-down text-green-400' : tx.type === 'sell' ? 'fa-arrow-up text-red-400' : 'fa-chart-line text-purple-400'} text-lg"></i>
                </div>
                <div>
                    <p class="text-white font-semibold">${tx.type === 'buy' ? 'Покупка' : tx.type === 'sell' ? 'Продажа' : 'Получен доход'}</p>
                    <p class="text-gray-400 text-sm">${tx.asset_name}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-white font-bold">${tx.amount} SOL</p>
                <p class="text-gray-400 text-sm">${tx.token_amount} токенов</p>
                <p class="text-gray-500 text-xs">${new Date(tx.created_at).toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Load available assets for investment
async function loadAvailableAssets() {
    try {
        const response = await fetch('/php/api.php?action=assets');
        const data = await response.json();
        const assets = data.success ? data.data : [];
        
        const container = document.getElementById('availableAssets');
        if (!container) return;
        
        container.innerHTML = assets.map(asset => `
            <div class="bg-gray-800 rounded-xl overflow-hidden">
                <img src="${asset.image_url || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <h4 class="text-white font-semibold text-lg">${asset.name}</h4>
                    <p class="text-gray-400 text-sm mb-2"><i class="fas fa-map-marker-alt mr-1"></i> ${asset.location}</p>
                    <div class="flex justify-between text-sm mb-3">
                        <span class="text-purple-400">${asset.price_per_token} SOL/токен</span>
                        <span class="text-green-400">+${asset.yield_rate}% APY</span>
                    </div>
                    <div class="flex gap-2">
                        <input type="number" id="amount_${asset.id}" placeholder="Кол-во" class="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm">
                        <button onclick="investInAsset(${asset.id}, ${asset.price_per_token}, '${asset.name}')" class="gradient-bg text-white px-4 py-2 rounded-lg text-sm">
                            Купить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

// Invest in asset
async function investInAsset(assetId, price, name) {
    const amountInput = document.getElementById(`amount_${assetId}`);
    const tokenAmount = parseInt(amountInput.value);
    
    if (!tokenAmount || tokenAmount <= 0) {
        showNotification('Введите количество токенов', 'error');
        return;
    }
    
    if (!currentUser.wallet_address) {
        showNotification('Пожалуйста, подключите Solana кошелек', 'error');
        return;
    }
    
    const totalCost = tokenAmount * price;
    
    // Check Solana balance (simplified)
    try {
        const connection = new solanaWeb3.Connection('https://api.devnet.solana.com');
        const balance = await connection.getBalance(new solanaWeb3.PublicKey(currentUser.wallet_address));
        const balanceSOL = balance / solanaWeb3.LAMPORTS_PER_SOL;
        
        if (balanceSOL < totalCost) {
            showNotification(`Недостаточно средств. Нужно ${totalCost} SOL`, 'error');
            return;
        }
        
        // Record investment
        const response = await fetch('/php/api.php?action=invest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                assetId: assetId,
                tokenAmount: tokenAmount,
                investmentAmount: totalCost,
                assetName: name
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Успешно куплено ${tokenAmount} токенов!`, 'success');
            amountInput.value = '';
            await loadPortfolio();
            await loadTransactions();
        } else {
            showNotification(data.error || 'Ошибка инвестирования', 'error');
        }
    } catch (error) {
        console.error('Investment error:', error);
        showNotification('Ошибка транзакции', 'error');
    }
}

// Connect Solana wallet
async function connectSolanaWallet() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            const walletAddress = response.publicKey.toString();
            
            // Update user in database
            await updateUserSettings(currentUser.username, currentUser.email, walletAddress);
            
            document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-check-circle mr-2"></i> Кошелек подключен';
            await updateWalletBalance(walletAddress);
            showNotification('Кошелек подключен!', 'success');
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification('Ошибка подключения кошелька', 'error');
    }
}

// Update wallet balance display
async function updateWalletBalance(walletAddress) {
    try {
        const connection = new solanaWeb3.Connection('https://api.devnet.solana.com');
        const balance = await connection.getBalance(new solanaWeb3.PublicKey(walletAddress));
        const balanceSOL = balance / solanaWeb3.LAMPORTS_PER_SOL;
        document.getElementById('walletBalance').textContent = `${balanceSOL.toFixed(4)} SOL`;
    } catch (error) {
        console.error('Error getting balance:', error);
    }
}

// Show different sections
function showSection(section) {
    // Hide all sections
    document.getElementById('overviewSection').classList.add('hidden');
    document.getElementById('portfolioSection').classList.add('hidden');
    document.getElementById('investSection').classList.add('hidden');
    document.getElementById('transactionsSection').classList.add('hidden');
    document.getElementById('analyticsSection').classList.add('hidden');
    document.getElementById('settingsSection').classList.add('hidden');
    
    // Show selected section
    document.getElementById(`${section}Section`).classList.remove('hidden');
    
    // Update active nav item
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    document.getElementById(`nav-${section}`).classList.add('active');
    
    // Update page title
    const titles = {
        overview: 'Обзор',
        portfolio: 'Мой портфель',
        invest: 'Инвестировать',
        transactions: 'Транзакции',
        analytics: 'Аналитика',
        settings: 'Настройки'
    };
    document.getElementById('pageTitle').textContent = titles[section];
    
    // Refresh charts if needed
    if (section === 'analytics') {
        initAnalyticsCharts();
    }
}

// Initialize portfolio charts
function initPortfolioCharts() {
    const ctx1 = document.getElementById('portfolioChart')?.getContext('2d');
    if (ctx1) {
        if (portfolioChart) portfolioChart.destroy();
        portfolioChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: portfolioData.map(a => a.asset_name),
                datasets: [{
                    data: portfolioData.map(a => parseFloat(a.investment_amount)),
                    backgroundColor: ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } }
            }
        });
    }
    
    const ctx2 = document.getElementById('yieldChart')?.getContext('2d');
    if (ctx2) {
        if (yieldChart) yieldChart.destroy();
        const monthlyData = portfolioData.map(a => (a.investment_amount * a.yield_rate / 100) / 12);
        yieldChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: portfolioData.map(a => a.asset_name),
                datasets: [{
                    label: 'Ежемесячный доход (SOL)',
                    data: monthlyData,
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }
            }
        });
    }
}

// Initialize analytics charts
function initAnalyticsCharts() {
    const monthlyData = [12, 19, 15, 22, 28, 35];
    const growthData = [100, 125, 140, 168, 195, 230];
    const forecastData = [35, 42, 48, 55, 63, 72, 82, 93, 105, 118, 132, 148];
    
    const ctx1 = document.getElementById('monthlyYieldChart')?.getContext('2d');
    if (ctx1) {
        if (monthlyYieldChart) monthlyYieldChart.destroy();
        monthlyYieldChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
                datasets: [{
                    label: 'Доходность (SOL)',
                    data: monthlyData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }
            }
        });
    }
    
    const ctx2 = document.getElementById('portfolioGrowthChart')?.getContext('2d');
    if (ctx2) {
        if (portfolioGrowthChart) portfolioGrowthChart.destroy();
        portfolioGrowthChart = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Месяц 1', 'Месяц 2', 'Месяц 3', 'Месяц 4', 'Месяц 5', 'Месяц 6'],
                datasets: [{
                    label: 'Рост портфеля (SOL)',
                    data: growthData,
                    borderColor: '#10b981',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }
            }
        });
    }
    
    const ctx3 = document.getElementById('forecastChart')?.getContext('2d');
    if (ctx3) {
        if (forecastChart) forecastChart.destroy();
        forecastChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: Array.from({length: 12}, (_, i) => `Месяц ${i+1}`),
                datasets: [{
                    label: 'Прогноз доходности (SOL)',
                    data: forecastData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#fff' } } },
                scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }
            }
        });
    }
}

// Asset details modal
function showAssetDetails(assetId) {
    const asset = portfolioData.find(a => a.asset_id === assetId);
    if (asset) {
        showNotification(`Детали актива "${asset.asset_name}" будут доступны в следующем обновлении`, 'info');
    }
}

// Sell asset
function sellAsset(assetId) {
    showNotification('Функция продажи будет доступна в следующем обновлении', 'info');
}

// Settings form
document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('settingsUsername').value;
            const email = document.getElementById('settingsEmail').value;
            const walletAddress = document.getElementById('settingsWallet').value;
            await updateUserSettings(username, email, walletAddress);
        });
    }
    
    // Load user data into settings form if on dashboard
    if (document.getElementById('settingsUsername')) {
        document.getElementById('settingsUsername').value = currentUser?.username || '';
        document.getElementById('settingsEmail').value = currentUser?.email || '';
        document.getElementById('settingsWallet').value = currentUser?.wallet_address || '';
    }
    
    initDashboard();
});