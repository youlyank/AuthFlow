Gem::Specification.new do |spec|
  spec.name          = "authflow"
  spec.version       = "1.0.0"
  spec.authors       = ["AuthFlow Team"]
  spec.email         = ["support@authflow.com"]

  spec.summary       = "Official Ruby SDK for AuthFlow authentication platform"
  spec.description   = "Comprehensive authentication SDK with support for email/password, OAuth2, MFA, WebAuthn, and more"
  spec.homepage      = "https://github.com/authflow/authflow-ruby"
  spec.license       = "MIT"
  spec.required_ruby_version = ">= 2.7.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "https://github.com/authflow/authflow-ruby"
  spec.metadata["changelog_uri"] = "https://github.com/authflow/authflow-ruby/blob/main/CHANGELOG.md"

  spec.files = Dir.glob("{lib}/**/*") + %w[README.md LICENSE]
  spec.require_paths = ["lib"]

  spec.add_dependency "json", "~> 2.0"
end
