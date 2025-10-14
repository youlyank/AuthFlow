require 'net/http'
require 'json'
require 'uri'

module Authflow
  class Client
    attr_accessor :domain, :tenant_slug, :token

    def initialize(domain:, tenant_slug: nil)
      @domain = domain.chomp('/')
      @tenant_slug = tenant_slug
      @token = nil
    end

    def register(email:, password:, first_name:, last_name:, tenant_slug: nil)
      request(
        :post,
        '/auth/register',
        {
          email: email,
          password: password,
          firstName: first_name,
          lastName: last_name,
          tenantSlug: tenant_slug || @tenant_slug
        }
      )
    end

    def login(email:, password:, tenant_slug: nil)
      response = request(
        :post,
        '/auth/login',
        {
          email: email,
          password: password,
          tenantSlug: tenant_slug || @tenant_slug
        }
      )
      
      @token = response['token'] if response['token']
      response
    end

    def logout
      request(:post, '/auth/logout')
      @token = nil
      nil
    end

    def current_user
      response = request(:get, '/auth/me')
      response['user']
    end

    def enable_mfa_totp
      request(:post, '/user/mfa/totp/setup')
    end

    def verify_mfa_totp(code:)
      request(:post, '/user/mfa/totp/verify', { code: code })
    end

    def enable_mfa_sms
      request(:post, '/user/mfa/sms/enable')
    end

    def verify_mfa_sms(code:, remember_device: false)
      request(
        :post,
        '/user/mfa/sms/verify',
        {
          code: code,
          rememberDevice: remember_device
        }
      )
    end

    def send_magic_link(email:, redirect_url: nil, tenant_slug: nil)
      request(
        :post,
        '/auth/magic-link/send',
        {
          email: email,
          redirectUrl: redirect_url,
          tenantSlug: tenant_slug || @tenant_slug
        }
      )
    end

    def create_api_key(name:, expires_at: nil, permissions: nil)
      data = { name: name }
      data[:expiresAt] = expires_at if expires_at
      data[:permissions] = permissions if permissions
      
      request(:post, '/api-keys', data)
    end

    def list_api_keys
      request(:get, '/api-keys')
    end

    def delete_api_key(id:)
      request(:delete, "/api-keys/#{id}")
      nil
    end

    def create_webhook(url:, events:, description: nil)
      data = {
        url: url,
        events: events
      }
      data[:description] = description if description
      
      request(:post, '/webhooks', data)
    end

    def list_webhooks
      request(:get, '/webhooks')
    end

    def delete_webhook(id:)
      request(:delete, "/webhooks/#{id}")
      nil
    end

    private

    def request(method, endpoint, data = nil)
      uri = URI("#{@domain}/api#{endpoint}")
      
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == 'https'
      
      request_class = case method
                      when :get then Net::HTTP::Get
                      when :post then Net::HTTP::Post
                      when :put then Net::HTTP::Put
                      when :patch then Net::HTTP::Patch
                      when :delete then Net::HTTP::Delete
                      else raise ArgumentError, "Unsupported method: #{method}"
                      end
      
      request = request_class.new(uri.path)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Bearer #{@token}" if @token
      request.body = data.to_json if data && method != :get
      
      response = http.request(request)
      
      raise "Request failed: #{response.code} #{response.body}" unless response.code.to_i < 400
      
      response.body.empty? ? {} : JSON.parse(response.body)
    end
  end
end
