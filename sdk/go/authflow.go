package authflow

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client represents an AuthFlow API client
type Client struct {
	Domain     string
	TenantSlug string
	HTTPClient *http.Client
	token      string
}

// User represents a user in the system
type User struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	FirstName     string    `json:"firstName"`
	LastName      string    `json:"lastName"`
	PhoneNumber   string    `json:"phoneNumber,omitempty"`
	Role          string    `json:"role"`
	TenantID      string    `json:"tenantId,omitempty"`
	EmailVerified bool      `json:"emailVerified"`
	PhoneVerified bool      `json:"phoneVerified"`
	MFAEnabled    bool      `json:"mfaEnabled"`
	CreatedAt     time.Time `json:"createdAt"`
}

// AuthResponse represents a successful authentication response
type AuthResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}

// RegisterData represents registration request data
type RegisterData struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	TenantSlug string `json:"tenantSlug,omitempty"`
}

// LoginData represents login request data
type LoginData struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	TenantSlug string `json:"tenantSlug,omitempty"`
}

// NewClient creates a new AuthFlow client
func NewClient(domain string, tenantSlug string) *Client {
	return &Client{
		Domain:     domain,
		TenantSlug: tenantSlug,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// SetToken sets the authentication token
func (c *Client) SetToken(token string) {
	c.token = token
}

// request makes an HTTP request to the AuthFlow API
func (c *Client) request(method, endpoint string, body interface{}) (*http.Response, error) {
	url := fmt.Sprintf("%s/api%s", c.Domain, endpoint)

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))
	}

	return c.HTTPClient.Do(req)
}

// Register creates a new user account
func (c *Client) Register(data RegisterData) (*User, error) {
	if data.TenantSlug == "" {
		data.TenantSlug = c.TenantSlug
	}

	resp, err := c.request("POST", "/auth/register", data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registration failed: %s", resp.Status)
	}

	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// Login authenticates a user
func (c *Client) Login(data LoginData) (*AuthResponse, error) {
	if data.TenantSlug == "" {
		data.TenantSlug = c.TenantSlug
	}

	resp, err := c.request("POST", "/auth/login", data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("login failed: %s", resp.Status)
	}

	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return nil, err
	}

	c.token = authResp.Token
	return &authResp, nil
}

// Logout terminates the current session
func (c *Client) Logout() error {
	resp, err := c.request("POST", "/auth/logout", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	c.token = ""
	return nil
}

// GetCurrentUser retrieves the current authenticated user
func (c *Client) GetCurrentUser() (*User, error) {
	resp, err := c.request("GET", "/auth/me", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get current user: %s", resp.Status)
	}

	var result struct {
		User User `json:"user"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result.User, nil
}

// EnableMFATOTP enables TOTP-based MFA
func (c *Client) EnableMFATOTP() (map[string]interface{}, error) {
	resp, err := c.request("POST", "/user/mfa/totp/setup", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

// VerifyMFATOTP verifies a TOTP code
func (c *Client) VerifyMFATOTP(code string) error {
	body := map[string]string{"code": code}
	resp, err := c.request("POST", "/user/mfa/totp/verify", body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("MFA verification failed: %s", resp.Status)
	}

	return nil
}
