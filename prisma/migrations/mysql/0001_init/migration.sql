-- Initial MySQL schema for the Ater application.
-- Import this file in phpMyAdmin while the `ater` database is selected.
-- Tested with MariaDB 10.4.32. The application uses MySQL-compatible SQL and preserves existing tables.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NULL,
  role ENUM('user','admin','finance_operator','support_agent','super_admin') NOT NULL DEFAULT 'user',
  account_status ENUM('active','suspended','pending_verification','closed') NOT NULL DEFAULT 'active',
  referral_code VARCHAR(12) NOT NULL,
  referred_by VARCHAR(36) NULL,
  avatar TEXT NULL,
  language VARCHAR(10) DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY users_email_uq (email), UNIQUE KEY users_referral_code_uq (referral_code),
  KEY users_referred_by_idx (referred_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, token VARCHAR(512) NOT NULL,
  expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY sessions_token_uq (token), KEY sessions_user_idx (user_id),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, address TEXT NULL,
  city VARCHAR(100) NULL, country VARCHAR(100) NULL, postal_code VARCHAR(20) NULL,
  id_number VARCHAR(50) NULL, bank_name VARCHAR(100) NULL, bank_account VARCHAR(100) NULL,
  upi_id VARCHAR(100) NULL, pan_number VARCHAR(20) NULL, bio TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY user_profiles_user_uq (user_id),
  CONSTRAINT user_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_relationships (
  id VARCHAR(36) NOT NULL, referrer_id VARCHAR(36) NOT NULL, referred_id VARCHAR(36) NOT NULL,
  level INT NOT NULL DEFAULT 1, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY referral_referred_uq (referred_id), KEY referral_referrer_idx (referrer_id),
  CONSTRAINT referral_referrer_fk FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT referral_referred_fk FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_invested DECIMAL(18,2) NOT NULL DEFAULT 0.00, total_earnings DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_withdrawn DECIMAL(18,2) NOT NULL DEFAULT 0.00, currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY wallet_user_uq (user_id),
  CONSTRAINT wallet_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id VARCHAR(36) NOT NULL, reference_id VARCHAR(32) NOT NULL, user_id VARCHAR(36) NOT NULL,
  type ENUM('deposit','investment','earning','referral_reward','withdrawal','refund','adjustment','fee') NOT NULL,
  amount DECIMAL(18,2) NOT NULL, currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('pending','completed','failed','reversed') NOT NULL DEFAULT 'completed',
  description TEXT NULL, related_reference VARCHAR(32) NULL, metadata JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP NULL,
  PRIMARY KEY (id), UNIQUE KEY ledger_reference_uq (reference_id), KEY ledger_user_created_idx (user_id, created_at),
  CONSTRAINT ledger_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS investment_records (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, amount DECIMAL(18,2) NOT NULL,
  plan_name VARCHAR(100) NOT NULL, rate_percent DECIMAL(5,2) NOT NULL, duration_days INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', start_date TIMESTAMP NOT NULL, end_date TIMESTAMP NOT NULL,
  earnings_generated DECIMAL(18,2) NOT NULL DEFAULT 0.00, ledger_reference VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY investments_user_idx (user_id),
  CONSTRAINT investments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, amount DECIMAL(18,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR', method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  destination TEXT NULL, status ENUM('pending','under_review','approved','rejected','processing','completed') NOT NULL DEFAULT 'pending',
  review_note TEXT NULL, reviewed_by VARCHAR(36) NULL, ledger_reference VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL, PRIMARY KEY (id), KEY withdrawals_user_created_idx (user_id, created_at),
  CONSTRAINT withdrawals_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calculation_configs (
  id VARCHAR(36) NOT NULL, name VARCHAR(100) NOT NULL, rate_percent DECIMAL(5,2) NOT NULL,
  rate_period VARCHAR(20) NOT NULL DEFAULT 'daily', min_amount DECIMAL(18,2) DEFAULT 0.00,
  max_amount DECIMAL(18,2) NULL, effective_from TIMESTAMP NOT NULL, effective_to TIMESTAMP NULL,
  eligibility TEXT NULL, rounding_rule VARCHAR(20) DEFAULT 'standard', version INT NOT NULL DEFAULT 1,
  approved BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calculation_history (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, config_id VARCHAR(36) NULL,
  base_amount DECIMAL(18,2) NOT NULL, rate_percent DECIMAL(5,2) NOT NULL,
  calculated_amount DECIMAL(18,2) NOT NULL, is_simulation BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY calc_history_user_idx (user_id),
  CONSTRAINT calc_history_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT calc_history_config_fk FOREIGN KEY (config_id) REFERENCES calculation_configs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL,
  type ENUM('registration','referral','transaction','withdrawal','support','system') NOT NULL,
  title VARCHAR(255) NOT NULL, message TEXT NOT NULL, `read` BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY notifications_user_created_idx (user_id, created_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL, status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  priority ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium', assigned_to VARCHAR(36) NULL,
  response TEXT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), KEY tickets_user_created_idx (user_id, created_at),
  CONSTRAINT tickets_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) NOT NULL, actor_id VARCHAR(36) NULL, action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL, entity_id VARCHAR(36) NULL, details JSON NULL,
  ip_address VARCHAR(45) NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), KEY audit_actor_created_idx (actor_id, created_at),
  CONSTRAINT audit_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(36) NOT NULL, `key` VARCHAR(100) NOT NULL, value TEXT NOT NULL,
  description TEXT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id), UNIQUE KEY system_settings_key_uq (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_orders (
  id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, provider VARCHAR(32) NOT NULL DEFAULT 'razorpay',
  provider_order_id VARCHAR(64) NOT NULL, provider_payment_id VARCHAR(64) NULL, signature TEXT NULL,
  amount DECIMAL(18,2) NOT NULL, currency VARCHAR(10) NOT NULL DEFAULT 'INR', status VARCHAR(20) NOT NULL DEFAULT 'created',
  plan_name VARCHAR(100) NOT NULL, rate_percent DECIMAL(5,2) NOT NULL, duration_days INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL, PRIMARY KEY (id), UNIQUE KEY payment_provider_order_uq (provider_order_id),
  UNIQUE KEY payment_provider_payment_uq (provider_payment_id), KEY payment_orders_user_idx (user_id),
  CONSTRAINT payment_orders_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
