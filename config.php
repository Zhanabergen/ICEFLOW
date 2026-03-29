<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'assetflow');
define('DB_USER', 'root');
define('DB_PASS', '');

// Solana configuration
define('SOLANA_RPC_URL', 'https://api.devnet.solana.com');
define('SOLANA_PROGRAM_ID', 'AssetFlow111111111111111111111111111111111');

// Application configuration
define('APP_NAME', 'AssetFlow');
define('APP_VERSION', '2.0.0');

// Security
define('JWT_SECRET', 'assetflow-secret-key-2026');

// Platform fee (1%)
define('PLATFORM_FEE', 0.01);
?>