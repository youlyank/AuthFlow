# AuthFlow Flutter SDK

Official Flutter SDK for AuthFlow authentication platform. Supports iOS, Android, Web, Windows, macOS, and Linux.

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  authflow_sdk: ^1.0.0
```

Then run:

```bash
flutter pub get
```

## Quick Start

```dart
import 'package:authflow_sdk/authflow_sdk.dart';

// Initialize the client
final authflow = AuthflowClient(
  domain: 'https://your-authflow-instance.com',
  tenantSlug: 'your-tenant', // Optional
);

// Register a new user
final user = await authflow.register(
  email: 'user@example.com',
  password: 'SecurePassword123!',
  firstName: 'John',
  lastName: 'Doe',
);

// Login
final session = await authflow.login(
  email: 'user@example.com',
  password: 'SecurePassword123!',
);

// Check authentication status
if (authflow.isAuthenticated) {
  final currentUser = authflow.currentUser;
  print('Logged in as: ${currentUser?.email}');
}

// Logout
await authflow.logout();
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Biometrics (platform-specific)
- OAuth2/OIDC flows
- Social login (Google, Apple, Facebook)

### ✅ Cross-Platform Support
- iOS & Android (native biometrics)
- Web (WebAuthn)
- Desktop (Windows, macOS, Linux)
- Secure storage on all platforms
- Platform-specific optimizations

### ✅ Flutter Features
- Stream-based reactive API
- Provider pattern support
- BLoC pattern support
- Riverpod support
- GetX support
- Null safety

## State Management Integration

### Provider

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:authflow_sdk/authflow_sdk.dart';

class AuthProvider extends ChangeNotifier {
  final AuthflowClient _authflow;
  
  bool get isAuthenticated => _authflow.isAuthenticated;
  User? get currentUser => _authflow.currentUser;
  
  AuthProvider(this._authflow) {
    _authflow.authStateStream.listen((isAuth) {
      notifyListeners();
    });
  }
  
  Future<void> login(String email, String password) async {
    try {
      await _authflow.login(email: email, password: password);
      notifyListeners();
    } catch (e) {
      throw Exception('Login failed: $e');
    }
  }
  
  Future<void> logout() async {
    await _authflow.logout();
    notifyListeners();
  }
}

// In main.dart
void main() {
  final authflow = AuthflowClient(
    domain: 'https://auth.example.com',
    tenantSlug: 'my-app',
  );
  
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(authflow),
      child: MyApp(),
    ),
  );
}

// In widget
class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    
    return Scaffold(
      body: Center(
        child: authProvider.isAuthenticated
            ? Text('Welcome ${authProvider.currentUser?.email}')
            : LoginForm(),
      ),
    );
  }
}
```

### BLoC Pattern

```dart
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:authflow_sdk/authflow_sdk.dart';

// Events
abstract class AuthEvent {}
class LoginEvent extends AuthEvent {
  final String email;
  final String password;
  LoginEvent(this.email, this.password);
}
class LogoutEvent extends AuthEvent {}

// States
abstract class AuthState {}
class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthAuthenticated extends AuthState {
  final User user;
  AuthAuthenticated(this.user);
}
class AuthUnauthenticated extends AuthState {}
class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
}

// BLoC
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthflowClient authflow;
  
  AuthBloc(this.authflow) : super(AuthInitial()) {
    on<LoginEvent>(_onLogin);
    on<LogoutEvent>(_onLogout);
  }
  
  Future<void> _onLogin(LoginEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final session = await authflow.login(
        email: event.email,
        password: event.password,
      );
      emit(AuthAuthenticated(session.user));
    } catch (e) {
      emit(AuthError(e.toString()));
    }
  }
  
  Future<void> _onLogout(LogoutEvent event, Emitter<AuthState> emit) async {
    await authflow.logout();
    emit(AuthUnauthenticated());
  }
}

// Usage
BlocProvider(
  create: (_) => AuthBloc(authflow),
  child: MyApp(),
)
```

### Riverpod

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:authflow_sdk/authflow_sdk.dart';

// Providers
final authflowProvider = Provider<AuthflowClient>((ref) {
  return AuthflowClient(
    domain: 'https://auth.example.com',
    tenantSlug: 'my-app',
  );
});

final authStateProvider = StreamProvider<bool>((ref) {
  final authflow = ref.watch(authflowProvider);
  return authflow.authStateStream;
});

final currentUserProvider = Provider<User?>((ref) {
  final authflow = ref.watch(authflowProvider);
  return authflow.currentUser;
});

// Usage
class HomeScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final currentUser = ref.watch(currentUserProvider);
    
    return authState.when(
      data: (isAuthenticated) {
        if (isAuthenticated) {
          return Text('Welcome ${currentUser?.email}');
        }
        return LoginScreen();
      },
      loading: () => CircularProgressIndicator(),
      error: (err, stack) => Text('Error: $err'),
    );
  }
}
```

## Biometric Authentication

```dart
import 'package:local_auth/local_auth.dart';

// Enable biometric authentication
Future<void> enableBiometrics() async {
  final localAuth = LocalAuthentication();
  
  final canAuthenticate = await localAuth.canCheckBiometrics;
  if (!canAuthenticate) {
    throw Exception('Biometrics not available');
  }
  
  final didAuthenticate = await localAuth.authenticate(
    localizedReason: 'Authenticate to enable biometrics',
    options: const AuthenticationOptions(
      stickyAuth: true,
      biometricOnly: true,
    ),
  );
  
  if (didAuthenticate) {
    await authflow.enableBiometrics();
  }
}

// Login with biometrics
Future<void> loginWithBiometrics() async {
  final localAuth = LocalAuthentication();
  
  final didAuthenticate = await localAuth.authenticate(
    localizedReason: 'Authenticate to login',
    options: const AuthenticationOptions(
      stickyAuth: true,
      biometricOnly: true,
    ),
  );
  
  if (didAuthenticate) {
    final session = await authflow.loginWithBiometrics();
    print('Logged in: ${session.user.email}');
  }
}
```

## Multi-Factor Authentication

```dart
// Enable TOTP MFA
final mfaSetup = await authflow.enableMFATOTP();
print('Secret: ${mfaSetup.secret}');
print('QR Code: ${mfaSetup.qrCode}');

// Display QR code
QrImage(
  data: mfaSetup.qrCode,
  version: QrVersions.auto,
  size: 200.0,
)

// Verify TOTP
await authflow.verifyMFATOTP(code: '123456');

// Login with MFA
final session = await authflow.login(
  email: 'user@example.com',
  password: 'password',
  mfaCode: '123456',
);
```

## OAuth2 / Social Login

```dart
import 'package:url_launcher/url_launcher.dart';

// Google Sign-In
Future<void> signInWithGoogle() async {
  final authUrl = authflow.getOAuthUrl(
    provider: 'google',
    redirectUri: 'myapp://oauth/callback',
    state: 'random-state',
  );
  
  if (await canLaunchUrl(authUrl)) {
    await launchUrl(authUrl, mode: LaunchMode.externalApplication);
  }
}

// Handle OAuth callback (in deep link handler)
Future<void> handleOAuthCallback(Uri uri) async {
  final code = uri.queryParameters['code'];
  final state = uri.queryParameters['state'];
  
  if (code != null && state != null) {
    final session = await authflow.handleOAuthCallback(
      code: code,
      state: state,
    );
    print('Logged in: ${session.user.email}');
  }
}

// Configure deep linking
// iOS: Add URL scheme in Info.plist
// Android: Add intent filter in AndroidManifest.xml
```

## Sign in with Apple

```dart
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<void> signInWithApple() async {
  try {
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
    );
    
    final session = await authflow.signInWithApple(
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode,
      user: credential.userIdentifier,
      email: credential.email,
      givenName: credential.givenName,
      familyName: credential.familyName,
    );
    
    print('Signed in: ${session.user.email}');
  } catch (e) {
    print('Apple Sign-In failed: $e');
  }
}
```

## Magic Links

```dart
// Send magic link
await authflow.sendMagicLink(
  email: 'user@example.com',
  redirectUrl: 'myapp://auth/callback',
);

// Verify magic link (in deep link handler)
final session = await authflow.verifyMagicLink(token: token);
print('Logged in via magic link: ${session.user.email}');
```

## Secure Storage

```dart
// The SDK automatically uses secure storage for tokens
// You can customize the storage configuration:

final authflow = AuthflowClient(
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
  storageConfig: StorageConfig(
    useSecureStorage: true,
    encryptionKey: 'your-encryption-key', // Optional
    androidOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iosOptions: IOSOptions(
      accessibility: KeychainAccessibility.afterFirstUnlock,
    ),
  ),
);
```

## Error Handling

```dart
try {
  final session = await authflow.login(
    email: email,
    password: password,
  );
  print('Success: ${session.user.email}');
} on AuthflowAuthenticationException catch (e) {
  print('Invalid credentials: ${e.message}');
} on AuthflowMFARequiredException catch (e) {
  print('MFA required. Available methods: ${e.methods}');
} on AuthflowRateLimitException catch (e) {
  print('Rate limited. Retry after: ${e.retryAfter}');
} on AuthflowValidationException catch (e) {
  for (final error in e.errors) {
    print('${error.field}: ${error.message}');
  }
} on AuthflowException catch (e) {
  print('Error: ${e.message}');
}
```

## Complete Login Example

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authflow = AuthflowClient(
    domain: 'https://auth.example.com',
    tenantSlug: 'my-app',
  );
  
  bool _isLoading = false;
  String? _errorMessage;
  
  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final session = await _authflow.login(
        email: _emailController.text,
        password: _passwordController.text,
      );
      
      // Navigate to home screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => HomeScreen()),
      );
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            if (_errorMessage != null)
              Padding(
                padding: EdgeInsets.only(top: 16),
                child: Text(
                  _errorMessage!,
                  style: TextStyle(color: Colors.red),
                ),
              ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? CircularProgressIndicator()
                  : Text('Login'),
            ),
            TextButton(
              onPressed: () {
                // Login with biometrics
              },
              child: Text('Login with Biometrics'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Migration from Auth0

```dart
// Before (Auth0)
final auth0 = Auth0(
  'your-domain.auth0.com',
  'client-id',
);

final response = await auth0.auth.passwordRealm(
  usernameOrEmail: 'user@example.com',
  password: 'password',
  realm: 'Username-Password-Authentication',
);

// After (AuthFlow)
final authflow = AuthflowClient(
  domain: 'https://your-authflow-instance.com',
  tenantSlug: 'your-tenant',
);

final session = await authflow.login(
  email: 'user@example.com',
  password: 'password',
);
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://pub.dev/documentation/authflow_sdk
- **GitHub**: https://github.com/authflow/authflow-flutter
- **Issues**: https://github.com/authflow/authflow-flutter/issues
- **pub.dev**: https://pub.dev/packages/authflow_sdk

## Requirements

- Flutter 3.0+
- Dart 3.0+

## License

MIT
