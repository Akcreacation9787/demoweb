import { pgTable, text, varchar, numeric, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin", "finance_operator", "support_agent", "super_admin"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended", "pending_verification", "closed"]);
export const txTypeEnum = pgEnum("tx_type", ["deposit", "investment", "earning", "referral_reward", "withdrawal", "refund", "adjustment", "fee"]);
export const txStatusEnum = pgEnum("tx_status", ["pending", "completed", "failed", "reversed"]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", ["pending", "under_review", "approved", "rejected", "processing", "completed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["registration", "referral", "transaction", "withdrawal", "support", "system"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: roleEnum("role").notNull().default("user"),
  accountStatus: accountStatusEnum("account_status").notNull().default("active"),
  referralCode: varchar("referral_code", { length: 12 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 36 }),
  avatar: text("avatar"),
  language: varchar("language", { length: 10 }).default("en"),
  darkMode: boolean("dark_mode").default(false),
  emailVerified: boolean("email_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  idNumber: varchar("id_number", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  upiId: varchar("upi_id", { length: 100 }),
  panNumber: varchar("pan_number", { length: 20 }),
  bio: text("bio"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referralRelationships = pgTable("referral_relationships", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referrerId: varchar("referrer_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  referredId: varchar("referred_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletAccounts = pgTable("wallet_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalInvested: numeric("total_invested", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalEarnings: numeric("total_earnings", { precision: 18, scale: 2 }).notNull().default("0.00"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 18, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  referenceId: varchar("reference_id", { length: 32 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: txTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  status: txStatusEnum("status").notNull().default("completed"),
  description: text("description"),
  relatedReference: varchar("related_reference", { length: 32 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const investmentRecords = pgTable("investment_records", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  planName: varchar("plan_name", { length: 100 }).notNull(),
  ratePercent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  earningsGenerated: numeric("earnings_generated", { precision: 18, scale: 2 }).notNull().default("0.00"),
  ledgerReference: varchar("ledger_reference", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("INR"),
  method: varchar("method", { length: 50 }).notNull().default("bank_transfer"),
  destination: text("destination"),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedBy: varchar("reviewed_by", { length: 36 }),
  ledgerReference: varchar("ledger_reference", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const calculationConfigs = pgTable("calculation_configs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  ratePercent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(),
  ratePeriod: varchar("rate_period", { length: 20 }).notNull().default("daily"),
  minAmount: numeric("min_amount", { precision: 18, scale: 2 }).default("0.00"),
  maxAmount: numeric("max_amount", { precision: 18, scale: 2 }),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  eligibility: text("eligibility"),
  roundingRule: varchar("rounding_rule", { length: 20 }).default("standard"),
  version: integer("version").notNull().default(1),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calculationHistory = pgTable("calculation_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  configId: varchar("config_id", { length: 36 }).references(() => calculationConfigs.id),
  baseAmount: numeric("base_amount", { precision: 18, scale: 2 }).notNull(),
  ratePercent: numeric("rate_percent", { precision: 5, scale: 2 }).notNull(),
  calculatedAmount: numeric("calculated_amount", { precision: 18, scale: 2 }).notNull(),
  isSimulation: boolean("is_simulation").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  assignedTo: varchar("assigned_to", { length: 36 }),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  actorId: varchar("actor_id", { length: 36 }).references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(walletAccounts, { fields: [users.id], references: [walletAccounts.userId] }),
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  referralsGiven: many(referralRelationships),
  ledger: many(ledgerEntries),
}));

