# AuthFlow Go SDK

Official Go SDK for AuthFlow authentication platform.

## Installation

```bash
go get github.com/authflow/authflow-go
```

## Usage

```go
package main

import (
    "fmt"
    "log"
    
    "github.com/authflow/authflow-go"
)

func main() {
    // Initialize client
    client := authflow.NewClient("https://your-domain.com", "your-tenant-slug")
    
    // Register a new user
    user, err := client.Register(authflow.RegisterData{
        Email:     "user@example.com",
        Password:  "SecurePassword123!",
        FirstName: "John",
        LastName:  "Doe",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("User registered: %s\n", user.Email)
    
    // Login
    authResp, err := client.Login(authflow.LoginData{
        Email:    "user@example.com",
        Password: "SecurePassword123!",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Logged in: %s\n", authResp.User.Email)
    
    // Get current user
    currentUser, err := client.GetCurrentUser()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Current user: %s\n", currentUser.Email)
}
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
