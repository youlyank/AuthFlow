# AuthFlow Swift SDK

Official Swift SDK for AuthFlow authentication platform. Supports iOS 13+, macOS 10.15+, watchOS 6+, and tvOS 13+.

## Installation

### Swift Package Manager

```swift
dependencies: [
    .package(url: "https://github.com/authflow/authflow-swift.git", from: "1.0.0")
]
```

### CocoaPods

```ruby
pod 'AuthflowSDK', '~> 1.0.0'
```

### Carthage

```
github "authflow/authflow-swift" ~> 1.0.0
```

## Quick Start

```swift
import AuthflowSDK

// Initialize the client
let authflow = AuthflowClient(
    domain: "https://your-authflow-instance.com",
    tenantSlug: "your-tenant" // Optional
)

// Register a new user
let registerData = RegisterData(
    email: "user@example.com",
    password: "SecurePassword123!",
    firstName: "John",
    lastName: "Doe"
)

authflow.register(registerData) { result in
    switch result {
    case .success(let user):
        print("User registered: \(user.email)")
    case .failure(let error):
        print("Registration failed: \(error.localizedDescription)")
    }
}

// Login
let loginData = LoginData(
    email: "user@example.com",
    password: "SecurePassword123!"
)

authflow.login(loginData) { result in
    switch result {
    case .success(let session):
        print("Logged in: \(session.user.email)")
    case .failure(let error):
        print("Login failed: \(error.localizedDescription)")
    }
}

// Check authentication status
if authflow.isAuthenticated {
    if let user = authflow.currentUser {
        print("Logged in as: \(user.email)")
    }
}

// Logout
authflow.logout()
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Passkeys (Face ID, Touch ID)
- OAuth2/OIDC flows
- Social login (Apple, Google, GitHub)

### ✅ iOS Integration
- Face ID / Touch ID support
- Keychain storage for tokens
- Sign in with Apple integration
- Universal Links support
- Widget Extension support
- SwiftUI + UIKit support

### ✅ Swift Features
- Async/await support (iOS 13+)
- Combine publishers
- Result type for error handling
- Codable models
- Swift Concurrency

## SwiftUI Integration

```swift
import SwiftUI
import AuthflowSDK

@main
struct MyApp: App {
    @StateObject private var authflow = AuthflowClient(
        domain: "https://auth.example.com",
        tenantSlug: "my-app"
    )
    
    var body: some Scene {
        WindowGroup {
            if authflow.isAuthenticated {
                HomeView()
                    .environmentObject(authflow)
            } else {
                LoginView()
                    .environmentObject(authflow)
            }
        }
    }
}

// Login View
struct LoginView: View {
    @EnvironmentObject var authflow: AuthflowClient
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            if let error = errorMessage {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            Button(action: login) {
                if isLoading {
                    ProgressView()
                } else {
                    Text("Login")
                }
            }
            .disabled(isLoading)
            
            Button("Login with Face ID") {
                loginWithBiometrics()
            }
        }
        .padding()
    }
    
    func login() {
        isLoading = true
        errorMessage = nil
        
        let loginData = LoginData(email: email, password: password)
        
        authflow.login(loginData) { result in
            isLoading = false
            switch result {
            case .success:
                break // View will automatically update
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }
    
    func loginWithBiometrics() {
        authflow.loginWithBiometrics { result in
            switch result {
            case .success:
                break
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }
}
```

## Async/Await Support

```swift
// Modern async/await API (iOS 13+)
func loginUser() async {
    do {
        let loginData = LoginData(
            email: "user@example.com",
            password: "password"
        )
        
        let session = try await authflow.login(loginData)
        print("Logged in: \(session.user.email)")
        
        // Chain operations
        let user = try await authflow.getCurrentUser()
        print("Current user: \(user.email)")
        
    } catch {
        print("Error: \(error.localizedDescription)")
    }
}
```

## Combine Support

```swift
import Combine

class AuthViewModel: ObservableObject {
    private let authflow: AuthflowClient
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    init(authflow: AuthflowClient) {
        self.authflow = authflow
        
        authflow.authStatePublisher
            .assign(to: \.isAuthenticated, on: self)
            .store(in: &cancellables)
        
        authflow.currentUserPublisher
            .assign(to: \.currentUser, on: self)
            .store(in: &cancellables)
    }
    
    func login(email: String, password: String) {
        let loginData = LoginData(email: email, password: password)
        
        authflow.loginPublisher(loginData)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Login failed: \(error)")
                    }
                },
                receiveValue: { session in
                    print("Logged in: \(session.user.email)")
                }
            )
            .store(in: &cancellables)
    }
}
```

## Multi-Factor Authentication (MFA)

### Face ID / Touch ID (Biometrics)

```swift
import LocalAuthentication

// Enable biometric authentication
authflow.enableBiometrics { result in
    switch result {
    case .success:
        print("Biometrics enabled")
    case .failure(let error):
        print("Failed to enable biometrics: \(error)")
    }
}

// Login with biometrics
authflow.loginWithBiometrics { result in
    switch result {
    case .success(let session):
        print("Logged in with Face ID: \(session.user.email)")
    case .failure(let error):
        print("Biometric login failed: \(error)")
    }
}
```

### TOTP (Authenticator App)

```swift
// Enable TOTP MFA
authflow.enableMFATOTP { result in
    switch result {
    case .success(let mfaSetup):
        print("Secret: \(mfaSetup.secret)")
        print("QR Code: \(mfaSetup.qrCode)")
    case .failure(let error):
        print("Failed: \(error)")
    }
}

// Verify TOTP
authflow.verifyMFATOTP(code: "123456") { result in
    switch result {
    case .success:
        print("MFA verified")
    case .failure(let error):
        print("Verification failed: \(error)")
    }
}
```

## Sign in with Apple

```swift
import AuthenticationServices

class SignInWithAppleCoordinator: NSObject, ASAuthorizationControllerDelegate {
    let authflow: AuthflowClient
    
    init(authflow: AuthflowClient) {
        self.authflow = authflow
    }
    
    func signInWithApple() {
        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.email, .fullName]
        
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.performRequests()
    }
    
    func authorizationController(controller: ASAuthorizationController,
                                didCompleteWithAuthorization authorization: ASAuthorization) {
        if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
            let appleData = AppleSignInData(
                identityToken: credential.identityToken,
                authorizationCode: credential.authorizationCode,
                user: credential.user,
                email: credential.email,
                fullName: credential.fullName
            )
            
            authflow.signInWithApple(appleData) { result in
                switch result {
                case .success(let session):
                    print("Signed in with Apple: \(session.user.email)")
                case .failure(let error):
                    print("Failed: \(error)")
                }
            }
        }
    }
}
```

## WebAuthn / Passkeys

```swift
// Register passkey
authflow.registerPasskey { result in
    switch result {
    case .success:
        print("Passkey registered")
    case .failure(let error):
        print("Failed: \(error)")
    }
}

// Authenticate with passkey
authflow.authenticateWithPasskey { result in
    switch result {
    case .success(let session):
        print("Authenticated with passkey")
    case .failure(let error):
        print("Failed: \(error)")
    }
}
```

## OAuth2 / Social Login

```swift
// Get OAuth URL
let oauthRequest = OAuthRequest(
    provider: .google,
    redirectUri: "myapp://oauth/callback",
    state: UUID().uuidString
)

if let authUrl = authflow.getOAuthUrl(oauthRequest) {
    // Open in Safari or ASWebAuthenticationSession
    UIApplication.shared.open(authUrl)
}

// Handle callback (in SceneDelegate or AppDelegate)
func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    
    authflow.handleOAuthCallback(url: url) { result in
        switch result {
        case .success(let session):
            print("OAuth login successful: \(session.user.email)")
        case .failure(let error):
            print("OAuth failed: \(error)")
        }
    }
}
```

## Magic Links

```swift
// Send magic link
authflow.sendMagicLink(
    email: "user@example.com",
    redirectUrl: "myapp://auth/callback"
) { result in
    switch result {
    case .success:
        print("Magic link sent")
    case .failure(let error):
        print("Failed: \(error)")
    }
}

// Verify magic link (in callback handler)
authflow.verifyMagicLink(token: token) { result in
    switch result {
    case .success(let session):
        print("Magic link verified")
    case .failure(let error):
        print("Verification failed: \(error)")
    }
}
```

## Keychain Storage

```swift
// The SDK automatically uses Keychain for secure token storage
// You can customize the keychain configuration:

let keychainConfig = KeychainConfig(
    serviceName: "com.myapp.authflow",
    accessGroup: "group.com.myapp.shared",
    accessibility: .afterFirstUnlock
)

let authflow = AuthflowClient(
    domain: "https://auth.example.com",
    tenantSlug: "my-app",
    keychainConfig: keychainConfig
)
```

## Error Handling

```swift
authflow.login(loginData) { result in
    switch result {
    case .success(let session):
        print("Success: \(session)")
        
    case .failure(let error):
        switch error {
        case .authenticationFailed:
            print("Invalid credentials")
        case .mfaRequired(let methods):
            print("MFA required. Available methods: \(methods)")
        case .rateLimitExceeded(let retryAfter):
            print("Rate limited. Retry after: \(retryAfter)")
        case .networkError(let underlyingError):
            print("Network error: \(underlyingError)")
        case .validationError(let errors):
            errors.forEach { print("\($0.field): \($0.message)") }
        default:
            print("Error: \(error.localizedDescription)")
        }
    }
}
```

## Migration from Auth0

```swift
// Before (Auth0)
let auth0 = Auth0.webAuth(
    clientId: "client-id",
    domain: "your-domain.auth0.com"
)

auth0.login(
    usernameOrEmail: "user@example.com",
    password: "password",
    scope: "openid profile"
).start { result in
    switch result {
    case .success(let credentials):
        print("Logged in")
    case .failure(let error):
        print("Failed: \(error)")
    }
}

// After (AuthFlow)
let authflow = AuthflowClient(
    domain: "https://your-authflow-instance.com",
    tenantSlug: "your-tenant"
)

let loginData = LoginData(
    email: "user@example.com",
    password: "password"
)

authflow.login(loginData) { result in
    switch result {
    case .success(let session):
        print("Logged in: \(session.user.email)")
    case .failure(let error):
        print("Failed: \(error)")
    }
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/swift
- **GitHub**: https://github.com/authflow/authflow-swift
- **Issues**: https://github.com/authflow/authflow-swift/issues

## Requirements

- iOS 13.0+ / macOS 10.15+ / watchOS 6.0+ / tvOS 13.0+
- Xcode 13.0+
- Swift 5.5+

## License

MIT
