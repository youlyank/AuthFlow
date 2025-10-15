# AuthFlow .NET SDK

Official .NET SDK for AuthFlow authentication platform. Supports .NET Framework 4.6.1+, .NET Core 3.1+, .NET 5, 6, 7, 8, and 9.

## Installation

### Via NuGet Package Manager
```bash
dotnet add package Authflow.SDK
```

### Via Package Manager Console
```powershell
Install-Package Authflow.SDK
```

### Via .csproj
```xml
<PackageReference Include="Authflow.SDK" Version="1.0.0" />
```

## Quick Start

```csharp
using Authflow;

// Initialize the client
var authflow = new AuthflowClient(new AuthflowConfig
{
    Domain = "https://your-authflow-instance.com",
    TenantSlug = "your-tenant" // Optional: set default tenant
});

// Register a new user
var user = await authflow.RegisterAsync(new RegisterRequest
{
    Email = "user@example.com",
    Password = "SecurePassword123!",
    FirstName = "John",
    LastName = "Doe"
});

// Login
var session = await authflow.LoginAsync(new LoginRequest
{
    Email = "user@example.com",
    Password = "SecurePassword123!"
});

// Check authentication status
if (authflow.IsAuthenticated)
{
    var currentUser = authflow.CurrentUser;
    Console.WriteLine($"Logged in as: {currentUser.Email}");
}

// Logout
await authflow.LogoutAsync();
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/FIDO2 (biometric)
- OAuth2/OIDC flows
- Social login (Google, GitHub)

### ✅ Session Management
- Automatic token refresh
- Secure token storage
- Device fingerprinting
- Session persistence

### ✅ .NET Features
- Full async/await support
- Strongly typed models
- Dependency injection ready
- .NET Standard 2.0 compatible
- LINQ support for queries

### ✅ Enterprise Features
- API key management
- Webhook integration
- Custom actions/hooks
- Audit logging
- RBAC support

## Framework Integration

### ASP.NET Core

```csharp
// Startup.cs or Program.cs
services.AddAuthflow(options =>
{
    options.Domain = "https://auth.example.com";
    options.TenantSlug = "my-company";
});

// Add authentication middleware
app.UseAuthentication();
app.UseAuthorization();

// In your controller
public class AccountController : Controller
{
    private readonly IAuthflowClient _authflow;

    public AccountController(IAuthflowClient authflow)
    {
        _authflow = authflow;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var session = await _authflow.LoginAsync(request);
            return Ok(session);
        }
        catch (AuthflowException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize]
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var user = _authflow.CurrentUser;
        return Ok(user);
    }
}
```

### ASP.NET MVC

```csharp
// Global.asax.cs
protected void Application_Start()
{
    AuthflowClient.Initialize(new AuthflowConfig
    {
        Domain = "https://auth.example.com",
        TenantSlug = "my-app"
    });
}

// In your controller
public class AccountController : Controller
{
    private readonly AuthflowClient _authflow = AuthflowClient.Instance;

    public async Task<ActionResult> Login(string email, string password)
    {
        try
        {
            var session = await _authflow.LoginAsync(new LoginRequest
            {
                Email = email,
                Password = password
            });
            
            Session["AuthflowToken"] = session.AccessToken;
            return RedirectToAction("Index", "Home");
        }
        catch (AuthflowException ex)
        {
            ViewBag.Error = ex.Message;
            return View();
        }
    }
}
```

### Blazor (WebAssembly)

```csharp
// Program.cs
builder.Services.AddAuthflow(options =>
{
    options.Domain = "https://auth.example.com";
    options.TenantSlug = "my-app";
});

// In your component
@inject IAuthflowClient Authflow

@code {
    private UserProfile user;

    protected override async Task OnInitializedAsync()
    {
        if (Authflow.IsAuthenticated)
        {
            user = Authflow.CurrentUser;
        }
    }

    private async Task Login()
    {
        await Authflow.LoginAsync(new LoginRequest
        {
            Email = email,
            Password = password
        });
    }
}
```

### Xamarin / MAUI

```csharp
// App.xaml.cs
public partial class App : Application
{
    public static AuthflowClient Authflow { get; private set; }

    public App()
    {
        InitializeComponent();

        Authflow = new AuthflowClient(new AuthflowConfig
        {
            Domain = "https://auth.example.com",
            TenantSlug = "mobile-app"
        });

        MainPage = new NavigationPage(new LoginPage());
    }
}

// LoginPage.xaml.cs
private async void OnLoginClicked(object sender, EventArgs e)
{
    try
    {
        var session = await App.Authflow.LoginAsync(new LoginRequest
        {
            Email = EmailEntry.Text,
            Password = PasswordEntry.Text
        });

        await Navigation.PushAsync(new HomePage());
    }
    catch (AuthflowException ex)
    {
        await DisplayAlert("Error", ex.Message, "OK");
    }
}
```

## Multi-Factor Authentication (MFA)

### Setup TOTP (Authenticator App)

```csharp
// Enable TOTP MFA
var mfaSetup = await authflow.EnableMFATOTPAsync();
Console.WriteLine($"Secret: {mfaSetup.Secret}");
Console.WriteLine($"QR Code URL: {mfaSetup.QrCode}");

// Verify TOTP code
await authflow.VerifyMFATOTPAsync(new VerifyMFARequest
{
    Code = "123456"
});
```

### Email OTP

```csharp
// Send Email OTP
await authflow.SendEmailOTPAsync();

// Verify Email OTP
await authflow.VerifyEmailOTPAsync(new VerifyMFARequest
{
    Code = "123456"
});
```

### SMS OTP

```csharp
// Send SMS OTP
await authflow.SendSMSOTPAsync(new SendSMSRequest
{
    PhoneNumber = "+1234567890"
});

// Verify SMS OTP
await authflow.VerifySMSOTPAsync(new VerifyMFARequest
{
    Code = "123456"
});
```

## WebAuthn / Passkeys

```csharp
// Register WebAuthn credential
var options = await authflow.BeginWebAuthnRegistrationAsync();
// Pass options to browser WebAuthn API
var credential = await GetWebAuthnCredentialFromBrowser(options);
await authflow.CompleteWebAuthnRegistrationAsync(credential);

// Authenticate with WebAuthn
var authOptions = await authflow.BeginWebAuthnAuthenticationAsync();
var authCredential = await GetWebAuthnCredentialFromBrowser(authOptions);
var session = await authflow.CompleteWebAuthnAuthenticationAsync(authCredential);
```

## Magic Links

```csharp
// Send magic link
await authflow.SendMagicLinkAsync(new MagicLinkRequest
{
    Email = "user@example.com",
    RedirectUrl = "https://yourapp.com/auth/callback"
});

// Verify magic link token (in callback endpoint)
var session = await authflow.VerifyMagicLinkAsync(token);
```

## OAuth2 / Social Login

```csharp
// Get OAuth authorization URL
var authUrl = authflow.GetOAuthUrl(new OAuthRequest
{
    Provider = "google",
    RedirectUri = "https://yourapp.com/oauth/callback",
    State = "random-state-string"
});

// Redirect user to authUrl...

// Handle callback
var session = await authflow.HandleOAuthCallbackAsync(new OAuthCallbackRequest
{
    Code = Request.Query["code"],
    State = Request.Query["state"]
});
```

## API Key Management

```csharp
// Create API key
var apiKey = await authflow.CreateAPIKeyAsync(new CreateAPIKeyRequest
{
    Name = "Production API Key",
    Permissions = new[] { "users:read", "users:write" },
    ExpiresAt = DateTime.UtcNow.AddYears(1)
});
Console.WriteLine($"API Key: {apiKey.Key}");

// List API keys
var apiKeys = await authflow.GetAPIKeysAsync();

// Revoke API key
await authflow.RevokeAPIKeyAsync(apiKey.Id);
```

## Webhooks

```csharp
// Create webhook
var webhook = await authflow.CreateWebhookAsync(new CreateWebhookRequest
{
    Url = "https://yourapp.com/webhooks/authflow",
    Events = new[] { "user.created", "user.login", "user.logout" },
    Description = "User events webhook",
    Secret = "webhook-secret-key"
});

// List webhooks
var webhooks = await authflow.GetWebhooksAsync();

// Verify webhook signature (in webhook endpoint)
var isValid = authflow.VerifyWebhookSignature(
    payload: requestBody,
    signature: Request.Headers["X-Authflow-Signature"],
    secret: webhook.Secret
);
```

## Error Handling

```csharp
try
{
    var session = await authflow.LoginAsync(loginRequest);
}
catch (AuthflowAuthenticationException ex)
{
    // Invalid credentials
    Console.WriteLine($"Authentication failed: {ex.Message}");
}
catch (AuthflowValidationException ex)
{
    // Validation errors
    foreach (var error in ex.ValidationErrors)
    {
        Console.WriteLine($"{error.Field}: {error.Message}");
    }
}
catch (AuthflowRateLimitException ex)
{
    // Rate limit exceeded
    Console.WriteLine($"Rate limited. Retry after: {ex.RetryAfter}");
}
catch (AuthflowException ex)
{
    // General Authflow error
    Console.WriteLine($"Error: {ex.Message}");
}
```

## Configuration Options

```csharp
var authflow = new AuthflowClient(new AuthflowConfig
{
    Domain = "https://auth.example.com",
    TenantSlug = "my-tenant",
    
    // Optional settings
    Timeout = TimeSpan.FromSeconds(30),
    RetryPolicy = new RetryPolicy
    {
        MaxRetries = 3,
        BackoffMultiplier = 2
    },
    
    // Token storage
    TokenStorage = new SecureTokenStorage(), // Or InMemoryTokenStorage, FileTokenStorage
    
    // Logging
    EnableLogging = true,
    LogLevel = LogLevel.Information,
    
    // Custom HTTP client
    HttpClient = customHttpClient
});
```

## Testing

### Unit Testing

```csharp
using Moq;
using Xunit;

public class AuthenticationTests
{
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsSession()
    {
        // Arrange
        var mockAuthflow = new Mock<IAuthflowClient>();
        mockAuthflow
            .Setup(x => x.LoginAsync(It.IsAny<LoginRequest>()))
            .ReturnsAsync(new AuthSession { AccessToken = "token123" });

        // Act
        var session = await mockAuthflow.Object.LoginAsync(new LoginRequest
        {
            Email = "test@example.com",
            Password = "password"
        });

        // Assert
        Assert.NotNull(session);
        Assert.Equal("token123", session.AccessToken);
    }
}
```

## Migration from Auth0

```csharp
// Before (Auth0)
var auth0 = new AuthenticationApiClient(
    new Uri("https://your-domain.auth0.com"));

var result = await auth0.GetTokenAsync(new ResourceOwnerTokenRequest
{
    ClientId = "client-id",
    ClientSecret = "client-secret",
    Username = "user@example.com",
    Password = "password",
    Scope = "openid profile"
});

// After (AuthFlow)
var authflow = new AuthflowClient(new AuthflowConfig
{
    Domain = "https://your-authflow-instance.com",
    TenantSlug = "your-tenant"
});

var session = await authflow.LoginAsync(new LoginRequest
{
    Email = "user@example.com",
    Password = "password"
});
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api
- **GitHub**: https://github.com/authflow/authflow-dotnet
- **Issues**: https://github.com/authflow/authflow-dotnet/issues
- **NuGet**: https://www.nuget.org/packages/Authflow.SDK

## Requirements

- .NET Framework 4.6.1+ or .NET Core 3.1+ or .NET 5+
- C# 8.0 or higher (for nullable reference types)

## License

MIT

## Changelog

### Version 1.0.0
- Initial release
- Email/Password authentication
- MFA support (TOTP, Email, SMS)
- WebAuthn/Passkeys
- Magic Links
- OAuth2/OIDC
- API key management
- Webhook support
- Full async/await support
- Dependency injection ready
