/**
 * AuthFlow NestJS SDK
 * Official NestJS integration for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/nestjs-sdk
 * 
 * Usage in app.module.ts:
 * import { AuthFlowModule } from '@authflow/nestjs-sdk';
 * 
 * @Module({
 *   imports: [
 *     AuthFlowModule.forRoot({
 *       domain: process.env.AUTHFLOW_DOMAIN,
 *       clientId: process.env.AUTHFLOW_CLIENT_ID,
 *       clientSecret: process.env.AUTHFLOW_CLIENT_SECRET,
 *     }),
 *   ],
 * })
 */

import { Module, DynamicModule, Global, Injectable, CanActivate, ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector, ModuleMetadata } from '@nestjs/core';
import axios, { AxiosInstance } from 'axios';

export interface AuthFlowModuleOptions {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export interface AuthFlowUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tenantId?: string;
}

@Injectable()
export class AuthFlowClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private httpClient: AxiosInstance;

  constructor(options: AuthFlowModuleOptions) {
    this.domain = options.domain.replace(/\/$/, '');
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.httpClient = axios.create({
      baseURL: this.domain,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<any> {
    const response = await this.httpClient.post('/api/auth/register', userData);
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.httpClient.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<{ user: AuthFlowUser }> {
    const response = await this.httpClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async setupMFA(token: string, method: 'totp' | 'email' | 'sms'): Promise<any> {
    const response = await this.httpClient.post('/api/auth/mfa/setup',
      { method },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  }

  async verifyMFA(token: string, code: string, method: string): Promise<any> {
    const response = await this.httpClient.post('/api/auth/mfa/verify',
      { code, method },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  }

  async logout(token: string): Promise<void> {
    await this.httpClient.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getOAuthUrl(provider: 'google' | 'github', redirectUri: string): string {
    return `${this.domain}/api/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
}

// Guard for protected routes
@Injectable()
export class AuthFlowGuard implements CanActivate {
  constructor(
    private authFlowClient: AuthFlowClient,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);

    try {
      const { user } = await this.authFlowClient.verifyToken(token);
      request.authflowUser = user;
      return true;
    } catch {
      return false;
    }
  }
}

// Decorator for public routes
export const Public = () => SetMetadata('isPublic', true);

// Decorator to get current user
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthFlowUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.authflowUser;
  },
);

// Module definition
@Global()
@Module({})
export class AuthFlowModule {
  static forRoot(options: AuthFlowModuleOptions): DynamicModule {
    return {
      module: AuthFlowModule,
      providers: [
        {
          provide: 'AUTHFLOW_OPTIONS',
          useValue: options,
        },
        {
          provide: AuthFlowClient,
          useFactory: () => new AuthFlowClient(options),
        },
        AuthFlowGuard,
      ],
      exports: [AuthFlowClient, AuthFlowGuard],
      global: true,
    };
  }
}

// Example controller usage:
/*
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthFlowClient, AuthFlowGuard, Public, CurrentUser, AuthFlowUser } from '@authflow/nestjs-sdk';

@Controller('auth')
export class AuthController {
  constructor(private authFlowClient: AuthFlowClient) {}

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authFlowClient.login(body.email, body.password);
  }

  @Public()
  @Post('register')
  async register(@Body() body: any) {
    return this.authFlowClient.register(body);
  }

  @UseGuards(AuthFlowGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthFlowUser) {
    return { user };
  }
}

// In app.module.ts, set the guard globally:
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthFlowGuard,
    },
  ],
})
export class AppModule {}
*/
