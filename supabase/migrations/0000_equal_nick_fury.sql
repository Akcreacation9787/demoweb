CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'pending_verification', 'closed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('registration', 'referral', 'transaction', 'withdrawal', 'support', 'system');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'finance_operator', 'support_agent', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('pending', 'completed', 'failed', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('deposit', 'investment', 'earning', 'referral_reward', 'withdrawal', 'refund', 'adjustment', 'fee');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'processing', 'completed');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"actor_id" varchar(36),
	"action" varchar(100) NOT NULL,
	"entity" varchar(100) NOT NULL,
	"entity_id" varchar(36),
	"details" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculation_configs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"rate_percent" numeric(5, 2) NOT NULL,
	"rate_period" varchar(20) DEFAULT 'daily' NOT NULL,
	"min_amount" numeric(18, 2) DEFAULT '0.00',
	"max_amount" numeric(18, 2),
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"eligibility" text,
	"rounding_rule" varchar(20) DEFAULT 'standard',
	"version" integer DEFAULT 1 NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculation_history" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"config_id" varchar(36),
	"base_amount" numeric(18, 2) NOT NULL,
	"rate_percent" numeric(5, 2) NOT NULL,
	"calculated_amount" numeric(18, 2) NOT NULL,
	"is_simulation" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"rate_percent" numeric(5, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"earnings_generated" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"ledger_reference" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"reference_id" varchar(32) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "tx_type" NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" "tx_status" DEFAULT 'completed' NOT NULL,
	"description" text,
	"related_reference" varchar(32),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "ledger_entries_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"provider" varchar(32) DEFAULT 'razorpay' NOT NULL,
	"provider_order_id" varchar(64) NOT NULL,
	"provider_payment_id" varchar(64),
	"signature" text,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"plan_name" varchar(100) NOT NULL,
	"rate_percent" numeric(5, 2) NOT NULL,
	"duration_days" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "payment_orders_provider_order_id_unique" UNIQUE("provider_order_id"),
	CONSTRAINT "payment_orders_provider_payment_id_unique" UNIQUE("provider_payment_id")
);
--> statement-breakpoint
CREATE TABLE "referral_relationships" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"referrer_id" varchar(36) NOT NULL,
	"referred_id" varchar(36) NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_relationships_referred_id_unique" UNIQUE("referred_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"token" varchar(512) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" varchar(36),
	"response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"address" text,
	"address_line_2" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"postal_code" varchar(20),
	"id_type" varchar(50),
	"id_number" varchar(255),
	"id_proof_path" varchar(512),
	"bank_name" varchar(100),
	"bank_account" varchar(100),
	"upi_id" varchar(100),
	"pan_number" varchar(20),
	"bio" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"role" "role" DEFAULT 'user' NOT NULL,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"referral_code" varchar(12) NOT NULL,
	"referred_by" varchar(36),
	"avatar" text,
	"language" varchar(10) DEFAULT 'en',
	"dark_mode" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "wallet_accounts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_invested" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_earnings" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_withdrawn" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"method" varchar(50) DEFAULT 'bank_transfer' NOT NULL,
	"destination" text,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by" varchar(36),
	"ledger_reference" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_history" ADD CONSTRAINT "calculation_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_history" ADD CONSTRAINT "calculation_history_config_id_calculation_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."calculation_configs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "investment_records" ADD CONSTRAINT "investment_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_relationships" ADD CONSTRAINT "referral_relationships_referred_id_users_id_fk" FOREIGN KEY ("referred_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_accounts" ADD CONSTRAINT "wallet_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_created_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "calc_history_user_idx" ON "calculation_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calc_history_config_idx" ON "calculation_history" USING btree ("config_id");--> statement-breakpoint
CREATE INDEX "investments_user_idx" ON "investment_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ledger_user_created_idx" ON "ledger_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_orders_user_idx" ON "payment_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referral_referrer_idx" ON "referral_relationships" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tickets_user_created_idx" ON "support_tickets" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "users_referred_by_idx" ON "users" USING btree ("referred_by");--> statement-breakpoint
CREATE INDEX "withdrawals_user_created_idx" ON "withdrawal_requests" USING btree ("user_id","created_at");