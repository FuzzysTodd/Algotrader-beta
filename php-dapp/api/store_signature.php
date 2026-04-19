<?php
declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);

$address = $data['address'] ?? '';
$signature = $data['signature'] ?? '';

if (!is_string($address) || !preg_match('/^0x[a-fA-F0-9]{40}$/', $address)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid Ethereum address']);
    exit;
}

if (!is_string($signature) || strlen($signature) < 20) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

$databasePath = dirname(__DIR__) . '/storage/dapp.sqlite';

try {
    $pdo = new PDO('sqlite:' . $databasePath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec('CREATE TABLE IF NOT EXISTS wallet_signatures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        signature TEXT NOT NULL,
        created_at TEXT NOT NULL
    )');

    $createdAt = gmdate('c');

    $statement = $pdo->prepare('INSERT INTO wallet_signatures (address, signature, created_at) VALUES (:address, :signature, :created_at)');
    $statement->execute([
        ':address' => strtolower($address),
        ':signature' => $signature,
        ':created_at' => $createdAt,
    ]);

    echo json_encode([
        'ok' => true,
        'data' => [
            'id' => (int) $pdo->lastInsertId(),
            'address' => strtolower($address),
            'created_at' => $createdAt,
        ],
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to persist signature']);
}
