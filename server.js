const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const app = express();
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assetflow'
};

// Solana connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Create asset endpoint
app.post('/api/assets', async (req, res) => {
    try {
        const { name, symbol, totalSupply, pricePerToken, yieldRate, location, type } = req.body;
        
        // Create database connection
        const db = await mysql.createConnection(dbConfig);
        
        // Insert asset into database
        const [result] = await db.execute(
            `INSERT INTO assets (name, type, location, total_tokens, price_per_token, yield_rate) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, type, location, totalSupply, pricePerToken, yieldRate]
        );
        
        await db.end();
        
        res.json({
            success: true,
            assetId: result.insertId,
            message: 'Asset created successfully'
        });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all assets endpoint
app.get('/api/assets', async (req, res) => {
    try {
        const db = await mysql.createConnection(dbConfig);
        const [assets] = await db.execute('SELECT * FROM assets ORDER BY created_at DESC');
        await db.end();
        
        res.json({ success: true, data: assets });
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: error.message });
    }
});

// Purchase tokens endpoint
app.post('/api/purchase', async (req, res) => {
    try {
        const { walletAddress, assetId, tokenAmount, transactionHash } = req.body;
        
        const db = await mysql.createConnection(dbConfig);
        
        // Get user or create new
        let [users] = await db.execute(
            'SELECT id FROM users WHERE wallet_address = ?',
            [walletAddress]
        );
        
        let userId;
        if (users.length === 0) {
            const [result] = await db.execute(
                'INSERT INTO users (wallet_address) VALUES (?)',
                [walletAddress]
            );
            userId = result.insertId;
        } else {
            userId = users[0].id;
        }
        
        // Record investment
        const [result] = await db.execute(
            `INSERT INTO investments (user_id, asset_id, token_amount, transaction_hash, status)
             VALUES (?, ?, ?, ?, 'completed')`,
            [userId, assetId, tokenAmount, transactionHash]
        );
        
        await db.end();
        
        res.json({
            success: true,
            investmentId: result.insertId,
            message: 'Purchase completed successfully'
        });
    } catch (error) {
        console.error('Error processing purchase:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user portfolio endpoint
app.get('/api/portfolio/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        const db = await mysql.createConnection(dbConfig);
        
        const [investments] = await db.execute(
            `SELECT i.*, a.name as asset_name, a.type, a.price_per_token, a.yield_rate
             FROM investments i
             JOIN assets a ON i.asset_id = a.id
             WHERE i.user_id = (SELECT id FROM users WHERE wallet_address = ?)
             AND i.status = 'completed'`,
            [wallet]
        );
        
        await db.end();
        
        res.json({ success: true, data: investments });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get market stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const db = await mysql.createConnection(dbConfig);
        
        const [totalAssets] = await db.execute('SELECT COUNT(*) as count FROM assets');
        const [totalInvestments] = await db.execute('SELECT SUM(investment_amount) as total FROM investments WHERE status = "completed"');
        const [totalInvestors] = await db.execute('SELECT COUNT(DISTINCT user_id) as count FROM investments WHERE status = "completed"');
        
        await db.end();
        
        res.json({
            success: true,
            data: {
                totalAssets: totalAssets[0].count,
                totalInvestments: totalInvestments[0].total || 0,
                totalInvestors: totalInvestors[0].count || 0
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});