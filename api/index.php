<?php
/**
 * ShotIQ Secure API Proxy
 * Handles Gemini API calls server-side to protect API keys.
 */

header('Content-Type: application/json');

// 1. Load Server API Key
$serverKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');

if (!$serverKey) {
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2 && trim($parts[0]) === 'GEMINI_API_KEY') {
                $serverKey = trim($parts[1]);
            }
        }
    }
}
$apiKey = ($serverKey && $serverKey !== 'YOUR_GEMINI_API_KEY_HERE') ? $serverKey : '';

// Final validation
if (!$apiKey) {
    http_response_code(401);
    echo json_encode([
        'error' => 'API_KEY_REQUIRED',
        'message' => 'No valid API Key found for the selected source.'
    ]);
    exit;
}

// 2. Handle the request
$requestData = file_get_contents('php://input');
$decoded = json_decode($requestData, true);

if (!$decoded) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload received.']);
    exit;
}

// 3. Forward to Google Gemini API
$url = "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestData);

// Set timeouts (AI video analysis can be slow)
curl_setopt($ch, CURLOPT_TIMEOUT, 90);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// 4. Return the result
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Backend Communication Error: ' . $error]);
    exit;
}

http_response_code($httpCode);
echo $response;
