/**
 * AuthFlow Blazor SDK
 * Official Blazor (Server & WebAssembly) integration for AuthFlow
 * 
 * Installation:
 * dotnet add package AuthFlow.Blazor
 * 
 * Program.cs:
 * builder.Services.AddAuthFlowAuthentication(options => {
 *     options.Domain = builder.Configuration["AuthFlow:Domain"];
 *     options.ClientId = builder.Configuration["AuthFlow:ClientId"];
 *     options.ClientSecret = builder.Configuration["AuthFlow:ClientSecret"];
 * });
 */

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace AuthFlow.Blazor;

public class AuthFlowOptions
{
    public string Domain { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public class AuthFlowUser
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Role { get; set; }
    public string? TenantId { get; set; }
}

public class AuthFlowClient
{
    private readonly HttpClient _httpClient;
    private readonly AuthFlowOptions _options;

    public AuthFlowClient(HttpClient httpClient, AuthFlowOptions options)
    {
        _httpClient = httpClient;
        _options = options;
        _httpClient.BaseAddress = new Uri(options.Domain.TrimEnd('/'));
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/auth/register", request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AuthResponse>(cancellationToken: ct) 
            ?? throw new Exception("Invalid response");
    }

    public async Task<AuthResponse> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var request = new { email, password };
        var response = await _httpClient.PostAsJsonAsync("/api/auth/login", request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<AuthResponse>(cancellationToken: ct)
            ?? throw new Exception("Invalid response");
    }

    public async Task<UserResponse> VerifyTokenAsync(string token, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<UserResponse>(cancellationToken: ct)
            ?? throw new Exception("Invalid response");
    }

    public async Task<MfaSetupResponse> SetupMfaAsync(string token, string method, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/mfa/setup");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { method });
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<MfaSetupResponse>(cancellationToken: ct)
            ?? throw new Exception("Invalid response");
    }

    public async Task<MfaVerifyResponse> VerifyMfaAsync(string token, string code, string method, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/mfa/verify");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = JsonContent.Create(new { code, method });
        var response = await _httpClient.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<MfaVerifyResponse>(cancellationToken: ct)
            ?? throw new Exception("Invalid response");
    }

    public async Task LogoutAsync(string token, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await _httpClient.SendAsync(request, ct);
    }

    public string GetOAuthUrl(string provider, string redirectUri)
    {
        return $"{_options.Domain}/api/auth/oauth/{provider}?redirect_uri={Uri.EscapeDataString(redirectUri)}";
    }
}

public record RegisterRequest(string Email, string Password, string? FirstName = null, string? LastName = null);
public record AuthResponse(string Token, AuthFlowUser User);
public record UserResponse(AuthFlowUser User);
public record MfaSetupResponse(string Secret, string QrCode);
public record MfaVerifyResponse(string Token, AuthFlowUser User);

// Blazor Authentication State Provider
public class AuthFlowAuthenticationStateProvider : AuthenticationStateProvider
{
    private readonly AuthFlowClient _client;
    private readonly ITokenStorage _tokenStorage;

    public AuthFlowAuthenticationStateProvider(AuthFlowClient client, ITokenStorage tokenStorage)
    {
        _client = client;
        _tokenStorage = tokenStorage;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        var token = await _tokenStorage.GetTokenAsync();
        
        if (string.IsNullOrEmpty(token))
        {
            return new AuthenticationState(new System.Security.Claims.ClaimsPrincipal());
        }

        try
        {
            var userResponse = await _client.VerifyTokenAsync(token);
            var identity = new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userResponse.User.Id),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, userResponse.User.Email),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, userResponse.User.Email),
            }, "authflow");

            var principal = new System.Security.Claims.ClaimsPrincipal(identity);
            return new AuthenticationState(principal);
        }
        catch
        {
            await _tokenStorage.RemoveTokenAsync();
            return new AuthenticationState(new System.Security.Claims.ClaimsPrincipal());
        }
    }

    public async Task LoginAsync(string email, string password)
    {
        var response = await _client.LoginAsync(email, password);
        await _tokenStorage.SetTokenAsync(response.Token);
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }

    public async Task LogoutAsync()
    {
        var token = await _tokenStorage.GetTokenAsync();
        if (!string.IsNullOrEmpty(token))
        {
            await _client.LogoutAsync(token);
        }
        await _tokenStorage.RemoveTokenAsync();
        NotifyAuthenticationStateChanged(GetAuthenticationStateAsync());
    }
}

public interface ITokenStorage
{
    Task<string?> GetTokenAsync();
    Task SetTokenAsync(string token);
    Task RemoveTokenAsync();
}

// Extension methods
public static class AuthFlowExtensions
{
    public static IServiceCollection AddAuthFlowAuthentication(
        this IServiceCollection services, 
        Action<AuthFlowOptions> configureOptions)
    {
        var options = new AuthFlowOptions();
        configureOptions(options);

        services.AddSingleton(options);
        services.AddScoped<AuthFlowClient>();
        services.AddScoped<AuthenticationStateProvider, AuthFlowAuthenticationStateProvider>();
        services.AddAuthorizationCore();

        return services;
    }
}

// Example Blazor component usage:
/*
@page "/login"
@inject AuthFlowAuthenticationStateProvider AuthState
@inject NavigationManager Navigation

<EditForm Model="@loginModel" OnValidSubmit="HandleLogin">
    <InputText @bind-Value="loginModel.Email" />
    <InputText @bind-Value="loginModel.Password" type="password" />
    <button type="submit">Login</button>
</EditForm>

@code {
    private LoginModel loginModel = new();

    private async Task HandleLogin()
    {
        await AuthState.LoginAsync(loginModel.Email, loginModel.Password);
        Navigation.NavigateTo("/");
    }

    class LoginModel
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }
}
*/
