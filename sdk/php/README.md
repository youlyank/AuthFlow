# AuthFlow PHP SDK

Official PHP SDK for AuthFlow authentication platform.

## Installation

```bash
composer require authflow/authflow-php
```

## Usage

```php
<?php

require 'vendor/autoload.php';

use Authflow\AuthflowClient;

// Initialize client
$client = new AuthflowClient('https://your-domain.com', 'your-tenant-slug');

// Register a new user
$user = $client->register([
    'email' => 'user@example.com',
    'password' => 'SecurePassword123!',
    'firstName' => 'John',
    'lastName' => 'Doe',
]);

// Login
$response = $client->login('user@example.com', 'SecurePassword123!');
echo "Logged in as: " . $response['user']['email'] . "\n";

// Get current user
$currentUser = $client->getCurrentUser();
echo "Current user: " . $currentUser['email'] . "\n";

// Enable MFA
$mfaSetup = $client->enableMFATOTP();
echo "MFA Secret: " . $mfaSetup['secret'] . "\n";
echo "QR Code: " . $mfaSetup['qrCode'] . "\n";

// Verify MFA
$client->verifyMFATOTP('123456');

// Create API Key
$apiKey = $client->createAPIKey('My API Key');
echo "API Key: " . $apiKey['key'] . "\n";
```

## Features

- Email/Password Authentication
- Multi-Factor Authentication (TOTP, Email, SMS)
- WebAuthn/Passkeys
- Magic Links
- OAuth2/OIDC
- API Key Management
- Session Management

## Documentation

Visit [https://docs.authflow.com](https://docs.authflow.com) for full documentation.

## License

MIT
