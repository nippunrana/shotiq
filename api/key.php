<?php
/**
 * ShotIQ - Secure API Key Provider
 * 
 * Returns the Gemini API key stored in server environment variables.
 * The frontend calls Gemini directly (to avoid Vercel's 4.5MB body limit
 * which blocks video uploads through serverless functions).
 * 
 * Security: The API key is stored as a Vercel Environment Variable,
 * never hardcoded in source code. For production, restrict the key
 * via Google Cloud Console to specific referrers/IPs.
 */

ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load API key from Vercel environment variable
$apiKey = getenv('GEMINI_API_KEY') ?: ($_ENV['GEMINI_API_KEY'] ?? '');

// Fallback to .env file for local development
if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    $envFile = __DIR__ . '/../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2 && trim($parts[0]) === 'GEMINI_API_KEY') {
                $apiKey = trim($parts[1]);
            }
        }
    }
}

if (!$apiKey || $apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured on server. Set GEMINI_API_KEY in Vercel Environment Variables.']);
    exit;
}

echo json_encode(['key' => $apiKey]);
