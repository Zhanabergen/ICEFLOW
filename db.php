<?php
class Database {
    private $pdo;
    
    public function __construct() {
        try {
            $this->pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
                DB_USER,
                DB_PASS
            );
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->createTables();
        } catch(PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
    }
    
    private function createTables() {
        // Users table
        $sql = "CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            wallet_address VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )";
        $this->pdo->exec($sql);
        
        // Assets table
        $sql = "CREATE TABLE IF NOT EXISTS assets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            location VARCHAR(255),
            total_tokens INT NOT NULL,
            sold_tokens INT DEFAULT 0,
            price_per_token DECIMAL(20,9) NOT NULL,
            yield_rate DECIMAL(5,2),
            image_url TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        $this->pdo->exec($sql);
        
        // Investments table
        $sql = "CREATE TABLE IF NOT EXISTS investments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            asset_id INT NOT NULL,
            token_amount INT NOT NULL,
            investment_amount DECIMAL(20,9) NOT NULL,
            current_price DECIMAL(20,9),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
        )";
        $this->pdo->exec($sql);
        
        // Transactions table
        $sql = "CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            asset_id INT,
            type ENUM('buy', 'sell', 'yield') NOT NULL,
            token_amount INT NOT NULL,
            amount DECIMAL(20,9) NOT NULL,
            transaction_hash VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
        )";
        $this->pdo->exec($sql);
        
        // Insert sample assets if empty
        $stmt = $this->pdo->query("SELECT COUNT(*) FROM assets");
        $count = $stmt->fetchColumn();
        
        if ($count == 0) {
            $sampleAssets = [
                ['Downtown Loft', 'residential', 'Нью-Йорк, Сохо', 1000, 250, 8.5, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'],
                ['Beachfront Villa', 'residential', 'Майами, Бич', 500, 500, 12.0, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400'],
                ['Commercial Tower', 'commercial', 'Дубай, DIFC', 2000, 1000, 15.0, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400']
            ];
            
            $stmt = $this->pdo->prepare("INSERT INTO assets (name, type, location, total_tokens, price_per_token, yield_rate, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($sampleAssets as $asset) {
                $stmt->execute($asset);
            }
        }
    }
    
    public function registerUser($username, $email, $password, $walletAddress = null) {
        // Check if user exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $username]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'Пользователь с таким email или именем уже существует'];
        }
        
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("INSERT INTO users (username, email, password, wallet_address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $email, $hashedPassword, $walletAddress]);
        
        $userId = $this->pdo->lastInsertId();
        
        return [
            'success' => true,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => $email,
                'wallet_address' => $walletAddress
            ]
        ];
    }
    
    public function loginUser($email, $password) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);
            return ['success' => true, 'user' => $user];
        }
        
        return ['success' => false, 'error' => 'Неверный email или пароль'];
    }
    
    public function getUserByWallet($wallet) {
        $stmt = $this->pdo->prepare("SELECT id, username, email, wallet_address FROM users WHERE wallet_address = ?");
        $stmt->execute([$wallet]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function updateUser($userId, $data) {
        $fields = [];
        $values = [];
        
        if (isset($data['username'])) {
            $fields[] = "username = ?";
            $values[] = $data['username'];
        }
        if (isset($data['email'])) {
            $fields[] = "email = ?";
            $values[] = $data['email'];
        }
        if (isset($data['walletAddress'])) {
            $fields[] = "wallet_address = ?";
            $values[] = $data['walletAddress'];
        }
        
        if (empty($fields)) {
            return ['success' => false, 'error' => 'No fields to update'];
        }
        
        $values[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($values);
        
        // Get updated user
        $stmt = $this->pdo->prepare("SELECT id, username, email, wallet_address FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return ['success' => true, 'user' => $user];
    }
    
    public function getAllAssets() {
        $stmt = $this->pdo->query("SELECT * FROM assets ORDER BY created_at DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getAssetById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM assets WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function getUserPortfolio($userId) {
        $stmt = $this->pdo->prepare("
            SELECT i.*, a.name as asset_name, a.type, a.price_per_token, a.yield_rate, a.image_url
            FROM investments i
            JOIN assets a ON i.asset_id = a.id
            WHERE i.user_id = ?
            ORDER BY i.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getUserTransactions($userId) {
        $stmt = $this->pdo->prepare("
            SELECT t.*, a.name as asset_name
            FROM transactions t
            LEFT JOIN assets a ON t.asset_id = a.id
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function recordInvestment($data) {
        try {
            $this->pdo->beginTransaction();
            
            // Record investment
            $stmt = $this->pdo->prepare("
                INSERT INTO investments (user_id, asset_id, token_amount, investment_amount, current_price)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['userId'],
                $data['assetId'],
                $data['tokenAmount'],
                $data['investmentAmount'],
                $data['pricePerToken'] ?? null
            ]);
            
            // Record transaction
            $stmt = $this->pdo->prepare("
                INSERT INTO transactions (user_id, asset_id, type, token_amount, amount)
                VALUES (?, ?, 'buy', ?, ?)
            ");
            $stmt->execute([
                $data['userId'],
                $data['assetId'],
                $data['tokenAmount'],
                $data['investmentAmount']
            ]);
            
            // Update asset sold tokens
            $stmt = $this->pdo->prepare("
                UPDATE assets SET sold_tokens = sold_tokens + ? WHERE id = ?
            ");
            $stmt->execute([$data['tokenAmount'], $data['assetId']]);
            
            $this->pdo->commit();
            
            return ['success' => true, 'message' => 'Investment recorded successfully'];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function updateAsset($id, $data) {
        $fields = [];
        $values = [];
        
        $allowedFields = ['name', 'type', 'location', 'total_tokens', 'price_per_token', 'yield_rate', 'image_url', 'description'];
        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = "UPDATE assets SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }
}
?>