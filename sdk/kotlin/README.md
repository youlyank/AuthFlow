# AuthFlow Kotlin SDK

Official Kotlin SDK for AuthFlow authentication platform. Supports Android 5.0+ (API 21+) and JVM projects.

## Installation

### Gradle (Kotlin DSL)

```kotlin
dependencies {
    implementation("com.authflow:authflow-kotlin:1.0.0")
}
```

### Gradle (Groovy)

```gradle
dependencies {
    implementation 'com.authflow:authflow-kotlin:1.0.0'
}
```

### Maven

```xml
<dependency>
    <groupId>com.authflow</groupId>
    <artifactId>authflow-kotlin</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Quick Start

```kotlin
import com.authflow.AuthflowClient
import com.authflow.models.*

// Initialize the client
val authflow = AuthflowClient(
    domain = "https://your-authflow-instance.com",
    tenantSlug = "your-tenant" // Optional
)

// Register a new user
val registerData = RegisterData(
    email = "user@example.com",
    password = "SecurePassword123!",
    firstName = "John",
    lastName = "Doe"
)

val user = authflow.register(registerData)

// Login
val loginData = LoginData(
    email = "user@example.com",
    password = "SecurePassword123!"
)

val session = authflow.login(loginData)

// Check authentication status
if (authflow.isAuthenticated) {
    val currentUser = authflow.currentUser
    println("Logged in as: ${currentUser?.email}")
}

// Logout
authflow.logout()
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/FIDO2 (Biometric, PIN, Pattern)
- OAuth2/OIDC flows
- Social login (Google, Facebook, Twitter)

### ✅ Android Integration
- Biometric authentication (Fingerprint, Face)
- Credential Manager API support
- Google One Tap integration
- Jetpack Compose support
- Coroutines & Flow
- LiveData support

### ✅ Kotlin Features
- Coroutines for async operations
- Flow for reactive streams
- Extension functions
- Sealed classes for results
- Data classes for models
- Null safety

## Android Integration

### AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    
    <application>
        <!-- Your activities -->
        
        <!-- OAuth callback -->
        <activity
            android:name=".OAuthCallbackActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="myapp"
                    android:host="oauth" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Application Class

```kotlin
class MyApplication : Application() {
    
    companion object {
        lateinit var authflow: AuthflowClient
    }
    
    override fun onCreate() {
        super.onCreate()
        
        authflow = AuthflowClient(
            context = this,
            domain = "https://auth.example.com",
            tenantSlug = "my-app"
        )
    }
}
```

## Jetpack Compose

```kotlin
import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

// ViewModel
class AuthViewModel(private val authflow: AuthflowClient) : ViewModel() {
    
    var isAuthenticated by mutableStateOf(false)
        private set
    
    var currentUser by mutableStateOf<User?>(null)
        private set
    
    var isLoading by mutableStateOf(false)
        private set
    
    var errorMessage by mutableStateOf<String?>(null)
        private set
    
    init {
        checkAuthStatus()
    }
    
    private fun checkAuthStatus() {
        isAuthenticated = authflow.isAuthenticated
        currentUser = authflow.currentUser
    }
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            
            try {
                val loginData = LoginData(email, password)
                val session = authflow.login(loginData)
                
                isAuthenticated = true
                currentUser = session.user
            } catch (e: AuthflowException) {
                errorMessage = e.message
            } finally {
                isLoading = false
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            authflow.logout()
            isAuthenticated = false
            currentUser = null
        }
    }
}

// Composable
@Composable
fun LoginScreen(viewModel: AuthViewModel = viewModel()) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        
        viewModel.errorMessage?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = { viewModel.login(email, password) },
            enabled = !viewModel.isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (viewModel.isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                Text("Login")
            }
        }
        
        TextButton(
            onClick = { /* Login with biometrics */ },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Login with Biometrics")
        }
    }
}
```

## Coroutines Support

```kotlin
// All operations support Kotlin coroutines
suspend fun authenticateUser() {
    try {
        val loginData = LoginData(
            email = "user@example.com",
            password = "password"
        )
        
        val session = authflow.login(loginData)
        println("Logged in: ${session.user.email}")
        
        // Chain operations
        val user = authflow.getCurrentUser()
        println("Current user: ${user.email}")
        
    } catch (e: AuthflowAuthenticationException) {
        println("Authentication failed: ${e.message}")
    } catch (e: AuthflowException) {
        println("Error: ${e.message}")
    }
}
```

## Flow Support

```kotlin
import kotlinx.coroutines.flow.*

// Observe authentication state
authflow.authStateFlow
    .collect { isAuthenticated ->
        println("Auth state changed: $isAuthenticated")
    }

// Observe current user
authflow.currentUserFlow
    .filterNotNull()
    .collect { user ->
        println("User: ${user.email}")
    }

// Reactive login
suspend fun reactiveLogin(email: String, password: String) {
    authflow.loginFlow(LoginData(email, password))
        .catch { e -> println("Error: ${e.message}") }
        .collect { session -> 
            println("Logged in: ${session.user.email}")
        }
}
```

## Biometric Authentication

```kotlin
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat

fun loginWithBiometrics(activity: FragmentActivity) {
    val executor = ContextCompat.getMainExecutor(activity)
    
    val biometricPrompt = BiometricPrompt(
        activity,
        executor,
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(
                result: BiometricPrompt.AuthenticationResult
            ) {
                lifecycleScope.launch {
                    try {
                        val session = authflow.loginWithBiometrics()
                        println("Logged in: ${session.user.email}")
                    } catch (e: AuthflowException) {
                        println("Error: ${e.message}")
                    }
                }
            }
            
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                println("Biometric error: $errString")
            }
        }
    )
    
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Login to AuthFlow")
        .setSubtitle("Use your fingerprint or face")
        .setNegativeButtonText("Cancel")
        .build()
    
    biometricPrompt.authenticate(promptInfo)
}
```

## Google One Tap

```kotlin
import com.google.android.gms.auth.api.identity.*

fun signInWithGoogle(activity: FragmentActivity) {
    val oneTapClient = Identity.getSignInClient(activity)
    
    val signInRequest = BeginSignInRequest.builder()
        .setGoogleIdTokenRequestOptions(
            BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                .setSupported(true)
                .setServerClientId("YOUR_WEB_CLIENT_ID")
                .setFilterByAuthorizedAccounts(false)
                .build()
        )
        .build()
    
    oneTapClient.beginSignIn(signInRequest)
        .addOnSuccessListener { result ->
            val intentSenderRequest = IntentSenderRequest.Builder(result.pendingIntent.intentSender).build()
            // Launch intent...
        }
}

// Handle result
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    
    if (requestCode == ONE_TAP_REQUEST_CODE) {
        val credential = oneTapClient.getSignInCredentialFromIntent(data)
        val idToken = credential.googleIdToken
        
        lifecycleScope.launch {
            try {
                val session = authflow.signInWithGoogle(idToken)
                println("Signed in: ${session.user.email}")
            } catch (e: AuthflowException) {
                println("Error: ${e.message}")
            }
        }
    }
}
```

## Multi-Factor Authentication

```kotlin
// Enable TOTP MFA
suspend fun enableMFA() {
    try {
        val mfaSetup = authflow.enableMFATOTP()
        println("Secret: ${mfaSetup.secret}")
        println("QR Code: ${mfaSetup.qrCode}")
        
        // Show QR code to user...
        
        // Verify TOTP
        val code = getUserInput() // Get code from user
        authflow.verifyMFATOTP(code)
        
    } catch (e: AuthflowException) {
        println("Error: ${e.message}")
    }
}

// Login with MFA
suspend fun loginWithMFA(email: String, password: String, mfaCode: String) {
    val loginData = LoginData(
        email = email,
        password = password,
        mfaCode = mfaCode
    )
    
    val session = authflow.login(loginData)
}
```

## WebAuthn / FIDO2

```kotlin
import com.google.android.gms.fido.Fido
import com.google.android.gms.fido.fido2.api.common.*

// Register FIDO2 credential
suspend fun registerWebAuthn(activity: FragmentActivity) {
    try {
        val options = authflow.beginWebAuthnRegistration()
        
        val fido2ApiClient = Fido.getFido2ApiClient(activity)
        val task = fido2ApiClient.getRegisterPendingIntent(options.toPublicKeyCredentialCreationOptions())
        
        task.addOnSuccessListener { pendingIntent ->
            // Launch intent...
        }
    } catch (e: AuthflowException) {
        println("Error: ${e.message}")
    }
}
```

## Migration from Auth0

```kotlin
// Before (Auth0)
val auth0 = Auth0(
    "client-id",
    "your-domain.auth0.com"
)

val authenticationAPIClient = AuthenticationAPIClient(auth0)

authenticationAPIClient
    .login("user@example.com", "password", "realm")
    .start(object : Callback<Credentials, AuthenticationException> {
        override fun onSuccess(credentials: Credentials) {
            println("Logged in")
        }
        override fun onFailure(error: AuthenticationException) {
            println("Error: ${error.message}")
        }
    })

// After (AuthFlow)
val authflow = AuthflowClient(
    domain = "https://your-authflow-instance.com",
    tenantSlug = "your-tenant"
)

lifecycleScope.launch {
    try {
        val loginData = LoginData(
            email = "user@example.com",
            password = "password"
        )
        val session = authflow.login(loginData)
        println("Logged in: ${session.user.email}")
    } catch (e: AuthflowException) {
        println("Error: ${e.message}")
    }
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/kotlin
- **GitHub**: https://github.com/authflow/authflow-kotlin
- **Issues**: https://github.com/authflow/authflow-kotlin/issues

## Requirements

- Android 5.0+ (API 21+) or JVM
- Kotlin 1.8+
- Gradle 7.0+

## License

MIT
