<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

$db = new Database();

switch($method) {
    case 'GET':
        handleGet($db, $action);
        break;
    case 'POST':
        handlePost($db, $action);
        break;
    case 'PUT':
        handlePut($db, $action);
        break;
    default:
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function handleGet($db, $action) {
    switch($action) {
        case 'assets':
            $assets = $db->getAllAssets();
            echo json_encode(['success' => true, 'data' => $assets]);
            break;
        case 'asset':
            $id = isset($_GET['id']) ? $_GET['id'] : null;
            if ($id) {
                $asset = $db->getAssetById($id);
                echo json_encode(['success' => true, 'data' => $asset]);
            } else {
                echo json_encode(['error' => 'Asset ID required']);
            }
            break;
        case 'portfolio':
            $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
            if ($userId) {
                $portfolio = $db->getUserPortfolio($userId);
                echo json_encode(['success' => true, 'data' => $portfolio]);
            } else {
                echo json_encode(['error' => 'User ID required']);
            }
            break;
        case 'transactions':
            $userId = isset($_GET['userId']) ? $_GET['userId'] : null;
            if ($userId) {
                $transactions = $db->getUserTransactions($userId);
                echo json_encode(['success' => true, 'data' => $transactions]);
            } else {
                echo json_encode(['error' => 'User ID required']);
            }
            break;
        case 'checkWallet':
            $wallet = isset($_GET['wallet']) ? $_GET['wallet'] : null;
            if ($wallet) {
                $user = $db->getUserByWallet($wallet);
                if ($user) {
                    echo json_encode(['exists' => true, 'user' => $user]);
                } else {
                    echo json_encode(['exists' => false]);
                }
            } else {
                echo json_encode(['error' => 'Wallet address required']);
            }
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePost($db, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch($action) {
        case 'register':
            if ($data && isset($data['username']) && isset($data['email']) && isset($data['password'])) {
                $result = $db->registerUser($data['username'], $data['email'], $data['password'], $data['walletAddress'] ?? null);
                echo json_encode($result);
            } else {
                echo json_encode(['error' => 'Missing required fields']);
            }
            break;
        case 'login':
            if ($data && isset($data['email']) && isset($data['password'])) {
                $result = $db->loginUser($data['email'], $data['password']);
                echo json_encode($result);
            } else {
                echo json_encode(['error' => 'Email and password required']);
            }
            break;
        case 'updateUser':
            if ($data && isset($data['userId'])) {
                $result = $db->updateUser($data['userId'], $data);
                echo json_encode($result);
            } else {
                echo json_encode(['error' => 'User ID required']);
            }
            break;
        case 'invest':
            if ($data && isset($data['userId']) && isset($data['assetId']) && isset($data['tokenAmount']) && isset($data['investmentAmount'])) {
                $result = $db->recordInvestment($data);
                echo json_encode($result);
            } else {
                echo json_encode(['error' => 'Missing investment data']);
            }
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}

function handlePut($db, $action) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch($action) {
        case 'updateAsset':
            if ($data && isset($data['id'])) {
                $result = $db->updateAsset($data['id'], $data);
                echo json_encode(['success' => true, 'data' => $result]);
            } else {
                echo json_encode(['error' => 'Invalid data']);
            }
            break;
        default:
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
}
?>