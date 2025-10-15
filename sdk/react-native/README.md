# AuthFlow React Native SDK

Official React Native SDK for AuthFlow authentication platform. Supports iOS and Android.

## Installation

```bash
npm install @authflow/react-native
# or
yarn add @authflow/react-native
```

### iOS Setup

```bash
cd ios && pod install
```

### Android Setup

No additional setup required.

## Quick Start

```typescript
import { AuthflowProvider, useAuthflow } from '@authflow/react-native';

// Wrap your app with AuthflowProvider
export default function App() {
  return (
    <AuthflowProvider
      domain="https://your-authflow-instance.com"
      tenantSlug="your-tenant" // Optional
    >
      <MainApp />
    </AuthflowProvider>
  );
}

// Use in components
function LoginScreen() {
  const { login, isAuthenticated, user } = useAuthflow();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      await login({ email, password });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  if (isAuthenticated) {
    return <Text>Welcome {user?.email}</Text>;
  }
  
  return (
    <View>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- OAuth2/OIDC flows
- Social login (Google, Apple, Facebook)

### ✅ React Native Features
- React Hooks (useAuthflow, useMFA, useOAuth)
- Context API integration
- TypeScript support
- Biometric authentication (iOS/Android)
- Secure storage (Keychain/Keystore)
- Deep linking support

### ✅ Native Modules
- Face ID / Touch ID (iOS)
- Fingerprint / Face Unlock (Android)
- Secure token storage
- Push notifications (optional)

## Hooks API

### useAuthflow

```typescript
import { useAuthflow } from '@authflow/react-native';

function MyComponent() {
  const {
    // State
    isAuthenticated,
    isLoading,
    user,
    
    // Methods
    login,
    register,
    logout,
    getCurrentUser,
    
    // Error handling
    error,
    clearError,
  } = useAuthflow();
  
  return (
    // Your component
  );
}
```

### useMFA

```typescript
import { useMFA } from '@authflow/react-native';

function MFAScreen() {
  const {
    enableMFATOTP,
    verifyMFATOTP,
    sendEmailOTP,
    verifySMSOTP,
    mfaMethods,
    isSettingUp,
  } = useMFA();
  
  const handleEnableTOTP = async () => {
    const { secret, qrCode } = await enableMFATOTP();
    // Show QR code to user
  };
  
  return (
    // Your MFA UI
  );
}
```

### useOAuth

```typescript
import { useOAuth } from '@authflow/react-native';

function SocialLoginScreen() {
  const {
    loginWithGoogle,
    loginWithApple,
    loginWithFacebook,
    isLoading,
  } = useOAuth();
  
  return (
    <View>
      <Button title="Sign in with Google" onPress={loginWithGoogle} />
      <Button title="Sign in with Apple" onPress={loginWithApple} />
    </View>
  );
}
```

### useBiometrics

```typescript
import { useBiometrics } from '@authflow/react-native';

function BiometricLoginScreen() {
  const {
    isAvailable,
    biometricType, // 'FaceID' | 'TouchID' | 'Fingerprint' | 'Face' | null
    enableBiometrics,
    loginWithBiometrics,
  } = useBiometrics();
  
  if (!isAvailable) {
    return <Text>Biometrics not available</Text>;
  }
  
  return (
    <Button
      title={`Login with ${biometricType}`}
      onPress={loginWithBiometrics}
    />
  );
}
```

## Authentication

### Register

```typescript
import { useAuthflow } from '@authflow/react-native';

function RegisterScreen() {
  const { register } = useAuthflow();
  
  const handleRegister = async () => {
    try {
      const user = await register({
        email: 'user@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      });
      console.log('Registered:', user);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
  
  return (
    // Your registration UI
  );
}
```

### Login

```typescript
const { login } = useAuthflow();

const handleLogin = async () => {
  try {
    const session = await login({
      email: 'user@example.com',
      password: 'password',
    });
    console.log('Logged in:', session.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Logout

```typescript
const { logout } = useAuthflow();

const handleLogout = async () => {
  await logout();
  // User is logged out, UI will update automatically
};
```

## Biometric Authentication

### iOS (Face ID / Touch ID)

```typescript
import { useBiometrics } from '@authflow/react-native';

function BiometricSetup() {
  const { enableBiometrics, loginWithBiometrics, biometricType } = useBiometrics();
  
  const handleEnableBiometrics = async () => {
    try {
      await enableBiometrics({
        reason: 'Authenticate to enable Face ID',
      });
      Alert.alert('Success', 'Face ID enabled');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleBiometricLogin = async () => {
    try {
      const session = await loginWithBiometrics({
        reason: 'Authenticate to login',
      });
      console.log('Logged in:', session.user);
    } catch (error) {
      console.error('Biometric login failed:', error);
    }
  };
  
  return (
    <View>
      <Text>{biometricType} is available</Text>
      <Button title="Enable Biometrics" onPress={handleEnableBiometrics} />
      <Button title="Login with Biometrics" onPress={handleBiometricLogin} />
    </View>
  );
}
```

## Multi-Factor Authentication

### TOTP (Authenticator App)

```typescript
import { useMFA } from '@authflow/react-native';
import QRCode from 'react-native-qrcode-svg';

function TOTPSetup() {
  const { enableMFATOTP, verifyMFATOTP } = useMFA();
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  
  const handleEnableTOTP = async () => {
    const { secret, qrCode } = await enableMFATOTP();
    setQrCode(qrCode);
  };
  
  const handleVerify = async () => {
    await verifyMFATOTP(code);
    Alert.alert('Success', 'TOTP MFA enabled');
  };
  
  return (
    <View>
      {qrCode ? (
        <>
          <QRCode value={qrCode} size={200} />
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
          />
          <Button title="Verify" onPress={handleVerify} />
        </>
      ) : (
        <Button title="Enable TOTP" onPress={handleEnableTOTP} />
      )}
    </View>
  );
}
```

### Email OTP

```typescript
const { sendEmailOTP, verifyEmailOTP } = useMFA();

// Send OTP
await sendEmailOTP();

// Verify OTP
await verifyEmailOTP('123456');
```

### SMS OTP

```typescript
const { sendSMSOTP, verifySMSOTP } = useMFA();

// Send OTP
await sendSMSOTP({ phoneNumber: '+1234567890' });

// Verify OTP
await verifySMSOTP('123456');
```

## OAuth2 / Social Login

### Google Sign-In

```typescript
import { useOAuth } from '@authflow/react-native';

function GoogleLogin() {
  const { loginWithGoogle, isLoading } = useOAuth();
  
  const handleGoogleLogin = async () => {
    try {
      const session = await loginWithGoogle();
      console.log('Logged in with Google:', session.user);
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };
  
  return (
    <Button
      title="Sign in with Google"
      onPress={handleGoogleLogin}
      disabled={isLoading}
    />
  );
}
```

### Sign in with Apple

```typescript
import { useOAuth } from '@authflow/react-native';

function AppleLogin() {
  const { loginWithApple, isLoading } = useOAuth();
  
  const handleAppleLogin = async () => {
    try {
      const session = await loginWithApple();
      console.log('Logged in with Apple:', session.user);
    } catch (error) {
      console.error('Apple login failed:', error);
    }
  };
  
  return (
    <Button
      title="Sign in with Apple"
      onPress={handleAppleLogin}
      disabled={isLoading}
    />
  );
}
```

## Magic Links

```typescript
import { useAuthflow } from '@authflow/react-native';
import { Linking } from 'react-native';

function MagicLinkLogin() {
  const { sendMagicLink, verifyMagicLink } = useAuthflow();
  
  const handleSendMagicLink = async (email: string) => {
    await sendMagicLink({
      email,
      redirectUrl: 'myapp://auth/callback',
    });
    Alert.alert('Success', 'Check your email for the magic link');
  };
  
  // Handle deep link
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = new URL(event.url);
      const token = url.searchParams.get('token');
      
      if (token) {
        const session = await verifyMagicLink(token);
        console.log('Logged in via magic link:', session.user);
      }
    };
    
    Linking.addEventListener('url', handleDeepLink);
    
    return () => {
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);
  
  return (
    // Your magic link UI
  );
}
```

## Deep Linking Setup

### iOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

### Android (AndroidManifest.xml)

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" android:host="auth" />
</intent-filter>
```

## Navigation Integration

### React Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthflow } from '@authflow/react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthflow();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Error Handling

```typescript
import { useAuthflow } from '@authflow/react-native';

function LoginScreen() {
  const { login, error, clearError } = useAuthflow();
  
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error.message, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);
  
  const handleLogin = async () => {
    try {
      await login({ email, password });
    } catch (error) {
      // Error is also available in the error state
      console.error('Login failed:', error);
    }
  };
  
  return (
    // Your UI
  );
}
```

## Configuration Options

```typescript
<AuthflowProvider
  domain="https://auth.example.com"
  tenantSlug="my-app"
  
  // Optional settings
  timeout={30000}
  retryPolicy={{
    maxRetries: 3,
    backoffMultiplier: 2,
  }}
  
  // Token storage
  secureStorage={true}
  
  // Logging
  enableLogging={true}
  logLevel="info"
>
  <App />
</AuthflowProvider>
```

## Migration from Auth0

```typescript
// Before (Auth0)
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: 'your-domain.auth0.com',
  clientId: 'client-id',
});

auth0.auth
  .passwordRealm({
    username: 'user@example.com',
    password: 'password',
    realm: 'Username-Password-Authentication',
  })
  .then(credentials => console.log('Logged in'))
  .catch(error => console.error(error));

// After (AuthFlow)
import { useAuthflow } from '@authflow/react-native';

function LoginScreen() {
  const { login } = useAuthflow();
  
  const handleLogin = async () => {
    const session = await login({
      email: 'user@example.com',
      password: 'password',
    });
    console.log('Logged in:', session.user);
  };
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/react-native
- **GitHub**: https://github.com/authflow/authflow-react-native
- **Issues**: https://github.com/authflow/authflow-react-native/issues
- **npm**: https://www.npmjs.com/package/@authflow/react-native

## Requirements

- React Native 0.64+
- iOS 12+
- Android API 21+

## License

MIT
