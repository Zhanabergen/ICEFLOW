// Solana Web3 Integration with Dashboard Navigation

const connection = new solanaWeb3.Connection(
    solanaWeb3.clusterApiUrl('devnet'),
    'confirmed'
);

let wallet;
let publicKey;

// Connect wallet and redirect to dashboard
async function connectWalletAndGoToDashboard() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            wallet = window.solana;
            publicKey = response.publicKey;
            
            // Save wallet info to localStorage
            localStorage.setItem('assetflow_wallet', publicKey.toString());
            
            // Show success notification
            showNotification('Кошелек подключен! Перенаправление...', 'success');
            
            // Redirect to dashboard with wallet param
            setTimeout(() => {
                window.location.href = `dashboard.html?wallet=${publicKey.toString()}`;
            }, 1000);
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showNotification('Ошибка подключения кошелька', 'error');
    }
}

// Connect wallet without redirect (for staying on current page)
async function connectWallet() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            wallet = window.solana;
            publicKey = response.publicKey;
            
            localStorage.setItem('assetflow_wallet', publicKey.toString());
            showNotification('Кошелек подключен!', 'success');
            
            // Update UI if on dashboard
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.reload();
            }
            
            return true;
        } else {
            window.open('https://phantom.app/', '_blank');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Ошибка подключения', 'error');
        return false;
    }
}

// Check if wallet is connected
function isWalletConnected() {
    return wallet && publicKey;
}

// Get wallet balance
async function getWalletBalance(address) {
    try {
        const balance = await connection.getBalance(address);
        return balance / solanaWeb3.LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error getting balance:', error);
        return 0;
    }
}

// Create token for asset tokenization
async function createToken(assetName, symbol, totalSupply, decimals = 9) {
    if (!isWalletConnected()) {
        showNotification('Пожалуйста, подключите кошелек', 'error');
        return null;
    }
    
    try {
        showNotification('Создание токена...', 'info');
        
        const mintAccount = solanaWeb3.Keypair.generate();
        
        const lamports = await connection.getMinimumBalanceForRentExemption(
            splToken.MINT_SIZE
        );
        
        const createAccountInstruction = solanaWeb3.SystemProgram.createAccount({
            fromPubkey: publicKey,
            newAccountPubkey: mintAccount.publicKey,
            space: splToken.MINT_SIZE,
            lamports: lamports,
            programId: splToken.TOKEN_PROGRAM_ID
        });
        
        const initializeMintInstruction = splToken.createInitializeMintInstruction(
            mintAccount.publicKey,
            decimals,
            publicKey,
            publicKey,
            splToken.TOKEN_PROGRAM_ID
        );
        
        const transaction = new solanaWeb3.Transaction().add(
            createAccountInstruction,
            initializeMintInstruction
        );
        
        const signature = await solanaWeb3.sendAndConfirmTransaction(
            connection,
            transaction,
            [mintAccount, wallet]
        );
        
        showNotification(`Токен ${symbol} создан успешно!`, 'success');
        
        return {
            mintAddress: mintAccount.publicKey.toString(),
            signature: signature
        };
    } catch (error) {
        console.error('Error creating token:', error);
        showNotification('Ошибка создания токена', 'error');
        return null;
    }
}

// Purchase asset tokens
async function purchaseAsset(assetId, tokenAmount, pricePerToken, assetName) {
    if (!isWalletConnected()) {
        showNotification('Пожалуйста, подключите кошелек', 'error');
        return false;
    }
    
    try {
        const totalCost = tokenAmount * pricePerToken;
        const balance = await getWalletBalance(publicKey);
        
        if (balance < totalCost) {
            showNotification(`Недостаточно средств. Нужно ${totalCost} SOL`, 'error');
            return false;
        }
        
        showNotification(`Покупка ${tokenAmount} токенов за ${totalCost} SOL...`, 'info');
        
        // Simulate transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Save to portfolio
        const walletAddress = publicKey.toString();
        let portfolio = localStorage.getItem(`portfolio_${walletAddress}`);
        let userAssets = portfolio ? JSON.parse(portfolio) : [];
        
        // Check if already owns this asset
        const existingAsset = userAssets.find(a => a.asset_id === assetId);
        if (existingAsset) {
            existingAsset.token_amount += tokenAmount;
            existingAsset.investment_amount += totalCost;
        } else {
            userAssets.push({
                asset_id: assetId,
                asset_name: assetName,
                token_amount: tokenAmount,
                investment_amount: totalCost,
                yield_rate: pricePerToken === 250 ? 8.5 : pricePerToken === 500 ? 12 : 15
            });
        }
        
        localStorage.setItem(`portfolio_${walletAddress}`, JSON.stringify(userAssets));
        
        showNotification('Покупка успешно завершена!', 'success');
        
        // Redirect to dashboard after purchase
        setTimeout(() => {
            window.location.href = `dashboard.html?wallet=${walletAddress}`;
        }, 1500);
        
        return true;
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Ошибка при покупке', 'error');
        return false;
    }
}

// UI Helpers
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white font-medium`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Export for global use
window.connectWallet = connectWallet;
window.connectWalletAndGoToDashboard = connectWalletAndGoToDashboard;
window.purchaseAsset = purchaseAsset;
window.createToken = createToken;
window.getWalletBalance = getWalletBalance;
window.isWalletConnected = isWalletConnected;