# AuthFlow Angular SDK

Official Angular SDK for AuthFlow authentication platform. Optimized for Angular 14+ with services, guards, and interceptors.

## Installation

```bash
npm install @authflow/angular
# or
yarn add @authflow/angular
# or  
pnpm add @authflow/angular
```

## Quick Start

### 1. Import AuthflowModule

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthflowModule } from '@authflow/angular';

@NgModule({
  imports: [
    BrowserModule,
    AuthflowModule.forRoot({
      domain: 'https://your-authflow-instance.com',
      tenantSlug: 'your-tenant',
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

### 2. Use AuthService

```typescript
// login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '@authflow/angular';

@Component({
  selector: 'app-login',
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" type="email" placeholder="Email" />
      <input [(ngModel)]="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
    <p *ngIf="authService.isAuthenticated$ | async">
      Welcome {{ (authService.user$ | async)?.email }}
    </p>
  `,
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(public authService: AuthService) {}

  async onSubmit() {
    try {
      await this.authService.login({
        email: this.email,
        password: this.password,
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
}
```

## Features

### ✅ Angular-Specific Features
- Injectable Services (AuthService, MFAService, OAuthService)
- Route Guards (AuthGuard, RoleGuard)
- HTTP Interceptors (TokenInterceptor)
- Reactive patterns with RxJS Observables
- Standalone components support (Angular 14+)
- Strict TypeScript types
- AOT compilation compatible

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Passkeys
- OAuth2/OIDC flows
- Social login (Google, Microsoft, GitHub)

## Services

### AuthService

```typescript
import { Injectable } from '@angular/core';
import { AuthService } from '@authflow/angular';

@Injectable()
export class MyComponent {
  constructor(private authService: AuthService) {
    // Observables
    this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('Authenticated:', isAuth);
    });
    
    this.authService.user$.subscribe(user => {
      console.log('Current user:', user);
    });
  }
  
  async login() {
    const session = await this.authService.login({
      email: 'user@example.com',
      password: 'password',
    });
  }
  
  async logout() {
    await this.authService.logout();
  }
  
  async register() {
    const user = await this.authService.register({
      email: 'user@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
    });
  }
}
```

### MFAService

```typescript
import { Component } from '@angular/core';
import { MFAService } from '@authflow/angular';

@Component({
  selector: 'app-mfa-settings',
  template: `
    <div *ngIf="mfaService.isEnabled$ | async; else notEnabled">
      <p>MFA is enabled</p>
      <button (click)="disableMFA()">Disable MFA</button>
    </div>
    
    <ng-template #notEnabled>
      <button (click)="enableTOTP()">Enable TOTP</button>
    </ng-template>
    
    <img *ngIf="qrCode" [src]="qrCode" alt="QR Code" />
  `,
})
export class MFASettingsComponent {
  qrCode: string | null = null;
  
  constructor(public mfaService: MFAService) {}
  
  async enableTOTP() {
    const { qrCode } = await this.mfaService.enableMFATOTP();
    this.qrCode = qrCode;
  }
  
  async disableMFA() {
    await this.mfaService.disableMFA();
  }
}
```

### OAuthService

```typescript
import { Component } from '@angular/core';
import { OAuthService } from '@authflow/angular';

@Component({
  selector: 'app-social-login',
  template: `
    <button (click)="loginWithGoogle()" [disabled]="isLoading$ | async">
      Sign in with Google
    </button>
    <button (click)="loginWithGitHub()" [disabled]="isLoading$ | async">
      Sign in with GitHub
    </button>
  `,
})
export class SocialLoginComponent {
  isLoading$ = this.oauthService.isLoading$;
  
  constructor(private oauthService: OAuthService) {}
  
  async loginWithGoogle() {
    await this.oauthService.loginWithGoogle();
  }
  
  async loginWithGitHub() {
    await this.oauthService.loginWithGitHub();
  }
}
```

## Route Guards

### AuthGuard

```typescript
// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@authflow/angular';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }, // Require admin role
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

### RoleGuard

```typescript
import { RoleGuard } from '@authflow/angular';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [RoleGuard],
    data: {
      requiredRoles: ['admin', 'superadmin'],
      redirectTo: '/unauthorized',
    },
  },
];
```

### Custom Guard

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@authflow/angular';
import { map, take } from 'rxjs/operators';

@Injectable()
export class CustomAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate() {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
```

## HTTP Interceptor

### TokenInterceptor

```typescript
// app.module.ts
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from '@authflow/angular';

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
  ],
})
export class AppModule {}
```

### Custom Interceptor

```typescript
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@authflow/angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}
  
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    
    return next.handle(req);
  }
}
```

## Directives

### *ifAuthenticated

```typescript
<div *ifAuthenticated>
  <p>Welcome {{ (authService.user$ | async)?.email }}</p>
  <button (click)="logout()">Logout</button>
</div>

<div *ifNotAuthenticated>
  <a routerLink="/login">Login</a>
</div>
```

### *hasRole

```typescript
<button *hasRole="'admin'" (click)="deleteUser()">
  Delete User
</button>

<div *hasRole="['admin', 'moderator']">
  <p>Admin/Moderator only content</p>
</div>
```

## Standalone Components (Angular 14+)

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, AuthflowStandaloneModule } from '@authflow/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, AuthflowStandaloneModule],
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" type="email" placeholder="Email" />
      <input [(ngModel)]="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  
  constructor(private authService: AuthService) {}
  
  async onSubmit() {
    await this.authService.login({
      email: this.email,
      password: this.password,
    });
  }
}
```

## Multi-Factor Authentication

### TOTP Setup

```typescript
import { Component } from '@angular/core';
import { MFAService } from '@authflow/angular';

@Component({
  selector: 'app-totp-setup',
  template: `
    <div *ngIf="!qrCode">
      <button (click)="enableTOTP()">Enable TOTP</button>
    </div>
    
    <div *ngIf="qrCode">
      <img [src]="qrCode" alt="QR Code" />
      <input [(ngModel)]="code" placeholder="Enter 6-digit code" />
      <button (click)="verify()">Verify</button>
    </div>
  `,
})
export class TOTPSetupComponent {
  qrCode: string | null = null;
  code = '';
  
  constructor(private mfaService: MFAService) {}
  
  async enableTOTP() {
    const result = await this.mfaService.enableMFATOTP();
    this.qrCode = result.qrCode;
  }
  
  async verify() {
    await this.mfaService.verifyMFATOTP(this.code);
    alert('TOTP enabled successfully!');
  }
}
```

## WebAuthn / Passkeys

```typescript
import { Component } from '@angular/core';
import { WebAuthnService } from '@authflow/angular';

@Component({
  selector: 'app-passkey-setup',
  template: `
    <div *ngIf="hasPasskey$ | async; else noPasskey">
      <button (click)="loginWithPasskey()">Login with Passkey</button>
    </div>
    
    <ng-template #noPasskey>
      <button (click)="registerPasskey()">Register Passkey</button>
    </ng-template>
  `,
})
export class PasskeySetupComponent {
  hasPasskey$ = this.webAuthnService.hasPasskey$;
  
  constructor(private webAuthnService: WebAuthnService) {}
  
  async registerPasskey() {
    try {
      await this.webAuthnService.registerPasskey();
      alert('Passkey registered successfully!');
    } catch (error) {
      console.error('Passkey registration failed:', error);
    }
  }
  
  async loginWithPasskey() {
    try {
      const session = await this.webAuthnService.authenticateWithPasskey();
      console.log('Logged in with passkey:', session.user);
    } catch (error) {
      console.error('Passkey authentication failed:', error);
    }
  }
}
```

## Reactive Forms Integration

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@authflow/angular';

@Component({
  selector: 'app-login',
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" type="email" placeholder="Email" />
      <div *ngIf="loginForm.get('email')?.errors?.['required']">
        Email is required
      </div>
      
      <input formControlName="password" type="password" placeholder="Password" />
      <div *ngIf="loginForm.get('password')?.errors?.['required']">
        Password is required
      </div>
      
      <button type="submit" [disabled]="!loginForm.valid">Login</button>
    </form>
  `,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}
  
  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }
  
  async onSubmit() {
    if (this.loginForm.valid) {
      await this.authService.login(this.loginForm.value);
    }
  }
}
```

## Error Handling

```typescript
import { Component } from '@angular/core';
import { AuthService } from '@authflow/angular';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  template: `
    <div *ngIf="error$ | async as error" class="error">
      {{ error }}
    </div>
  `,
})
export class LoginComponent {
  error$ = this.authService.error$;
  
  constructor(private authService: AuthService) {}
  
  async login(email: string, password: string) {
    try {
      await this.authService.login({ email, password });
    } catch (error: any) {
      if (error.code === 'INVALID_CREDENTIALS') {
        console.error('Invalid email or password');
      } else if (error.code === 'MFA_REQUIRED') {
        // Redirect to MFA page
      }
    }
  }
}
```

## Configuration Options

```typescript
// app.module.ts
AuthflowModule.forRoot({
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
  
  // Optional settings
  cacheLocation: 'localStorage', // or 'sessionStorage', 'memory'
  
  // Redirect URIs
  redirectUri: window.location.origin,
  
  // Token refresh
  autoRefresh: true,
  refreshThreshold: 300, // Refresh 5 minutes before expiry
  
  // HTTP
  httpInterceptor: {
    allowedList: [
      'https://api.example.com/*',
      { uri: 'https://auth.example.com/*', tokenOptions: { audience: 'api' } },
    ],
  },
  
  // Error handling
  errorHandler: (error) => console.error('Auth error:', error),
})
```

## Migration from Auth0

```typescript
// Before (Auth0)
import { AuthModule } from '@auth0/auth0-angular';

@NgModule({
  imports: [
    AuthModule.forRoot({
      domain: 'your-domain.auth0.com',
      clientId: 'client-id',
      redirectUri: window.location.origin,
    }),
  ],
})
export class AppModule {}

// Component
import { AuthService } from '@auth0/auth0-angular';

export class LoginComponent {
  constructor(public auth: AuthService) {}
  
  loginWithRedirect() {
    this.auth.loginWithRedirect();
  }
}

// After (AuthFlow)
import { AuthflowModule } from '@authflow/angular';

@NgModule({
  imports: [
    AuthflowModule.forRoot({
      domain: 'https://your-authflow-instance.com',
      tenantSlug: 'your-tenant',
    }),
  ],
})
export class AppModule {}

// Component
import { AuthService } from '@authflow/angular';

export class LoginComponent {
  constructor(private authService: AuthService) {}
  
  async login() {
    await this.authService.login({ email, password });
  }
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/angular
- **GitHub**: https://github.com/authflow/authflow-angular
- **Issues**: https://github.com/authflow/authflow-angular/issues
- **npm**: https://www.npmjs.com/package/@authflow/angular

## Requirements

- Angular 12+ (14+ recommended for standalone components)
- TypeScript 4.6+
- RxJS 7+

## License

MIT
