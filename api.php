<?php
/**
 * ShotIQ Secure API Proxy
 * Handles Gemini API calls server-side to protect API keys.
 */

header('Content-Type: application/json');

// 1. Load .env file manually (minimalist approach)
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server Configuration Error: .env file missing.']);
    exit;
}

$env = [];
$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
foreach ($lines as $line) {
    // Skip comments
    if (strpos(trim($line), '#') === 0) continue;
    
    // Split into name and value
    $parts = explode('=', $line, 2);
    if (count($parts) === 2) {
        $env[trim($parts[0])] = trim($parts[1]);
    }
}

$apiKey = $env['GEMINI_API_KEY'] ?? '';

// Check if API Key is in .env; if not, check for header fallback from frontend
if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    $fallbackKey = $_SERVER['HTTP_X_GEMINI_API_KEY'] ?? '';
    
    if ($fallbackKey) {
        $apiKey = $fallbackKey;
    } else {
        http_response_code(401);
        echo json_encode([
            'error' => 'API_KEY_REQUIRED',
            'message' => 'No API Key found. Please add it to the server .env file or enter it in the settings.'
        ]);
        exit;
    }
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
