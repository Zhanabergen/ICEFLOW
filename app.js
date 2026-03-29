// AssetFlow Main Application Logic

// Asset Data Structure
class Asset {
    constructor(id, name, type, location, totalTokens, pricePerToken, yield, image) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.location = location;
        this.totalTokens = totalTokens;
        this.soldTokens = 0;
        this.pricePerToken = pricePerToken;
        this.yield = yield;
        this.image = image;
        this.mintAddress = null;
        this.investors = [];
    }
    
    getAvailableTokens() {
        return this.totalTokens - this.soldTokens;
    }
    
    getFundingPercentage() {
        return (this.soldTokens / this.totalTokens) * 100;
    }
}

// Portfolio Manager
class PortfolioManager {
    constructor() {
        this.assets = [];
        this.userAssets = [];
        this.loadAssets();
    }
    
    loadAssets() {
        // Sample assets data
        this.assets = [
            new Asset(
                '1',
                'Downtown Loft',
                'Residential',
                'New York, Soho',
                1000,
                250,
                8.5,
                'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'
            ),
            new Asset(
                '2',
                'Beachfront Villa',
                'Residential',
                'Miami Beach',
                500,
                500,
                12.0,
                'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400'
            ),
            new Asset(
                '3',
                'Commercial Tower',
                'Commercial',
                'Dubai, DIFC',
                2000,
                1000,
                15.0,
                'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
            )
        ];
    }
    
    async purchaseAsset(assetId, tokenAmount, pricePerToken) {
        if (!isWalletConnected()) {
            showNotification('Пожалуйста, подключите кошелек', 'error');
            return false;
        }
        
        try {
            const totalCost = tokenAmount * pricePerToken;
            const balance = await getWalletBalance(publicKey);
            
            if (balance < totalCost) {
                showNotification('Недостаточно средств на кошельке', 'error');
                return false;
            }
            
            // Here you would call the smart contract to purchase tokens
            // For demo, we'll simulate the transaction
            showNotification(`Покупка ${tokenAmount} токенов на сумму ${totalCost} SOL`, 'info');
            
            // Simulate transaction delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update portfolio
            const asset = this.assets.find(a => a.id === assetId);
            if (asset) {
                this.userAssets.push({
                    assetId: assetId,
                    tokenAmount: tokenAmount,
                    purchasePrice: totalCost,
                    purchaseDate: new Date()
                });
            }
            
            showNotification('Покупка успешно завершена!', 'success');
            return true;
        } catch (error) {
            console.error('Purchase error:', error);
            showNotification('Ошибка при покупке', 'error');
            return false;
        }
    }
    
    getTotalInvestment() {
        return this.userAssets.reduce((total, asset) => total + asset.purchasePrice, 0);
    }
    
    getEstimatedYield() {
        let totalYield = 0;
        this.userAssets.forEach(userAsset => {
            const asset = this.assets.find(a => a.id === userAsset.assetId);
            if (asset) {
                totalYield += (userAsset.purchasePrice * asset.yield) / 100;
            }
        });
        return totalYield;
    }
}

// Initialize application
const portfolio = new PortfolioManager();

// Dashboard functionality
async function loadDashboard() {
    if (!isWalletConnected()) {
        return;
    }
    
    const totalInvestment = portfolio.getTotalInvestment();
    const estimatedYield = portfolio.getEstimatedYield();
    
    // Update dashboard stats
    const totalElement = document.getElementById('totalInvestment');
    const yieldElement = document.getElementById('estimatedYield');
    
    if (totalElement) totalElement.textContent = `${totalInvestment.toFixed(2)} SOL`;
    if (yieldElement) yieldElement.textContent = `${estimatedYield.toFixed(2)} SOL/year`;
    
    // Load user assets
    const assetsContainer = document.getElementById('userAssets');
    if (assetsContainer && portfolio.userAssets.length > 0) {
        assetsContainer.innerHTML = '';
        portfolio.userAssets.forEach(userAsset => {
            const asset = portfolio.assets.find(a => a.id === userAsset.assetId);
            if (asset) {
                const card = createAssetCard(asset, userAsset.tokenAmount);
                assetsContainer.appendChild(card);
            }
        });
    }
}

function createAssetCard(asset, amount) {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 rounded-xl p-6';
    div.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-bold text-white">${asset.name}</h3>
            <span class="text-purple-400">${amount} токенов</span>
        </div>
        <div class="text-gray-400 text-sm mb-2">${asset.location}</div>
        <div class="flex justify-between text-sm mb-4">
            <span class="text-green-400">Доходность: ${asset.yield}% APY</span>
            <span class="text-gray-400">Стоимость: ${asset.pricePerToken} SOL</span>
        </div>
        <button class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
            Управлять
        </button>
    `;
    return div;
}

// Create Asset Form Handler
async function handleCreateAsset(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const assetData = {
        name: formData.get('name'),
        type: formData.get('type'),
        location: formData.get('location'),
        totalSupply: parseInt(formData.get('totalSupply')),
        pricePerToken: parseFloat(formData.get('price')),
        symbol: formData.get('name').substring(0, 5).toUpperCase()
    };
    
    const result = await createToken(
        assetData.name,
        assetData.symbol,
        assetData.totalSupply
    );
    
    if (result) {
        showNotification('Актив успешно создан!', 'success');
        event.target.reset();
    }
}

// Search and Filter Assets
function filterAssets(searchTerm) {
    const filtered = portfolio.assets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
}

// Analytics Functions
function getMarketStats() {
    const totalAssets = portfolio.assets.length;
    const totalTokensSold = portfolio.assets.reduce((sum, asset) => sum + asset.soldTokens, 0);
    const totalValue = portfolio.assets.reduce((sum, asset) => sum + (asset.soldTokens * asset.pricePerToken), 0);
    
    return {
        totalAssets,
        totalTokensSold,
        totalValue,
        activeInvestors: 1284
    };
}

// Export functions for global use
window.portfolio = portfolio;
window.createAsset = handleCreateAsset;
window.filterAssets = filterAssets;
window.getMarketStats = getMarketStats;
window.loadDashboard = loadDashboard;