<?php

namespace Authflow;

class AuthflowClient
{
    private string $domain;
    private ?string $tenantSlug;
    private ?string $token = null;

    public function __construct(string $domain, ?string $tenantSlug = null)
    {
        $this->domain = rtrim($domain, '/');
        $this->tenantSlug = $tenantSlug;
    }

    public function setToken(string $token): void
    {
        $this->token = $token;
    }

    private function request(string $method, string $endpoint, ?array $data = null): array
    {
        $url = $this->domain . '/api' . $endpoint;
        
        $ch = curl_init($url);
        
        $headers = [
            'Content-Type: application/json',
        ];
        
        if ($this->token) {
            $headers[] = 'Authorization: Bearer ' . $this->token;
        }
        
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
        ]);
        
        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 400) {
            throw new \Exception("Request failed with status $httpCode: $response");
        }
        
        return json_decode($response, true) ?? [];
    }

    public function register(array $data): array
    {
        if (!isset($data['tenantSlug']) && $this->tenantSlug) {
            $data['tenantSlug'] = $this->tenantSlug;
        }
        
        return $this->request('POST', '/auth/register', $data);
    }

    public function login(string $email, string $password, ?string $tenantSlug = null): array
    {
        $data = [
            'email' => $email,
            'password' => $password,
            'tenantSlug' => $tenantSlug ?? $this->tenantSlug,
        ];
        
        $response = $this->request('POST', '/auth/login', $data);
        
        if (isset($response['token'])) {
            $this->token = $response['token'];
        }
        
        return $response;
    }

    public function logout(): void
    {
        $this->request('POST', '/auth/logout');
        $this->token = null;
    }

    public function getCurrentUser(): array
    {
        $response = $this->request('GET', '/auth/me');
        return $response['user'] ?? [];
    }

    public function enableMFATOTP(): array
    {
        return $this->request('POST', '/user/mfa/totp/setup');
    }

    public function verifyMFATOTP(string $code): array
    {
        return $this->request('POST', '/user/mfa/totp/verify', ['code' => $code]);
    }

    public function enableMFASMS(): array
    {
        return $this->request('POST', '/user/mfa/sms/enable');
    }

    public function verifyMFASMS(string $code, bool $rememberDevice = false): array
    {
        return $this->request('POST', '/user/mfa/sms/verify', [
            'code' => $code,
            'rememberDevice' => $rememberDevice,
        ]);
    }

    public function createAPIKey(string $name, ?string $expiresAt = null): array
    {
        $data = ['name' => $name];
        
        if ($expiresAt) {
            $data['expiresAt'] = $expiresAt;
        }
        
        return $this->request('POST', '/api-keys', $data);
    }

    public function listAPIKeys(): array
    {
        return $this->request('GET', '/api-keys');
    }

    public function deleteAPIKey(string $id): void
    {
        $this->request('DELETE', "/api-keys/$id");
    }
}
