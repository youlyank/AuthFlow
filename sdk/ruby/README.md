# AuthFlow Ruby SDK

Official Ruby SDK for AuthFlow authentication platform.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'authflow'
```

And then execute:

```bash
bundle install
```

Or install it yourself:

```bash
gem install authflow
```

## Usage

```ruby
require 'authflow'

# Initialize client
client = Authflow::Client.new(
  domain: 'https://your-domain.com',
  tenant_slug: 'your-tenant-slug'
)

# Register a new user
user = client.register(
  email: 'user@example.com',
  password: 'SecurePassword123!',
  first_name: 'John',
  last_name: 'Doe'
)
puts "User registered: #{user['email']}"

# Login
response = client.login(
  email: 'user@example.com',
  password: 'SecurePassword123!'
)
puts "Logged in as: #{response['user']['email']}"

# Get current user
current_user = client.current_user
puts "Current user: #{current_user['email']}"

# Enable MFA
mfa_setup = client.enable_mfa_totp
puts "MFA Secret: #{mfa_setup['secret']}"
puts "QR Code: #{mfa_setup['qrCode']}"

# Verify MFA
client.verify_mfa_totp(code: '123456')

# Send Magic Link
client.send_magic_link(
  email: 'user@example.com',
  redirect_url: 'https://your-app.com/auth/callback'
)

# Create API Key
api_key = client.create_api_key(
  name: 'My API Key',
  expires_at: (Time.now + 30*24*60*60).iso8601
)
puts "API Key: #{api_key['key']}"

# Create Webhook
webhook = client.create_webhook(
  url: 'https://your-app.com/webhooks/authflow',
  events: ['user.created', 'user.login'],
  description: 'User events webhook'
)
```

## Features

- Email/Password Authentication
- Multi-Factor Authentication (TOTP, Email, SMS)
- WebAuthn/Passkeys
- Magic Links
- OAuth2/OIDC
- API Key Management
- Webhook Management
- Session Management

## Documentation

Visit [https://docs.authflow.com](https://docs.authflow.com) for full documentation.

## License

MIT
