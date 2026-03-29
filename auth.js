// Authentication System
const API_URL = '/php/api.php';

// User data
let currentUser = null;

// Check if user is logged in
function checkAuth() {
    const user = localStorage.getItem('assetflow_user');
    if (user) {
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Register user
async function registerUser(username, email, password, walletAddress = null) {
    try {
        const response = await fetch(`${API_URL}?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, walletAddress })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Auto login after registration
            currentUser = data.user;
            localStorage.setItem('assetflow_user', JSON.stringify(currentUser));
            showNotification('Регистрация успешна!', 'success');
            window.location.href = 'dashboard.html';
            return true;
        } else {
            showNotification(data.error || 'Ошибка регистрации', 'error');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Ошибка сервера', 'error');
        return false;
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('assetflow_user', JSON.stringify(currentUser));
            showNotification('Добро пожаловать!', 'success');
            window.location.href = 'dashboard.html';
            return true;
        } else {
            showNotification(data.error || 'Неверный email или пароль', 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка сервера', 'error');
        return false;
    }
}

// Login with Solana wallet
async function loginWithSolana() {
    try {
        if (window.solana && window.solana.isPhantom) {
            const response = await window.solana.connect();
            const walletAddress = response.publicKey.toString();
            
            // Check if user exists with this wallet
            const checkResponse = await fetch(`${API_URL}?action=checkWallet&wallet=${walletAddress}`);
            const checkData = await checkResponse.json();
            
            if (checkData.exists) {
                currentUser = checkData.user;
                localStorage.setItem('assetflow_user', JSON.stringify(currentUser));
                showNotification('Вход выполнен!', 'success');
                window.location.href = 'dashboard.html';
            } else {
                // Redirect to registration with wallet pre-filled
                window.location.href = `register.html?wallet=${walletAddress}`;
            }
        } else {
            window.open('https://phantom.app/', '_blank');
        }
    } catch (error) {
        console.error('Solana login error:', error);
        showNotification('Ошибка подключения кошелька', 'error');
    }
}

// Logout
function logout() {
    localStorage.removeItem('assetflow_user');
    currentUser = null;
    window.location.href = 'index.html';
}

// Update user settings
async function updateUserSettings(username, email, walletAddress) {
    try {
        const response = await fetch(`${API_URL}?action=updateUser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                username,
                email,
                walletAddress
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('assetflow_user', JSON.stringify(currentUser));
            showNotification('Настройки сохранены!', 'success');
            return true;
        } else {
            showNotification(data.error || 'Ошибка сохранения', 'error');
            return false;
        }
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Ошибка сервера', 'error');
        return false;
    }
}

// Get user portfolio
async function getUserPortfolio(userId) {
    try {
        const response = await fetch(`${API_URL}?action=portfolio&userId=${userId}`);
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return [];
    }
}

// Get user transactions
async function getUserTransactions(userId) {
    try {
        const response = await fetch(`${API_URL}?action=transactions&userId=${userId}`);
        const data = await response.json();
        return data.success ? data.data : [];
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white font-medium`;
    notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const walletAddress = document.getElementById('walletAddress')?.value;
            
            if (password !== confirmPassword) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            await registerUser(username, email, password, walletAddress);
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await loginUser(email, password);
        });
    }
    
    // Solana login button
    const solanaLoginBtn = document.getElementById('solanaLoginBtn');
    if (solanaLoginBtn) {
        solanaLoginBtn.addEventListener('click', loginWithSolana);
    }
    
    // Check URL for wallet param (from registration)
    const urlParams = new URLSearchParams(window.location.search);
    const walletParam = urlParams.get('wallet');
    if (walletParam && document.getElementById('walletAddress')) {
        document.getElementById('walletAddress').value = walletParam;
    }
});