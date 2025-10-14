--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: gdpr_request_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.gdpr_request_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


ALTER TYPE public.gdpr_request_status OWNER TO neondb_owner;

--
-- Name: gdpr_request_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.gdpr_request_type AS ENUM (
    'export',
    'deletion'
);


ALTER TYPE public.gdpr_request_type OWNER TO neondb_owner;

--
-- Name: ip_restriction_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.ip_restriction_type AS ENUM (
    'allow',
    'block'
);


ALTER TYPE public.ip_restriction_type OWNER TO neondb_owner;

--
-- Name: mfa_method; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.mfa_method AS ENUM (
    'email',
    'totp',
    'sms'
);


ALTER TYPE public.mfa_method OWNER TO neondb_owner;

--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.notification_type AS ENUM (
    'system',
    'security',
    'announcement',
    'marketing',
    'billing'
);


ALTER TYPE public.notification_type OWNER TO neondb_owner;

--
-- Name: plan_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.plan_type AS ENUM (
    'starter',
    'pro',
    'enterprise',
    'custom'
);


ALTER TYPE public.plan_type OWNER TO neondb_owner;

--
-- Name: role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.role AS ENUM (
    'super_admin',
    'tenant_admin',
    'user'
);


ALTER TYPE public.role OWNER TO neondb_owner;

--
-- Name: security_event_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.security_event_type AS ENUM (
    'suspicious_login',
    'unusual_location',
    'multiple_failed_attempts',
    'password_breach_detected',
    'unusual_device',
    'unusual_time',
    'velocity_check_failed'
);


ALTER TYPE public.security_event_type OWNER TO neondb_owner;

--
-- Name: webhook_delivery_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.webhook_delivery_status AS ENUM (
    'pending',
    'processing',
    'success',
    'failed'
);


ALTER TYPE public.webhook_delivery_status OWNER TO neondb_owner;

--
-- Name: webhook_event; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.webhook_event AS ENUM (
    'user.created',
    'user.updated',
    'user.deleted',
    'user.login',
    'user.logout',
    'user.password_reset',
    'user.email_verified',
    'session.created',
    'session.expired',
    'mfa.enabled',
    'mfa.disabled',
    'subscription.updated'
);


ALTER TYPE public.webhook_event OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_keys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    name text NOT NULL,
    key_hash text NOT NULL,
    key_prefix text NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone,
    last_used_at timestamp without time zone,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.api_keys OWNER TO neondb_owner;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    user_id character varying,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text,
    changes jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: branding_customizations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.branding_customizations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    logo_url text,
    favicon_url text,
    primary_color text DEFAULT '#2563eb'::text,
    secondary_color text DEFAULT '#64748b'::text,
    accent_color text DEFAULT '#0ea5e9'::text,
    font_family text DEFAULT 'Inter'::text,
    custom_css text,
    login_page_title text,
    login_page_subtitle text,
    email_footer text,
    privacy_policy_url text,
    terms_of_service_url text,
    support_email text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.branding_customizations OWNER TO neondb_owner;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_verification_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verification_tokens OWNER TO neondb_owner;

--
-- Name: gdpr_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gdpr_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    tenant_id character varying,
    type public.gdpr_request_type NOT NULL,
    status public.gdpr_request_status DEFAULT 'pending'::public.gdpr_request_status NOT NULL,
    data_url text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    expires_at timestamp without time zone
);


ALTER TABLE public.gdpr_requests OWNER TO neondb_owner;

--
-- Name: ip_restrictions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ip_restrictions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    type public.ip_restriction_type NOT NULL,
    ip_address text,
    country_code text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ip_restrictions OWNER TO neondb_owner;

--
-- Name: login_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.login_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    email text NOT NULL,
    success boolean NOT NULL,
    ip_address text,
    user_agent text,
    location text,
    failure_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.login_history OWNER TO neondb_owner;

--
-- Name: magic_link_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.magic_link_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.magic_link_tokens OWNER TO neondb_owner;

--
-- Name: mfa_otp_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mfa_otp_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    code text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mfa_otp_tokens OWNER TO neondb_owner;

--
-- Name: mfa_secrets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.mfa_secrets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    secret text NOT NULL,
    backup_codes jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.mfa_secrets OWNER TO neondb_owner;

--
-- Name: notification_reads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notification_reads (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    notification_id character varying NOT NULL,
    user_id character varying NOT NULL,
    read_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification_reads OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    user_id character varying,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    icon_url text,
    priority text DEFAULT 'normal'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: oauth2_access_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth2_access_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token_hash text NOT NULL,
    client_id text NOT NULL,
    user_id character varying,
    scopes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth2_access_tokens OWNER TO neondb_owner;

--
-- Name: oauth2_authorization_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth2_authorization_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code_hash text NOT NULL,
    client_id text NOT NULL,
    user_id character varying,
    redirect_uri text NOT NULL,
    scopes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    code_challenge text,
    code_challenge_method text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth2_authorization_codes OWNER TO neondb_owner;

--
-- Name: oauth2_clients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth2_clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret_hash text NOT NULL,
    redirect_uris text[] DEFAULT ARRAY[]::text[] NOT NULL,
    grant_types text[] DEFAULT ARRAY['authorization_code'::text] NOT NULL,
    response_types text[] DEFAULT ARRAY['code'::text] NOT NULL,
    scopes text[] DEFAULT ARRAY['openid'::text, 'profile'::text, 'email'::text] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    logo_uri text,
    policy_uri text,
    tos_uri text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth2_clients OWNER TO neondb_owner;

--
-- Name: oauth2_refresh_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth2_refresh_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token_hash text NOT NULL,
    access_token_id character varying,
    client_id text NOT NULL,
    user_id character varying,
    scopes text[] DEFAULT ARRAY[]::text[] NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth2_refresh_tokens OWNER TO neondb_owner;

--
-- Name: oauth_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.oauth_accounts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oauth_accounts OWNER TO neondb_owner;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type public.plan_type NOT NULL,
    max_users integer NOT NULL,
    price integer NOT NULL,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.plans OWNER TO neondb_owner;

--
-- Name: rate_limits; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.rate_limits (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    action text NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    window_start timestamp without time zone DEFAULT now() NOT NULL,
    blocked_until timestamp without time zone
);


ALTER TABLE public.rate_limits OWNER TO neondb_owner;

--
-- Name: saml_configurations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.saml_configurations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    entity_id text NOT NULL,
    sso_url text NOT NULL,
    certificate text NOT NULL,
    sign_requests boolean DEFAULT false NOT NULL,
    encrypt_assertions boolean DEFAULT false NOT NULL,
    name_id_format text DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.saml_configurations OWNER TO neondb_owner;

--
-- Name: security_events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.security_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    type public.security_event_type NOT NULL,
    risk_score integer DEFAULT 0 NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    ip_address text,
    location text,
    resolved boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved_at timestamp without time zone,
    resolved_by character varying
);


ALTER TABLE public.security_events OWNER TO neondb_owner;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    refresh_token text NOT NULL,
    ip_address text,
    user_agent text,
    device_type text,
    device_name text,
    location text,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_activity_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: tenant_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenant_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    custom_price integer,
    custom_max_users integer,
    stripe_subscription_id text,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone DEFAULT now() NOT NULL,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tenant_plans OWNER TO neondb_owner;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#2563eb'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    allow_password_auth boolean DEFAULT true NOT NULL,
    allow_social_auth boolean DEFAULT true NOT NULL,
    allow_magic_link boolean DEFAULT true NOT NULL,
    require_email_verification boolean DEFAULT true NOT NULL,
    require_mfa boolean DEFAULT false NOT NULL,
    session_timeout integer DEFAULT 86400 NOT NULL,
    custom_domain text,
    allowed_domains jsonb DEFAULT '[]'::jsonb,
    features jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.tenants OWNER TO neondb_owner;

--
-- Name: trusted_devices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.trusted_devices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    fingerprint text NOT NULL,
    device_name text,
    is_trusted boolean DEFAULT false NOT NULL,
    last_seen_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.trusted_devices OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying,
    email text NOT NULL,
    password_hash text,
    first_name text,
    last_name text,
    avatar_url text,
    role public.role DEFAULT 'user'::public.role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_method public.mfa_method,
    last_login_at timestamp without time zone,
    last_login_ip text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: webauthn_credentials; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.webauthn_credentials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    credential_id text NOT NULL,
    public_key text NOT NULL,
    counter integer DEFAULT 0 NOT NULL,
    device_name text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webauthn_credentials OWNER TO neondb_owner;

--
-- Name: webhook_deliveries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.webhook_deliveries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    webhook_id character varying NOT NULL,
    tenant_id character varying NOT NULL,
    event text NOT NULL,
    payload jsonb NOT NULL,
    response_status integer,
    response_body text,
    status public.webhook_delivery_status DEFAULT 'pending'::public.webhook_delivery_status NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    next_retry_at timestamp without time zone,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webhook_deliveries OWNER TO neondb_owner;

--
-- Name: webhooks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.webhooks (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    url text NOT NULL,
    events text[] DEFAULT '{}'::text[] NOT NULL,
    secret text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.webhooks OWNER TO neondb_owner;

--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_keys (id, tenant_id, name, key_hash, key_prefix, permissions, is_active, expires_at, last_used_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, tenant_id, user_id, action, entity, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
f22029be-7288-4733-93e2-bcf1dd365730	\N	\N	user.created	user	fca17ad2-938c-46ab-a68e-07db02bef698	{"email": "mahakal@mahakal.com"}	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-10-13 18:38:35.96714
bd1a1c1b-7534-4917-ac2b-c6c2f93f7dcc	\N	\N	user.created	user	5b942c54-66f8-4087-b406-d3b987b495b4	{"email": "unew5577@gmail.com"}	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-10-13 18:38:59.55058
f90977e5-30ab-4f0c-9bb2-89a9445d89d2	\N	\N	user.created	user	ff7ca063-2e68-4bf7-85c5-a75e00f2cd0a	{"email": "anofficial41@gmail.com"}	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-10-13 18:45:17.268039
d0e96963-1884-4293-b4a3-d595e21a5e26	\N	\N	password_reset.requested	user	b59bae00-5d6d-4878-a78e-99def7b12495	{}	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	2025-10-13 19:13:04.512424
a7edf4e0-4034-488c-8d62-fc0070bbc9ea	\N	\N	user.created	user	6cdd33be-b5e9-4184-8a55-6992caada79e	{"email": "johndn@gmail.com"}	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	2025-10-13 20:28:38.21872
3e4fcf3d-cb01-4874-970e-19b8c4534776	\N	\N	user.created	user	5ed5a426-e551-4173-b80d-0d1408162958	{"email": "mahakal1@mahakal.com"}	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	2025-10-13 20:49:06.90875
\.


--
-- Data for Name: branding_customizations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.branding_customizations (id, tenant_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, custom_css, login_page_title, login_page_subtitle, email_footer, privacy_policy_url, terms_of_service_url, support_email, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_verification_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
78558455-a8e1-4f73-8d23-fef0a2de3c65	fca17ad2-938c-46ab-a68e-07db02bef698	179070	2025-10-13 18:53:35.917	2025-10-13 18:38:35.93041
dda35964-69b8-459c-b563-a28238d9c5ec	5b942c54-66f8-4087-b406-d3b987b495b4	210654	2025-10-13 18:53:59.512	2025-10-13 18:38:59.523394
a20061df-dfa3-4cee-8723-7ed9c1586704	ff7ca063-2e68-4bf7-85c5-a75e00f2cd0a	905387	2025-10-13 19:00:17.225	2025-10-13 18:45:17.238777
1af7e882-d032-49b4-965e-98000bb5333e	6cdd33be-b5e9-4184-8a55-6992caada79e	130564	2025-10-13 20:43:38.177	2025-10-13 20:28:38.190716
a04a6ec7-823b-457a-ae4f-bacb3d60d83f	5ed5a426-e551-4173-b80d-0d1408162958	127589	2025-10-13 21:04:06.85	2025-10-13 20:49:06.880364
\.


--
-- Data for Name: gdpr_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gdpr_requests (id, user_id, tenant_id, type, status, data_url, requested_at, completed_at, expires_at) FROM stdin;
\.


--
-- Data for Name: ip_restrictions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ip_restrictions (id, tenant_id, type, ip_address, country_code, description, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: login_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.login_history (id, user_id, email, success, ip_address, user_agent, location, failure_reason, created_at) FROM stdin;
75d9bb4f-9a1d-4c9f-9ae1-e3ada4cdb8d3	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:37:46.459677
e28df827-3e8d-4c23-8f90-675588cf871a	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:48:10.366708
55f190ed-7904-49b2-9dfd-f560c248dac3	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:48:30.729886
b03dd999-b00c-41e6-9453-7efbaacc796e	ff7ca063-2e68-4bf7-85c5-a75e00f2cd0a	anofficial41@gmail.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:49:11.943298
b6c2d9e4-6c98-4b17-b9ff-9ef0d98d6743	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:51:18.884719
35f075dd-bf70-49ec-864a-f22eaf8c584f	fca17ad2-938c-46ab-a68e-07db02bef698	mahakal@mahakal.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:51:42.375193
e93a6b52-e69c-4545-8b9b-e7be3f4c215e	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:53:37.615303
e93de864-f078-44be-b8c6-8f6a40bd174e	fca17ad2-938c-46ab-a68e-07db02bef698	mahakal@mahakal.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:57:00.755717
2a76e3be-7682-45c5-a8ab-64dbd8c31dfe	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 18:57:51.685251
2cb46a3a-d93e-497f-b431-c4d87f25d661	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid password	2025-10-13 19:04:26.221711
06400c01-0de7-4bb8-8745-0f5ed7305004	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:06:13.669228
06464efe-9a03-4aa7-9c26-b7dc18cc082e	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid password	2025-10-13 19:06:51.544922
1606522c-23f9-425f-86b9-f68fef0adfc7	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid password	2025-10-13 19:06:56.682979
5ab1ece7-1cfb-4173-a0c3-0a329948b9ca	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid password	2025-10-13 19:07:05.707061
6d9c8c6a-4e66-4bbf-9686-e3588bc54a2e	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:08:39.490878
8ca59c66-c4ff-4bee-89d1-7e06a9dcc12a	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:09:07.067963
8ccf7147-7617-4411-b2ef-e8b68e135081	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:10:48.989822
808ebdd2-42d3-40e1-9dfc-0beccda032cf	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 19:12:42.561474
ec5c60e2-b3d0-497e-a1be-120069f2a7ac	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:13:49.248164
4b9e6430-69fd-4b38-8a40-fd228c204d5c	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid password	2025-10-13 19:16:00.081295
71c89f77-0dfc-43cc-a77e-77b06ee02683	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:16:48.746542
a5987e82-643e-4260-8f1a-cd033d907e1a	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:17:35.749752
02877250-e216-43e6-916e-87c6ccaf2f22	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:24:31.25309
5a102c06-4ce6-42de-8999-c78c20652f5c	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:29:15.694458
3416a3fa-656a-4665-b8e5-09ec552a03fd	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:30:26.938955
76adcd9a-a0c3-46cf-8ce6-f336267411be	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:34:44.978507
7f0d519a-ae32-4d25-ae0f-2094fa8e74bd	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:35:51.23455
12b25550-ba67-46e6-b5cc-50e2982e26df	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:39:27.500001
aca0c3f4-abed-4539-a8ad-0171fddf8d2d	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-13 19:48:03.477622
cfa4d6eb-cae6-4629-9332-588777380240	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-13 19:48:29.958619
df7679d5-c78a-46c2-b4ec-feb6e0f430b0	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-13 19:48:43.668846
b111dd97-407c-4d89-9d86-357a73b09128	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 19:56:31.154434
e9166f2d-4104-42f0-9288-ac5a233e976e	0f7cd6ff-5734-43ca-b228-cf5606091cc2	superadmin@authflow.io	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:02:48.671602
c406f837-f761-4957-a4f4-8d50165aedff	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:23:47.315222
f89836ed-0abd-47de-b8d4-7afed7daa435	6cdd33be-b5e9-4184-8a55-6992caada79e	johndn@gmail.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:28:55.245382
47dcb2bd-ae2d-4a7e-a0a6-4af51755c0c7	\N	superadmin@workflow.io	f	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	Invalid credentials	2025-10-13 20:32:34.86123
f7641b9e-47b1-4754-acec-93bcd3a538d1	\N	superadmin@workflow.io	f	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	Invalid credentials	2025-10-13 20:32:38.618322
307b8269-13f8-44d8-ae16-dfffae5b0445	\N	admin@workflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid credentials	2025-10-13 20:33:51.699331
a5b9ef82-684d-44d4-b086-ea1cda68e995	fca17ad2-938c-46ab-a68e-07db02bef698	mahakal@mahakal.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:34:37.495079
01dffd23-4ad5-4671-bb39-4bfa1d7f9a37	\N	admin@workflow.io	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid credentials	2025-10-13 20:34:57.355398
d5420c15-d58c-4c26-9966-8f922b480f5a	\N	admin@workflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid credentials	2025-10-13 20:35:05.008019
9ec39a93-df7d-48dc-a114-03cab40d6835	\N	admin@workflow.com	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid credentials	2025-10-13 20:35:06.834835
aa54c07d-ced8-4631-bd6a-1c5f49decabf	\N	superadmin@workflow.io	f	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	Invalid credentials	2025-10-13 20:35:29.371674
9bce7235-5e74-4458-b3c4-39b31a796b3b	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-13 20:36:19.224258
62780541-4a47-4858-9e7c-ce1c031686fb	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:37:50.30497
f7225d12-f3fc-44ca-8f33-1bfe304eafa3	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:39:41.403379
bead2d04-0781-4535-bab3-cc5c8491e506	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:41:08.431871
6c127364-7e6a-44b1-bffd-ec3657f36514	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-13 20:45:29.019972
c6fc5d32-c57d-4794-93a3-6a82bf1b878b	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:48:04.001267
d0c6a57e-c8fb-4bde-90f2-1bc97c124f32	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:48:43.027472
ee19bcb2-4ac7-4b95-be9e-b8f2764f64e9	5ed5a426-e551-4173-b80d-0d1408162958	mahakal1@mahakal.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:49:25.447408
b89b14b9-60e3-4f65-8cd1-20e44df7f70a	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:51:51.004353
3f322b94-6273-4b88-8ea7-1ebff347411c	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:55:55.262018
d69327ec-2cb6-465e-9ee1-522bb5619a28	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	2025-10-13 20:56:44.848655
698a1d3e-985f-44d0-9f24-a074cc69fbb6	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	172.31.86.34	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	2025-10-14 03:10:57.275047
4a171e2c-1d87-4345-804b-51e3f504cb8f	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-14 03:13:11.874974
f890f760-a9dd-4875-a655-a671a1f91df4	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-14 03:13:17.885114
e5316cdd-9d81-4121-a1d7-91119f5f99a2	b59bae00-5d6d-4878-a78e-99def7b12495	admin@authflow.com	t	127.0.0.1	curl/8.14.1	\N	\N	2025-10-14 03:16:48.407955
\.


--
-- Data for Name: magic_link_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.magic_link_tokens (id, user_id, email, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: mfa_otp_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mfa_otp_tokens (id, user_id, code, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: mfa_secrets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.mfa_secrets (id, user_id, secret, backup_codes, created_at) FROM stdin;
\.


--
-- Data for Name: notification_reads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notification_reads (id, notification_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, tenant_id, user_id, type, title, message, link, icon_url, priority, metadata, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: oauth2_access_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth2_access_tokens (id, token_hash, client_id, user_id, scopes, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: oauth2_authorization_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth2_authorization_codes (id, code_hash, client_id, user_id, redirect_uri, scopes, code_challenge, code_challenge_method, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: oauth2_clients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth2_clients (id, tenant_id, name, client_id, client_secret_hash, redirect_uris, grant_types, response_types, scopes, is_active, logo_uri, policy_uri, tos_uri, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: oauth2_refresh_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth2_refresh_tokens (id, token_hash, access_token_id, client_id, user_id, scopes, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.oauth_accounts (id, user_id, provider, provider_account_id, access_token, refresh_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
7a6e5e28-ae8d-4776-90b6-0c032c2c37f9	b59bae00-5d6d-4878-a78e-99def7b12495	661722	2025-10-13 19:28:04.467	2025-10-13 19:13:04.47998
\.


--
-- Data for Name: plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.plans (id, name, type, max_users, price, features, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: rate_limits; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.rate_limits (id, identifier, action, attempts, window_start, blocked_until) FROM stdin;
\.


--
-- Data for Name: saml_configurations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.saml_configurations (id, tenant_id, entity_id, sso_url, certificate, sign_requests, encrypt_assertions, name_id_format, is_active, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: security_events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.security_events (id, user_id, type, risk_score, details, ip_address, location, resolved, created_at, resolved_at, resolved_by) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (id, user_id, token, refresh_token, ip_address, user_agent, device_type, device_name, location, is_active, expires_at, created_at, last_activity_at) FROM stdin;
17c6f898-f5ca-4659-a9b5-d9c0d9ea247d	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MDY2NiwiZXhwIjoxNzYwOTg1NDY2fQ.DJXa5xRAlTvAgUT1G6vsH0Zex3GT6q-LBlrU6EYM0BE	428e917d267961f349067c70fbf9b8b281328f9eaeb763c65e9dad64d6e57f2d	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:37:46.366	2025-10-13 18:37:46.382889	2025-10-13 18:37:46.382889
c8d7e732-83fc-4fb9-9240-2b07d9adfeea	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MTI5MCwiZXhwIjoxNzYwOTg2MDkwfQ.FYlczdNQ8MvOjYkul-8dTFFwymGGxRtcfCZX1ELK3PI	1055954011d20fbf2c015a4e4e75198689bc9e77358d6a2a4d442b9c158da2ac	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:48:10.29	2025-10-13 18:48:10.304377	2025-10-13 18:48:10.304377
9fd550d8-469f-4d28-b4e8-f907ef1c484a	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MTMxMCwiZXhwIjoxNzYwOTg2MTEwfQ.r5tgSGjPF_E4YwiRtHaPFGEvmUPIF8wbq-Fci1PaVaE	bd80ebddd0152a20faa0ee96b57f2a59dff284eddcba0344ce36cf05cb9b887c	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:48:30.664	2025-10-13 18:48:30.676652	2025-10-13 18:48:30.676652
6bc18361-2b9b-4e28-b2d6-129af9d05357	ff7ca063-2e68-4bf7-85c5-a75e00f2cd0a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZjdjYTA2My0yZTY4LTRiZjctODVjNS1hNzVlMDBmMmNkMGEiLCJlbWFpbCI6ImFub2ZmaWNpYWw0MUBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MDM4MTM1MSwiZXhwIjoxNzYwOTg2MTUxfQ.RE2lsgxTBPMarieWwIvBYGuJr5GwMiTJWyEztfIlYqU	eb79c75b4172f3d6493a5db8df21c44bc57eca9e0661f6e956d5eefa7fda1a83	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:49:11.874	2025-10-13 18:49:11.888064	2025-10-13 18:49:11.888064
4729bc22-29c1-4ffa-b310-c128990bf25a	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MTQ3OCwiZXhwIjoxNzYwOTg2Mjc4fQ.wayIICIktljtPZD-9RB2xpf1RDPw0ltqzHEZvJl0HkQ	fffc68b573e4a6ffe5b53f42395b3b2e2589f9f683a17b8534ca301d497f6fd4	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:51:18.819	2025-10-13 18:51:18.832001	2025-10-13 18:51:18.832001
0d912690-a741-434b-a72a-5a604701081e	fca17ad2-938c-46ab-a68e-07db02bef698	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmY2ExN2FkMi05MzhjLTQ2YWItYTY4ZS0wN2RiMDJiZWY2OTgiLCJlbWFpbCI6Im1haGFrYWxAbWFoYWthbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MDM4MTUwMiwiZXhwIjoxNzYwOTg2MzAyfQ.lELsXscNdsyj-f6w2MwKjTmhWWHucscB8gzTcGmuV44	9d88fd9a201077a50f8f8045f3073a05ae764c5f3f193e6f4a927fc202baa801	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:51:42.307	2025-10-13 18:51:42.32016	2025-10-13 18:51:42.32016
28753d04-5f1d-472e-81b9-f609689d17f2	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MTYxNywiZXhwIjoxNzYwOTg2NDE3fQ.otWPCYPdcOjxPM6u6fREfkIw45eHh0hr_g9nW9DKZos	5ab966e04f315c9a37bb9c8e75a1873aebad3c16139ca1c825d37c256320eb95	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:53:37.532	2025-10-13 18:53:37.548423	2025-10-13 18:53:37.548423
91dba4ec-05ff-4d00-8d64-3a216aed5156	fca17ad2-938c-46ab-a68e-07db02bef698	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmY2ExN2FkMi05MzhjLTQ2YWItYTY4ZS0wN2RiMDJiZWY2OTgiLCJlbWFpbCI6Im1haGFrYWxAbWFoYWthbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MDM4MTgyMCwiZXhwIjoxNzYwOTg2NjIwfQ.0w6iaBD3zhD02Zi2uQ-Wm5GVcLDgDzNcyoyqym8OmsE	8c41c3dc7caefbaffccb6f3ea44c5202a60e6630ae2ee7e1ec0e8bf06e6fdaa8	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:57:00.687	2025-10-13 18:57:00.699571	2025-10-13 18:57:00.699571
3faa0eb9-b5c5-4fc7-b1e0-810303f1b066	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MTg3MSwiZXhwIjoxNzYwOTg2NjcxfQ.qm1xVWFF_jBLlOMlyjWw3nxi1BZICA3BCufy2H1pMjA	3afdbd5d6b2dbf8baadead3eb9a87c352295ab5fc52f9d5a6f033a612c4b9aa5	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 18:57:51.626	2025-10-13 18:57:51.6374	2025-10-13 18:57:51.6374
367d552d-04f2-4a87-8833-9d9fc11675d6	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MjM3MywiZXhwIjoxNzYwOTg3MTczfQ.wzLdVWVyvQvKeCXe72kZUHmk_sjNDBFUFHotBTmHnOk	6aa4a1e5026d5581fea2c3a95801691018280b84e708c3cd17746bde4ef28cea	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:06:13.603	2025-10-13 19:06:13.61519	2025-10-13 19:06:13.61519
2acfb260-6e6d-4993-aecb-a378f65b04ea	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MjUxOSwiZXhwIjoxNzYwOTg3MzE5fQ.2czcxNS_h6abpRdoXkzwv6PNVQ6yYoXkWojZoBhLVZM	73b1f6a75ccfc28b608b9dbc7d9a5e3031ecb59f190c2fc8e401237fd8d286ae	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:08:39.421	2025-10-13 19:08:39.434457	2025-10-13 19:08:39.434457
73066597-138c-4c25-af2e-1d95e660789f	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MjU0NywiZXhwIjoxNzYwOTg3MzQ3fQ.C2ZSqXvFJIAnNbjrGCEpSKmm1F1v0lbF-ANNzsy3Os0	8f89929712d282aaf3680f915b09dfaa2e7a1de2671f5800b599ee00817776ca	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:09:07.001	2025-10-13 19:09:07.013947	2025-10-13 19:09:07.013947
19b7f5c7-4b9b-4eb5-a24f-70a770ee1a33	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MjY0OCwiZXhwIjoxNzYwOTg3NDQ4fQ.eodO9Mn3g_IKHWgl4VHPqb8k6Cuss6D9IrH7f1ewGdY	be07045a5dc3f9a5485eb5f3589f35450cfa4827602b49402089cb2d7d983078	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:10:48.919	2025-10-13 19:10:48.933455	2025-10-13 19:10:48.933455
c8f8d064-eaff-4377-a72f-5469e5495634	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4Mjc2MiwiZXhwIjoxNzYwOTg3NTYyfQ.fom3xWftXi6PD9rrOt_HappAQazk8smSnOl8ZWUQoH4	7c60e5a5a6f8f94aac4bf2609622be4fe424a9226fa9cf7c5e89174d1a9a9295	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 19:12:42.493	2025-10-13 19:12:42.505697	2025-10-13 19:12:42.505697
66ed2e54-d513-467f-ae63-c6daa90ac37c	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4MjgyOSwiZXhwIjoxNzYwOTg3NjI5fQ.-k8TAxqTxGiV6lws1TvOKWls6Lh4ruwmbTHxwk2QsO4	81cbca0688a0310b4ca317945f27c26ee2a9d0bad0fe67ba772ffccbad7251e6	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:13:49.185	2025-10-13 19:13:49.197598	2025-10-13 19:13:49.197598
37f0bd43-af25-4b3b-bc15-caa2639c7d42	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODMwMDgsImV4cCI6MTc2MDk4NzgwOH0.uq-1QH4Vfm7U8-QCz93sJ46TUmTUl-g3arWJix06ERQ	31330862039c266010febd578c9b83598af553c0e96a87719fcab844ef04ba15	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:16:48.686	2025-10-13 19:16:48.698705	2025-10-13 19:16:48.698705
e04c4da9-68b7-4ab5-92e7-761db84aba96	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODMwNTUsImV4cCI6MTc2MDk4Nzg1NX0.FbovixJsLZlagm10wtc_sKZeFsE70rZylOIyoPB4wVU	b18360ec1cdf53a397642b42ac6b5962e3b5d74f967b2b8b4fa5763c2394e758	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:17:35.691	2025-10-13 19:17:35.70351	2025-10-13 19:17:35.70351
a9950079-b184-46b4-b677-99f87dc4dc1d	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODM0NzEsImV4cCI6MTc2MDk4ODI3MX0.aGxQj-hA_W-Nl-TK5VGptPxX-DoU7Tcbdo6gkSxa-Nk	5838a82b0186fd03b83f5c0660fdbbd29f0fafceb624b4f2a01789ad8a55579b	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:24:31.19	2025-10-13 19:24:31.203628	2025-10-13 19:24:31.203628
3450f66b-3879-465b-b07a-6bfcbdc04e29	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODM3NTUsImV4cCI6MTc2MDk4ODU1NX0.ETw-dHm2zKDWRSQgcld5gasE8Kf5CzaB28c7jiVC0gE	04419ed6061dd2edd48656ac3a59ad585af6dfe8babe891161d8966b085aad45	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:29:15.633	2025-10-13 19:29:15.646143	2025-10-13 19:29:15.646143
83ecd67c-e79e-474b-88a7-22d2aa0b1df9	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODM4MjYsImV4cCI6MTc2MDk4ODYyNn0.gE7ciV3KxqPvOd_9-44aEZf8BHU9lHwzInpf43JSVAw	5fd565c0f1dc2932f75cf79a9e897f40fa881495beb19cd3aba60c474cd1539b	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:30:26.873	2025-10-13 19:30:26.88569	2025-10-13 19:30:26.88569
a3cf3f53-829d-45e7-bf3f-309a506aff83	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQwODQsImV4cCI6MTc2MDk4ODg4NH0.oiQtzOLUERSigxynXEbVkJ0VQ5QO0QD8dxn4oQCPnKk	ff5462ed8bc48761f3a18142e71be3300e8f1115235fa8bd3ddcf64230e9885b	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:34:44.92	2025-10-13 19:34:44.932006	2025-10-13 19:34:44.932006
b55d6720-ffff-4b8d-8260-ca50ee50bb20	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQxNTEsImV4cCI6MTc2MDk4ODk1MX0.aJpsOIbe14qRZRuPKjyMD9dkSBEldSWvILdUDZhaDiI	ef2f89f6851bdfa2b0d4a0bb0a34c82e27d889726eefc20ed987df30e007b2c3	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:35:51.17	2025-10-13 19:35:51.184572	2025-10-13 19:35:51.184572
a60f759a-3e99-4b52-8510-dc646ea8ccb5	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQzNjcsImV4cCI6MTc2MDk4OTE2N30.u3oSwdWH4Ve2ccmSqLb5PQiLh16dJ38xcd4pPARshEA	11b8342daf2ffb36f685b3de13634e8760ef3a62f4104552b5ec8b2088a920fd	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:39:27.443	2025-10-13 19:39:27.454994	2025-10-13 19:39:27.454994
c16a5427-45bc-44ed-8ebd-4011c4333df0	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQ4ODMsImV4cCI6MTc2MDk4OTY4M30.6A-reodMpPZN43v_edfHbmV7wfEvMhEicdT1X11wKz4	85892696cefd2320a8361edcf6693c5ace2c7d82afac50d126159033c6a5345c	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-12 19:48:03.416	2025-10-13 19:48:03.430463	2025-10-13 19:48:03.430463
dfc7738b-b85d-4a27-bc52-6783406da0a8	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQ5MDksImV4cCI6MTc2MDk4OTcwOX0.zFM_a40lLCekOPoGNrf_k6dLBYL0j82fMp22wWfka5w	67274afdc026940b47f9dc076a758fcfb9a4a68735a67cbf89e3a0583e472b12	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-12 19:48:29.895	2025-10-13 19:48:29.907905	2025-10-13 19:48:29.907905
23e39287-ca0b-42f4-a30f-41fce436674d	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODQ5MjMsImV4cCI6MTc2MDk4OTcyM30.9T2KGQEUvY1BRPsWjj_pKWChkpOY_Cw3HcqH1bHlSdA	95060ca7544ce92cb214061e87d450dc12e4fdf15eb0a7a6d8427c925338a07e	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-12 19:48:43.6	2025-10-13 19:48:43.614637	2025-10-13 19:48:43.614637
06f9a882-88de-4e20-a4eb-a8815f82bcaa	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODUzOTEsImV4cCI6MTc2MDk5MDE5MX0.cCPo29tJg7S3oT1vLm4yEQs2mTNxJGFsRZxvZGGDmjk	3f076e1770f459f77e7d5bdd5c5a7e35795e57606419bd19b4af3e122f8c9135	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 19:56:31.033	2025-10-13 19:56:31.060054	2025-10-13 19:56:31.060054
26b316d4-61f9-4de4-8874-f038e32ad282	0f7cd6ff-5734-43ca-b228-cf5606091cc2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZjdjZDZmZi01NzM0LTQzY2EtYjIyOC1jZjU2MDYwOTFjYzIiLCJlbWFpbCI6InN1cGVyYWRtaW5AYXV0aGZsb3cuaW8iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAzODU3NjgsImV4cCI6MTc2MDk5MDU2OH0.VDpG4Y4j-eCWcHUUZc0HUk0WOoa89D2ZB59sduH5htM	dce86f5bad8d2d8816d1c6b2defabbb6c1a9e6335c49e8888fd0d9b128cbffdb	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:02:48.608	2025-10-13 20:02:48.622024	2025-10-13 20:02:48.622024
1f0dab51-4457-4d97-8b5e-cbabefe67060	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4NzAyNywiZXhwIjoxNzYwOTkxODI3fQ.HPEQb6RVYoBWgdxr203ZppfQ98I48F-sH5weEiJpqec	bb2e6aa38a29bacea8c0c6a2e19d711b00a94ae923b7c3bd6676cf80fdf2e27b	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:23:47.252	2025-10-13 20:23:47.265963	2025-10-13 20:23:47.265963
f3e3b04e-56f1-4d58-bda1-f5f3e7ff63fc	6cdd33be-b5e9-4184-8a55-6992caada79e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Y2RkMzNiZS1iNWU5LTQxODQtOGE1NS02OTkyY2FhZGE3OWUiLCJlbWFpbCI6ImpvaG5kbkBnbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MDM4NzMzNSwiZXhwIjoxNzYwOTkyMTM1fQ.MS4USuggi1LDLbh-h1wOg08OjspiuwEHrRbYh4WsZIM	fbabb841c6a335c658ca75bb34114298ce0db00ebd8b44917a0b312c49da6633	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:28:55.179	2025-10-13 20:28:55.193189	2025-10-13 20:28:55.193189
679ffe5b-fa0b-4a78-a923-cc43b52274f1	fca17ad2-938c-46ab-a68e-07db02bef698	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmY2ExN2FkMi05MzhjLTQ2YWItYTY4ZS0wN2RiMDJiZWY2OTgiLCJlbWFpbCI6Im1haGFrYWxAbWFoYWthbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MDM4NzY3NywiZXhwIjoxNzYwOTkyNDc3fQ.n8rSNB_UpNYB6VvR6yAUXcplKSw_jMsd1QS6ixGXCnU	468e47ae451496ccd6c242dd02174f4ac82a0fa4ca8e73ae959bd6486ea5e917	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:34:37.428	2025-10-13 20:34:37.441166	2025-10-13 20:34:37.441166
1451e1a1-b4e5-473d-9326-8d0199084223	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4Nzc3OSwiZXhwIjoxNzYwOTkyNTc5fQ.A056GTuj-fisuCTgC1f1PjZDX4DRvGnuH-G5eWfOPvY	165b837a58d04261a272297e94d19b98f959cae67f5d6bd50759afb466f5cc95	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-12 20:36:19.165	2025-10-13 20:36:19.17864	2025-10-13 20:36:19.17864
710b5041-82cf-4db6-a0f6-a847cdc074ce	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4Nzg3MCwiZXhwIjoxNzYwOTkyNjcwfQ.-HHnU0rIV0bDqbAxQinpvLJP4wDPXnyubd4FskfnXAo	2dec6606f934bf4d9540489872cd6be0138e5985f1df57150f58673cc8ee1c88	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:37:50.243	2025-10-13 20:37:50.255032	2025-10-13 20:37:50.255032
94f294e8-dd57-44d7-b82c-fb11e621cdb3	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4Nzk4MSwiZXhwIjoxNzYwOTkyNzgxfQ.v8pLXswvj8Gbutg1B-ib0KtdWwWbFER2GV3VEho-9e0	6444514e5315b75f080ed961a9fe60a98fd0e34adb228b167e58188939f2eae0	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:39:41.345	2025-10-13 20:39:41.356785	2025-10-13 20:39:41.356785
01e08432-762d-46e8-b99a-0591daae3f8f	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODA2OCwiZXhwIjoxNzYwOTkyODY4fQ.smMgxsUh3MLUe2zGhVXL__qfGhTtwPz-1WikvAWrmBQ	689942147af53b443e83bee56e9ac476a68e0068c9a4b02d9c6759d443cc5f53	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:41:08.367	2025-10-13 20:41:08.381779	2025-10-13 20:41:08.381779
5e51ad72-075c-418a-9d47-2f8d8f45b85f	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODMyOCwiZXhwIjoxNzYwOTkzMTI4fQ.mR_yoPt3jA0RBAynrIzTVU3dT9vRxvzhZRhO7r7IV90	2b911d6bc65dc119b08276bced8aeb7521a43b7035452c39e5efa362a9373b78	172.31.77.2	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-12 20:45:28.949	2025-10-13 20:45:28.964596	2025-10-13 20:45:28.964596
a6e39f72-3e35-40a0-bf08-822ea85d2eb5	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODQ4MywiZXhwIjoxNzYwOTkzMjgzfQ.G4GkBicOuldZ4ZepKyry0KJugoKdTZnnDGZJOzxR63E	1030547ccf88e87693f5fbd480dcebf6715d98ef32ec77e4bc68bfb25406916f	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:48:03.942	2025-10-13 20:48:03.954427	2025-10-13 20:48:03.954427
c5df6a81-05a4-490c-94ec-c943c67f94b0	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODUyMiwiZXhwIjoxNzYwOTkzMzIyfQ.iNwsYAfF5T1lafqVy6loAJtjdMJYd-lae95qukd5aRY	ae4199e0daef46d47a17d80115362cc11f479b41155e1c2a9338a68eb4440776	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:48:42.968	2025-10-13 20:48:42.979923	2025-10-13 20:48:42.979923
283107c2-ad12-4073-ab95-7ac853d99da5	5ed5a426-e551-4173-b80d-0d1408162958	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZWQ1YTQyNi1lNTUxLTQxNzMtYjgwZC0wZDE0MDgxNjI5NTgiLCJlbWFpbCI6Im1haGFrYWwxQG1haGFrYWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjAzODg1NjUsImV4cCI6MTc2MDk5MzM2NX0.UT7g3F7cToBK-KF61yMZNy_qcVApnnVbZTswUb5pOto	a412378e2ae6863253c3aacd36d01c0dd05ece7cde569561b6a0e0e9daf2c937	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:49:25.384	2025-10-13 20:49:25.397055	2025-10-13 20:49:25.397055
ed059eb3-2222-4fef-9ae3-390b2422b4d5	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODcxMCwiZXhwIjoxNzYwOTkzNTEwfQ.RMfg6jjqgJ_ZhS4-4kyQSIvjlsfz8_iWofzrt4InNUc	ac3305c5d007959e0a3f9f1f7637f804ee9396a4a9d1b71ef4f5dceaa52f8b49	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:51:50.944	2025-10-13 20:51:50.957125	2025-10-13 20:51:50.957125
a9fce825-65ad-4908-8eab-c857387c4899	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4ODk1NSwiZXhwIjoxNzYwOTkzNzU1fQ.rWZr-296ldnspjy4fHikqkr6qbqzGtpVb3NjVtBCZV8	3637db512b7d1ddb65fa0de5e0f5d6e7d16c36c3cb55949ddaa3b0575ccd788f	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:55:55.199	2025-10-13 20:55:55.211759	2025-10-13 20:55:55.211759
68b0ab87-473f-4ae6-a990-5181832d3dc2	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDM4OTAwNCwiZXhwIjoxNzYwOTkzODA0fQ.yeG_25es3qj8Y0iRsBp_xX0CHC63ROJDqKX2v7-uToI	321d115f125a4c4d3a1e2ede6288ab8cac9b6a955134cea9035a3392270a4a57	172.31.77.2	Mozilla/5.0 (iPad; CPU OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.7390.69 Mobile/15E148 Safari/604.1	\N	\N	\N	t	2025-11-12 20:56:44.789	2025-10-13 20:56:44.801841	2025-10-13 20:56:44.801841
98d5b713-c4a8-43da-8dfb-d6cd3f1943f6	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDQxMTQ1NywiZXhwIjoxNzYxMDE2MjU3fQ.OkkfiXwbJeDKpyJlRXouA7OK83mFRSbxzcZno84TAlc	14d4e73640e2edc03654ce2f7433bc6dd2184aa7f29e6ea16c3c1196b51efbc2	172.31.86.34	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15	\N	\N	\N	t	2025-11-13 03:10:57.191	2025-10-14 03:10:57.203567	2025-10-14 03:10:57.203567
2acd2281-4584-4def-ae75-db9ac47096c4	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDQxMTU5MSwiZXhwIjoxNzYxMDE2MzkxfQ.EjaLtBgHHsLM9jLra_0exWgOfx10cmJiybZXIFBNeQQ	7efd7ed1f6e3ff01c2368e236cd4a00e9cf4e866d369e32c543341a4c8cd4fb7	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-13 03:13:11.811	2025-10-14 03:13:11.826339	2025-10-14 03:13:11.826339
f7d08b37-95b9-44cb-97a6-b331164f53c8	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDQxMTU5NywiZXhwIjoxNzYxMDE2Mzk3fQ.Rhb7LiBdM46uqBxCD3xpnb4vCFZz7BaULlfHIm2AvzE	e65819e5e9e832fcdd431580d0e8f94b0b7df67705dded22fd2946d93f1b6a1f	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-13 03:13:17.822	2025-10-14 03:13:17.835877	2025-10-14 03:13:17.835877
7d321906-a410-4a88-8d51-224e390859ab	b59bae00-5d6d-4878-a78e-99def7b12495	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNTliYWUwMC01ZDZkLTQ4NzgtYTc4ZS05OWRlZjdiMTI0OTUiLCJlbWFpbCI6ImFkbWluQGF1dGhmbG93LmNvbSIsInJvbGUiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc2MDQxMTgwOCwiZXhwIjoxNzYxMDE2NjA4fQ.0NLjdapiu7efeqF5uv6XhdxO_136Tzcezp5umWPltuM	8ecd36358657249d9eea2440710e1da16c6042e359069d97d27c407caad40f4d	127.0.0.1	curl/8.14.1	\N	\N	\N	t	2025-11-13 03:16:48.342	2025-10-14 03:16:48.355966	2025-10-14 03:16:48.355966
\.


--
-- Data for Name: tenant_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenant_plans (id, tenant_id, plan_id, custom_price, custom_max_users, stripe_subscription_id, is_active, start_date, end_date, created_at) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tenants (id, name, slug, logo_url, primary_color, is_active, created_at, updated_at, allow_password_auth, allow_social_auth, allow_magic_link, require_email_verification, require_mfa, session_timeout, custom_domain, allowed_domains, features) FROM stdin;
f3519d48-ff82-42b4-b4f7-50ad2f42bacb	Acme Corporation	acme-corp	\N	#2563eb	t	2025-10-13 19:24:15.231821	2025-10-13 19:24:15.231821	t	t	t	f	f	86400	\N	[]	{}
a7c0b79b-8015-43a9-9fd6-22aaa825c5b4	TechStart Inc	techstart	\N	#2563eb	t	2025-10-13 19:24:15.231821	2025-10-13 19:24:15.231821	t	f	t	t	f	86400	\N	[]	{}
96c512a9-19e5-4a2c-aa48-ef589ad2bfb0	Global Solutions Ltd	global-solutions	\N	#2563eb	t	2025-10-13 19:24:15.231821	2025-10-13 19:24:15.231821	t	t	t	t	f	86400	\N	[]	{}
\.


--
-- Data for Name: trusted_devices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.trusted_devices (id, user_id, fingerprint, device_name, is_trusted, last_seen_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, tenant_id, email, password_hash, first_name, last_name, avatar_url, role, is_active, email_verified, mfa_enabled, mfa_method, last_login_at, last_login_ip, metadata, created_at, updated_at) FROM stdin;
0f7cd6ff-5734-43ca-b228-cf5606091cc2	\N	superadmin@authflow.io	$2b$10$e9PSBHVosYmOSHNaSPWa8Of1nR3Yge5fB4RwzguUL0R3Uj5dPSXQS	Super	Administrator	\N	super_admin	t	t	f	\N	2025-10-13 20:02:48.634	172.31.77.2	{}	2025-10-13 19:15:11.479183	2025-10-13 20:02:48.635
5b942c54-66f8-4087-b406-d3b987b495b4	\N	unew5577@gmail.com	$2b$10$SZiRvJN.HVn7x4dfGtU1.OkdJVo0Rv.rH8G4uMy3.DlIsWImgkaum	Mahakal	Mahakal	\N	user	t	f	f	\N	\N	\N	{}	2025-10-13 18:38:59.492465	2025-10-13 18:38:59.492465
ff7ca063-2e68-4bf7-85c5-a75e00f2cd0a	\N	anofficial41@gmail.com	$2b$10$LmDs2W2gq.oEe2I4YXBxQOJ/.D1uuRsxqFbtwDa56kY3H/HEEL1QW	Mahakal	Mahakal	\N	user	t	f	f	\N	2025-10-13 18:49:11.905	172.31.77.2	{}	2025-10-13 18:45:17.210215	2025-10-13 18:49:11.905
6cdd33be-b5e9-4184-8a55-6992caada79e	\N	johndn@gmail.com	$2b$10$90i.qqQBimPSpEtWgRQjUuN2G63lhoam98B3nnfVm.s8CTs9J8j5q	John	Din	\N	user	t	f	f	\N	2025-10-13 20:28:55.208	172.31.77.2	{}	2025-10-13 20:28:38.159276	2025-10-13 20:28:55.208
fca17ad2-938c-46ab-a68e-07db02bef698	\N	mahakal@mahakal.com	$2b$10$T7E.P47g6bFO31tgSkvPa.K0aTl6PLYGxDjyUqk3W9t6n3oC1Cw/i	Mahakal	Mahakal	\N	user	t	f	f	\N	2025-10-13 20:34:37.456	172.31.77.2	{}	2025-10-13 18:38:35.899817	2025-10-13 20:34:37.456
5ed5a426-e551-4173-b80d-0d1408162958	\N	mahakal1@mahakal.com	$2b$10$8pCdcq4I9ZzAr6X/SmVTDeF0JLFY1w13inbJ.u1HBRnFbDt7O/1oe	Mahakal	Mahakal	\N	user	t	f	f	\N	2025-10-13 20:49:25.409	172.31.77.2	{}	2025-10-13 20:49:06.830413	2025-10-13 20:49:25.41
b59bae00-5d6d-4878-a78e-99def7b12495	\N	admin@authflow.com	$2b$10$1gTbtYtk9WKP8/asby4X2.EzIdFCNqDKuTCF8/CbuncwOi52joSx.	Super	Admin	\N	super_admin	t	t	f	\N	2025-10-14 03:16:48.37	127.0.0.1	{}	2025-10-13 15:57:35.114041	2025-10-14 03:16:48.37
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.webauthn_credentials (id, user_id, credential_id, public_key, counter, device_name, created_at) FROM stdin;
\.


--
-- Data for Name: webhook_deliveries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.webhook_deliveries (id, webhook_id, tenant_id, event, payload, response_status, response_body, status, attempts, max_attempts, next_retry_at, delivered_at, created_at) FROM stdin;
\.


--
-- Data for Name: webhooks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.webhooks (id, tenant_id, url, events, secret, is_active, description, created_at, updated_at) FROM stdin;
\.


--
-- Name: api_keys api_keys_key_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: branding_customizations branding_customizations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branding_customizations
    ADD CONSTRAINT branding_customizations_pkey PRIMARY KEY (id);


--
-- Name: branding_customizations branding_customizations_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branding_customizations
    ADD CONSTRAINT branding_customizations_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_unique UNIQUE (token);


--
-- Name: gdpr_requests gdpr_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gdpr_requests
    ADD CONSTRAINT gdpr_requests_pkey PRIMARY KEY (id);


--
-- Name: ip_restrictions ip_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_restrictions
    ADD CONSTRAINT ip_restrictions_pkey PRIMARY KEY (id);


--
-- Name: login_history login_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_pkey PRIMARY KEY (id);


--
-- Name: magic_link_tokens magic_link_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT magic_link_tokens_pkey PRIMARY KEY (id);


--
-- Name: magic_link_tokens magic_link_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT magic_link_tokens_token_unique UNIQUE (token);


--
-- Name: mfa_otp_tokens mfa_otp_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_otp_tokens
    ADD CONSTRAINT mfa_otp_tokens_pkey PRIMARY KEY (id);


--
-- Name: mfa_secrets mfa_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_secrets
    ADD CONSTRAINT mfa_secrets_pkey PRIMARY KEY (id);


--
-- Name: mfa_secrets mfa_secrets_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_secrets
    ADD CONSTRAINT mfa_secrets_user_id_unique UNIQUE (user_id);


--
-- Name: notification_reads notification_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: oauth2_access_tokens oauth2_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_access_tokens
    ADD CONSTRAINT oauth2_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: oauth2_access_tokens oauth2_access_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_access_tokens
    ADD CONSTRAINT oauth2_access_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: oauth2_authorization_codes oauth2_authorization_codes_code_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_authorization_codes
    ADD CONSTRAINT oauth2_authorization_codes_code_hash_unique UNIQUE (code_hash);


--
-- Name: oauth2_authorization_codes oauth2_authorization_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_authorization_codes
    ADD CONSTRAINT oauth2_authorization_codes_pkey PRIMARY KEY (id);


--
-- Name: oauth2_clients oauth2_clients_client_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_clients
    ADD CONSTRAINT oauth2_clients_client_id_unique UNIQUE (client_id);


--
-- Name: oauth2_clients oauth2_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_clients
    ADD CONSTRAINT oauth2_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth2_refresh_tokens oauth2_refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_refresh_tokens
    ADD CONSTRAINT oauth2_refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: oauth2_refresh_tokens oauth2_refresh_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_refresh_tokens
    ADD CONSTRAINT oauth2_refresh_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: oauth_accounts oauth_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: rate_limits rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.rate_limits
    ADD CONSTRAINT rate_limits_pkey PRIMARY KEY (id);


--
-- Name: saml_configurations saml_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saml_configurations
    ADD CONSTRAINT saml_configurations_pkey PRIMARY KEY (id);


--
-- Name: security_events security_events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_unique UNIQUE (refresh_token);


--
-- Name: sessions sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);


--
-- Name: tenant_plans tenant_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_plans
    ADD CONSTRAINT tenant_plans_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);


--
-- Name: trusted_devices trusted_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_credential_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_credential_id_unique UNIQUE (credential_id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: webhook_deliveries webhook_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id);


--
-- Name: webhooks webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_pkey PRIMARY KEY (id);


--
-- Name: api_keys_key_hash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX api_keys_key_hash_idx ON public.api_keys USING btree (key_hash);


--
-- Name: api_keys_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX api_keys_tenant_id_idx ON public.api_keys USING btree (tenant_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX audit_logs_tenant_id_idx ON public.audit_logs USING btree (tenant_id);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: branding_customizations_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX branding_customizations_tenant_id_idx ON public.branding_customizations USING btree (tenant_id);


--
-- Name: gdpr_requests_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX gdpr_requests_user_id_idx ON public.gdpr_requests USING btree (user_id);


--
-- Name: ip_restrictions_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX ip_restrictions_tenant_id_idx ON public.ip_restrictions USING btree (tenant_id);


--
-- Name: login_history_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX login_history_created_at_idx ON public.login_history USING btree (created_at);


--
-- Name: login_history_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX login_history_user_id_idx ON public.login_history USING btree (user_id);


--
-- Name: mfa_otp_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX mfa_otp_tokens_user_id_idx ON public.mfa_otp_tokens USING btree (user_id);


--
-- Name: notification_reads_notification_user_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX notification_reads_notification_user_idx ON public.notification_reads USING btree (notification_id, user_id);


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX notifications_tenant_id_idx ON public.notifications USING btree (tenant_id);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: oauth2_access_tokens_client_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_access_tokens_client_id_idx ON public.oauth2_access_tokens USING btree (client_id);


--
-- Name: oauth2_access_tokens_token_hash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_access_tokens_token_hash_idx ON public.oauth2_access_tokens USING btree (token_hash);


--
-- Name: oauth2_authorization_codes_client_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_authorization_codes_client_id_idx ON public.oauth2_authorization_codes USING btree (client_id);


--
-- Name: oauth2_authorization_codes_code_hash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_authorization_codes_code_hash_idx ON public.oauth2_authorization_codes USING btree (code_hash);


--
-- Name: oauth2_clients_client_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_clients_client_id_idx ON public.oauth2_clients USING btree (client_id);


--
-- Name: oauth2_clients_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_clients_tenant_id_idx ON public.oauth2_clients USING btree (tenant_id);


--
-- Name: oauth2_refresh_tokens_client_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_refresh_tokens_client_id_idx ON public.oauth2_refresh_tokens USING btree (client_id);


--
-- Name: oauth2_refresh_tokens_token_hash_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth2_refresh_tokens_token_hash_idx ON public.oauth2_refresh_tokens USING btree (token_hash);


--
-- Name: oauth_accounts_provider_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth_accounts_provider_idx ON public.oauth_accounts USING btree (provider, provider_account_id);


--
-- Name: oauth_accounts_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX oauth_accounts_user_id_idx ON public.oauth_accounts USING btree (user_id);


--
-- Name: rate_limits_identifier_action_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX rate_limits_identifier_action_idx ON public.rate_limits USING btree (identifier, action);


--
-- Name: saml_configurations_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX saml_configurations_tenant_id_idx ON public.saml_configurations USING btree (tenant_id);


--
-- Name: security_events_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX security_events_created_at_idx ON public.security_events USING btree (created_at);


--
-- Name: security_events_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX security_events_user_id_idx ON public.security_events USING btree (user_id);


--
-- Name: sessions_token_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sessions_token_idx ON public.sessions USING btree (token);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- Name: tenant_plans_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX tenant_plans_tenant_id_idx ON public.tenant_plans USING btree (tenant_id);


--
-- Name: trusted_devices_fingerprint_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX trusted_devices_fingerprint_idx ON public.trusted_devices USING btree (fingerprint);


--
-- Name: trusted_devices_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX trusted_devices_user_id_idx ON public.trusted_devices USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_tenant_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX users_email_tenant_idx ON public.users USING btree (email, tenant_id);


--
-- Name: users_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX users_tenant_id_idx ON public.users USING btree (tenant_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX webauthn_credentials_user_id_idx ON public.webauthn_credentials USING btree (user_id);


--
-- Name: webhook_deliveries_status_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX webhook_deliveries_status_idx ON public.webhook_deliveries USING btree (status);


--
-- Name: webhook_deliveries_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX webhook_deliveries_tenant_id_idx ON public.webhook_deliveries USING btree (tenant_id);


--
-- Name: webhook_deliveries_webhook_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX webhook_deliveries_webhook_id_idx ON public.webhook_deliveries USING btree (webhook_id);


--
-- Name: webhooks_tenant_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX webhooks_tenant_id_idx ON public.webhooks USING btree (tenant_id);


--
-- Name: api_keys api_keys_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: branding_customizations branding_customizations_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.branding_customizations
    ADD CONSTRAINT branding_customizations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gdpr_requests gdpr_requests_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gdpr_requests
    ADD CONSTRAINT gdpr_requests_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: gdpr_requests gdpr_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gdpr_requests
    ADD CONSTRAINT gdpr_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ip_restrictions ip_restrictions_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ip_restrictions
    ADD CONSTRAINT ip_restrictions_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: login_history login_history_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_history
    ADD CONSTRAINT login_history_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: magic_link_tokens magic_link_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.magic_link_tokens
    ADD CONSTRAINT magic_link_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mfa_otp_tokens mfa_otp_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_otp_tokens
    ADD CONSTRAINT mfa_otp_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mfa_secrets mfa_secrets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.mfa_secrets
    ADD CONSTRAINT mfa_secrets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_reads notification_reads_notification_id_notifications_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_notification_id_notifications_id_fk FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_reads notification_reads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notification_reads
    ADD CONSTRAINT notification_reads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth2_access_tokens oauth2_access_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_access_tokens
    ADD CONSTRAINT oauth2_access_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth2_authorization_codes oauth2_authorization_codes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_authorization_codes
    ADD CONSTRAINT oauth2_authorization_codes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth2_clients oauth2_clients_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_clients
    ADD CONSTRAINT oauth2_clients_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: oauth2_clients oauth2_clients_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_clients
    ADD CONSTRAINT oauth2_clients_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: oauth2_refresh_tokens oauth2_refresh_tokens_access_token_id_oauth2_access_tokens_id_f; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_refresh_tokens
    ADD CONSTRAINT oauth2_refresh_tokens_access_token_id_oauth2_access_tokens_id_f FOREIGN KEY (access_token_id) REFERENCES public.oauth2_access_tokens(id) ON DELETE CASCADE;


--
-- Name: oauth2_refresh_tokens oauth2_refresh_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth2_refresh_tokens
    ADD CONSTRAINT oauth2_refresh_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: oauth_accounts oauth_accounts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.oauth_accounts
    ADD CONSTRAINT oauth_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: saml_configurations saml_configurations_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.saml_configurations
    ADD CONSTRAINT saml_configurations_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: security_events security_events_resolved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: security_events security_events_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tenant_plans tenant_plans_plan_id_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_plans
    ADD CONSTRAINT tenant_plans_plan_id_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: tenant_plans tenant_plans_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tenant_plans
    ADD CONSTRAINT tenant_plans_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: trusted_devices trusted_devices_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trusted_devices
    ADD CONSTRAINT trusted_devices_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: webhook_deliveries webhook_deliveries_webhook_id_webhooks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhook_deliveries
    ADD CONSTRAINT webhook_deliveries_webhook_id_webhooks_id_fk FOREIGN KEY (webhook_id) REFERENCES public.webhooks(id) ON DELETE CASCADE;


--
-- Name: webhooks webhooks_tenant_id_tenants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.webhooks
    ADD CONSTRAINT webhooks_tenant_id_tenants_id_fk FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

