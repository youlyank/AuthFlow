# AuthFlow Java SDK

Official Java SDK for AuthFlow authentication platform. Supports Java 8+, Java 11, Java 17, and Java 21.

## Installation

### Maven

```xml
<dependency>
    <groupId>com.authflow</groupId>
    <artifactId>authflow-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle

```gradle
implementation 'com.authflow:authflow-sdk:1.0.0'
```

### Gradle (Kotlin DSL)

```kotlin
implementation("com.authflow:authflow-sdk:1.0.0")
```

## Quick Start

```java
import com.authflow.AuthflowClient;
import com.authflow.models.*;

// Initialize the client
AuthflowClient authflow = AuthflowClient.builder()
    .domain("https://your-authflow-instance.com")
    .tenantSlug("your-tenant") // Optional
    .build();

// Register a new user
RegisterRequest registerReq = RegisterRequest.builder()
    .email("user@example.com")
    .password("SecurePassword123!")
    .firstName("John")
    .lastName("Doe")
    .build();

User user = authflow.register(registerReq);

// Login
LoginRequest loginReq = LoginRequest.builder()
    .email("user@example.com")
    .password("SecurePassword123!")
    .build();

AuthSession session = authflow.login(loginReq);

// Check authentication status
if (authflow.isAuthenticated()) {
    User currentUser = authflow.getCurrentUser();
    System.out.println("Logged in as: " + currentUser.getEmail());
}

// Logout
authflow.logout();
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/FIDO2 (biometric)
- OAuth2/OIDC flows
- Social login (Google, GitHub, Microsoft)

### ✅ Session Management
- Automatic token refresh
- Thread-safe session handling
- Secure token storage
- Connection pooling

### ✅ Java Features
- Builder pattern for all requests
- Fluent API design
- CompletableFuture support (async)
- Java 8+ Stream API integration
- Null-safe with Optional<T>
- Immutable models

### ✅ Enterprise Features
- API key management
- Webhook integration
- Custom actions/hooks
- Audit logging
- RBAC support

## Framework Integration

### Spring Boot

```java
// Configuration
@Configuration
public class AuthflowConfig {
    
    @Bean
    public AuthflowClient authflowClient() {
        return AuthflowClient.builder()
            .domain("https://auth.example.com")
            .tenantSlug("my-company")
            .build();
    }
}

// Controller
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthflowClient authflow;
    
    @PostMapping("/login")
    public ResponseEntity<AuthSession> login(@RequestBody LoginRequest request) {
        try {
            AuthSession session = authflow.login(request);
            return ResponseEntity.ok(session);
        } catch (AuthflowException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(null);
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        if (authflow.isAuthenticated()) {
            return ResponseEntity.ok(authflow.getCurrentUser());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}

// Security configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private AuthflowClient authflow;
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .addFilterBefore(new AuthflowAuthenticationFilter(authflow), 
                UsernamePasswordAuthenticationFilter.class)
            .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated();
        
        return http.build();
    }
}
```

### Jakarta EE / Java EE

```java
@ApplicationScoped
public class AuthflowProvider {
    
    private AuthflowClient authflow;
    
    @PostConstruct
    public void init() {
        authflow = AuthflowClient.builder()
            .domain(System.getenv("AUTHFLOW_DOMAIN"))
            .tenantSlug(System.getenv("AUTHFLOW_TENANT"))
            .build();
    }
    
    public AuthflowClient getClient() {
        return authflow;
    }
}

@Path("/auth")
@ApplicationScoped
public class AuthResource {
    
    @Inject
    private AuthflowProvider authflowProvider;
    
    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(LoginRequest request) {
        try {
            AuthSession session = authflowProvider.getClient().login(request);
            return Response.ok(session).build();
        } catch (AuthflowException e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }
}
```

### Micronaut

```java
@Singleton
public class AuthflowClientFactory {
    
    @Value("${authflow.domain}")
    private String domain;
    
    @Value("${authflow.tenant}")
    private String tenantSlug;
    
    @Bean
    public AuthflowClient authflowClient() {
        return AuthflowClient.builder()
            .domain(domain)
            .tenantSlug(tenantSlug)
            .build();
    }
}

@Controller("/api/auth")
public class AuthController {
    
    @Inject
    private AuthflowClient authflow;
    
    @Post("/login")
    public HttpResponse<AuthSession> login(@Body LoginRequest request) {
        try {
            AuthSession session = authflow.login(request);
            return HttpResponse.ok(session);
        } catch (AuthflowException e) {
            return HttpResponse.unauthorized();
        }
    }
}
```

### Quarkus

```java
@ApplicationScoped
public class AuthflowProducer {
    
    @ConfigProperty(name = "authflow.domain")
    String domain;
    
    @ConfigProperty(name = "authflow.tenant")
    String tenantSlug;
    
    @Produces
    @ApplicationScoped
    public AuthflowClient authflowClient() {
        return AuthflowClient.builder()
            .domain(domain)
            .tenantSlug(tenantSlug)
            .build();
    }
}

@Path("/api/auth")
@ApplicationScoped
public class AuthResource {
    
    @Inject
    AuthflowClient authflow;
    
    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        try {
            AuthSession session = authflow.login(request);
            return Response.ok(session).build();
        } catch (AuthflowException e) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
    }
}
```

## Multi-Factor Authentication (MFA)

### TOTP (Authenticator App)

```java
// Enable TOTP MFA
MFASetupResponse mfaSetup = authflow.enableMFATOTP();
System.out.println("Secret: " + mfaSetup.getSecret());
System.out.println("QR Code: " + mfaSetup.getQrCode());

// Verify TOTP
VerifyMFARequest verifyReq = VerifyMFARequest.builder()
    .code("123456")
    .build();
authflow.verifyMFATOTP(verifyReq);

// Login with MFA
LoginRequest loginReq = LoginRequest.builder()
    .email("user@example.com")
    .password("password")
    .mfaCode("123456")
    .build();
AuthSession session = authflow.login(loginReq);
```

### Email OTP

```java
// Send Email OTP
authflow.sendEmailOTP();

// Verify Email OTP
VerifyMFARequest verifyReq = VerifyMFARequest.builder()
    .code("123456")
    .build();
authflow.verifyEmailOTP(verifyReq);
```

### SMS OTP

```java
// Send SMS OTP
SendSMSRequest smsReq = SendSMSRequest.builder()
    .phoneNumber("+1234567890")
    .build();
authflow.sendSMSOTP(smsReq);

// Verify SMS OTP
VerifyMFARequest verifyReq = VerifyMFARequest.builder()
    .code("123456")
    .build();
authflow.verifySMSOTP(verifyReq);
```

## WebAuthn / Passkeys

```java
// Register WebAuthn credential
WebAuthnRegistrationOptions options = authflow.beginWebAuthnRegistration();
// Pass options to frontend WebAuthn API
WebAuthnCredential credential = getWebAuthnCredentialFromBrowser(options);
authflow.completeWebAuthnRegistration(credential);

// Authenticate with WebAuthn
WebAuthnAuthenticationOptions authOptions = authflow.beginWebAuthnAuthentication();
WebAuthnCredential authCredential = getWebAuthnCredentialFromBrowser(authOptions);
AuthSession session = authflow.completeWebAuthnAuthentication(authCredential);
```

## Magic Links

```java
// Send magic link
MagicLinkRequest magicReq = MagicLinkRequest.builder()
    .email("user@example.com")
    .redirectUrl("https://yourapp.com/auth/callback")
    .build();
authflow.sendMagicLink(magicReq);

// Verify magic link token (in callback endpoint)
AuthSession session = authflow.verifyMagicLink(token);
```

## OAuth2 / Social Login

```java
// Get OAuth authorization URL
OAuthRequest oauthReq = OAuthRequest.builder()
    .provider("google")
    .redirectUri("https://yourapp.com/oauth/callback")
    .state("random-state-string")
    .scopes(Arrays.asList("email", "profile"))
    .build();

String authUrl = authflow.getOAuthUrl(oauthReq);
// Redirect user to authUrl...

// Handle callback
OAuthCallbackRequest callbackReq = OAuthCallbackRequest.builder()
    .code(request.getParameter("code"))
    .state(request.getParameter("state"))
    .build();

AuthSession session = authflow.handleOAuthCallback(callbackReq);
```

## API Key Management

```java
// Create API key
CreateAPIKeyRequest apiKeyReq = CreateAPIKeyRequest.builder()
    .name("Production API Key")
    .permissions(Arrays.asList("users:read", "users:write"))
    .expiresAt(LocalDateTime.now().plusYears(1))
    .build();

APIKey apiKey = authflow.createAPIKey(apiKeyReq);
System.out.println("API Key: " + apiKey.getKey());

// List API keys
List<APIKey> apiKeys = authflow.getAPIKeys();

// Revoke API key
authflow.revokeAPIKey(apiKey.getId());
```

## Async Support (CompletableFuture)

```java
// All methods have async variants
CompletableFuture<User> userFuture = authflow.registerAsync(registerReq);

userFuture.thenAccept(user -> {
    System.out.println("User registered: " + user.getEmail());
}).exceptionally(throwable -> {
    System.err.println("Registration failed: " + throwable.getMessage());
    return null;
});

// Chain multiple operations
authflow.loginAsync(loginReq)
    .thenCompose(session -> authflow.getCurrentUserAsync())
    .thenAccept(user -> System.out.println("Logged in as: " + user.getEmail()))
    .exceptionally(throwable -> {
        System.err.println("Error: " + throwable.getMessage());
        return null;
    });
```

## Reactive Support (Project Reactor)

```java
import reactor.core.publisher.Mono;

// Reactive variants using Project Reactor
Mono<User> userMono = authflow.registerReactive(registerReq);

userMono.subscribe(
    user -> System.out.println("User registered: " + user.getEmail()),
    error -> System.err.println("Registration failed: " + error.getMessage())
);

// Chain reactive operations
authflow.loginReactive(loginReq)
    .flatMap(session -> authflow.getCurrentUserReactive())
    .subscribe(user -> System.out.println("Logged in as: " + user.getEmail()));
```

## Error Handling

```java
try {
    AuthSession session = authflow.login(loginReq);
} catch (AuthflowAuthenticationException e) {
    // Invalid credentials
    System.err.println("Authentication failed: " + e.getMessage());
} catch (AuthflowValidationException e) {
    // Validation errors
    e.getValidationErrors().forEach(error -> {
        System.err.println(error.getField() + ": " + error.getMessage());
    });
} catch (AuthflowRateLimitException e) {
    // Rate limit exceeded
    System.err.println("Rate limited. Retry after: " + e.getRetryAfter());
} catch (AuthflowException e) {
    // General Authflow error
    System.err.println("Error: " + e.getMessage());
}
```

## Configuration Options

```java
AuthflowClient authflow = AuthflowClient.builder()
    .domain("https://auth.example.com")
    .tenantSlug("my-tenant")
    
    // Optional settings
    .timeout(Duration.ofSeconds(30))
    .retryPolicy(RetryPolicy.builder()
        .maxRetries(3)
        .backoffMultiplier(2)
        .build())
    
    // Token storage
    .tokenStorage(new SecureTokenStorage()) // Or InMemoryTokenStorage, FileTokenStorage
    
    // Logging
    .enableLogging(true)
    .logLevel(LogLevel.INFO)
    
    // Custom HTTP client
    .httpClient(customHttpClient)
    
    // Connection pooling
    .connectionPoolSize(20)
    .connectionTimeout(Duration.ofSeconds(10))
    
    .build();
```

## Testing

### JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

class AuthenticationTest {
    
    @Test
    void login_WithValidCredentials_ReturnsSession() {
        // Arrange
        AuthflowClient authflow = Mockito.mock(AuthflowClient.class);
        AuthSession expectedSession = AuthSession.builder()
            .accessToken("token123")
            .build();
        
        Mockito.when(authflow.login(any(LoginRequest.class)))
            .thenReturn(expectedSession);
        
        // Act
        LoginRequest loginReq = LoginRequest.builder()
            .email("test@example.com")
            .password("password")
            .build();
        
        AuthSession session = authflow.login(loginReq);
        
        // Assert
        assertNotNull(session);
        assertEquals("token123", session.getAccessToken());
    }
}
```

## Migration from Auth0

```java
// Before (Auth0)
AuthAPI auth = AuthAPI.newBuilder("your-domain.auth0.com", "client-id", "client-secret")
    .build();

TokenRequest tokenRequest = auth.login("user@example.com", "password", "realm")
    .setScope("openid profile");

TokenHolder token = tokenRequest.execute().getBody();

// After (AuthFlow)
AuthflowClient authflow = AuthflowClient.builder()
    .domain("https://your-authflow-instance.com")
    .tenantSlug("your-tenant")
    .build();

LoginRequest loginReq = LoginRequest.builder()
    .email("user@example.com")
    .password("password")
    .build();

AuthSession session = authflow.login(loginReq);
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api
- **GitHub**: https://github.com/authflow/authflow-java
- **Issues**: https://github.com/authflow/authflow-java/issues
- **Maven Central**: https://search.maven.org/artifact/com.authflow/authflow-sdk

## Requirements

- Java 8 or higher
- Maven 3.6+ or Gradle 6+

## License

MIT
