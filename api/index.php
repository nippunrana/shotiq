<?php
/**
 * ShotIQ Secure API Proxy
 * Handles Gemini API calls server-side to protect API keys.
 */

header('Content-Type: application/json');

// 0. Handle GET request for key status info
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $serverKeySet = false;
    $maskedKey = '';

    $sysKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');
    if ($sysKey && $sysKey !== 'YOUR_GEMINI_API_KEY_HERE') {
        $serverKeySet = true;
        $maskedKey = '****' . substr($sysKey, -4);
    } else {
        $envFile = __DIR__ . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), 'GEMINI_API_KEY') === 0) {
                    $parts = explode('=', $line, 2);
                    $val = trim($parts[1] ?? '');
                    if ($val && $val !== 'YOUR_GEMINI_API_KEY_HERE') {
                        $serverKeySet = true;
                        $maskedKey = '****' . substr($val, -4);
                    }
                    break;
                }
            }
        }
    }
    echo json_encode(['serverKeySet' => $serverKeySet, 'maskedKey' => $maskedKey]);
    exit;
}

// 1. Load Server API Key
$serverKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');

if (!$serverKey) {
    $envFile = __DIR__ . '/.env';
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
$browserKey = $_SERVER['HTTP_X_GEMINI_API_KEY'] ?? '';
$requestedSource = $_SERVER['HTTP_X_API_SOURCE'] ?? 'auto';

$apiKey = '';

if ($requestedSource === 'server') {
    $apiKey = ($serverKey !== 'YOUR_GEMINI_API_KEY_HERE') ? $serverKey : '';
} elseif ($requestedSource === 'browser') {
    $apiKey = $browserKey;
} else {
    // Auto-fallback logic
    if ($serverKey && $serverKey !== 'YOUR_GEMINI_API_KEY_HERE') {
        $apiKey = $serverKey;
    } else {
        $apiKey = $browserKey;
    }
}

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
