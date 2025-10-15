<?php

namespace AuthFlow\Laravel;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use GuzzleHttp\Client;

/**
 * AuthFlow Laravel SDK
 * Official Laravel integration for AuthFlow authentication
 * 
 * Installation:
 * composer require authflow/laravel-sdk
 * 
 * Configuration:
 * Add to config/services.php:
 * 'authflow' => [
 *     'domain' => env('AUTHFLOW_DOMAIN'),
 *     'client_id' => env('AUTHFLOW_CLIENT_ID'),
 *     'client_secret' => env('AUTHFLOW_CLIENT_SECRET'),
 * ]
 */

class AuthFlowServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(AuthFlowClient::class, function ($app) {
            return new AuthFlowClient(
                config('services.authflow.domain'),
                config('services.authflow.client_id'),
                config('services.authflow.client_secret')
            );
        });
    }

    public function boot()
    {
        // Publish configuration
        $this->publishes([
            __DIR__.'/config/authflow.php' => config_path('authflow.php'),
        ], 'authflow-config');

        // Register middleware
        $this->app['router']->aliasMiddleware('authflow', AuthFlowMiddleware::class);
    }
}

class AuthFlowClient
{
    private string $domain;
    private string $clientId;
    private string $clientSecret;
    private Client $httpClient;

    public function __construct(string $domain, string $clientId, string $clientSecret)
    {
        $this->domain = rtrim($domain, '/');
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        $this->httpClient = new Client(['base_uri' => $this->domain]);
    }

    public function register(array $userData): array
    {
        $response = $this->httpClient->post('/api/auth/register', [
            'json' => $userData,
            'headers' => ['Content-Type' => 'application/json']
        ]);
        return json_decode($response->getBody()->getContents(), true);
    }

    public function login(string $email, string $password): array
    {
        $response = $this->httpClient->post('/api/auth/login', [
            'json' => ['email' => $email, 'password' => $password],
            'headers' => ['Content-Type' => 'application/json']
        ]);
        return json_decode($response->getBody()->getContents(), true);
    }

    public function verifyToken(string $token): array
    {
        $response = $this->httpClient->get('/api/auth/me', [
            'headers' => [
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json'
            ]
        ]);
        return json_decode($response->getBody()->getContents(), true);
    }

    public function setupMFA(string $token, string $method): array
    {
        $response = $this->httpClient->post('/api/auth/mfa/setup', [
            'json' => ['method' => $method],
            'headers' => [
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json'
            ]
        ]);
        return json_decode($response->getBody()->getContents(), true);
    }

    public function verifyMFA(string $token, string $code, string $method): array
    {
        $response = $this->httpClient->post('/api/auth/mfa/verify', [
            'json' => ['code' => $code, 'method' => $method],
            'headers' => [
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json'
            ]
        ]);
        return json_decode($response->getBody()->getContents(), true);
    }

    public function logout(string $token): void
    {
        $this->httpClient->post('/api/auth/logout', [
            'headers' => [
                'Authorization' => "Bearer {$token}",
                'Content-Type' => 'application/json'
            ]
        ]);
    }

    public function getOAuthUrl(string $provider, string $redirectUri): string
    {
        return "{$this->domain}/api/auth/oauth/{$provider}?redirect_uri=" . urlencode($redirectUri);
    }
}

class AuthFlowMiddleware
{
    private AuthFlowClient $authflow;

    public function __construct(AuthFlowClient $authflow)
    {
        $this->authflow = $authflow;
    }

    public function handle(Request $request, \Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $user = $this->authflow->verifyToken($token);
            $request->merge(['authflow_user' => $user]);
            return $next($request);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid token'], 401);
        }
    }
}

// Helper functions
if (!function_exists('authflow')) {
    function authflow(): AuthFlowClient {
        return app(AuthFlowClient::class);
    }
}
